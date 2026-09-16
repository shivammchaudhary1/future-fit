import fs from "node:fs/promises";

const file = "apps/worker/src/main.ts";
let source = await fs.readFile(file, "utf8");

function requireReplace(label, pattern, replacement) {
  const before = source;
  source = source.replace(pattern, replacement);
  if (source === before) {
    throw new Error(`Could not apply ${label}. The worker source shape is different than expected.`);
  }
  console.log(`applied ${label}`);
}

// 1) Expand scoring-model condition.
if (!source.includes('scoringModel === "ONET_IP_60_V1"')) {
  requireReplace(
    "60-item scoring model condition",
    /if\s*\(\s*version\.scoringConfiguration\.scoringModel\s*===\s*"ONET_MINI_IP_V2"\s*\)\s*\{/,
    `if (
        version.scoringConfiguration.scoringModel === "ONET_MINI_IP_V2" ||
        version.scoringConfiguration.scoringModel === "ONET_IP_60_V1"
      ) {`,
  );
} else {
  console.log("skip scoring-model condition (already applied)");
}

// 2) Make answer count 30 or 60 depending on scoring model.
if (!source.includes("expectedAnswerCount")) {
  requireReplace(
    "dynamic O*NET answer count",
    /if\s*\(\s*!\s*\/\^\[1-5\]\{30\}\$\/\.test\(answers\)\s*\)\s*throw new Error\(\s*"O\*NET requires exactly 30 ordered answers"\s*\);/,
    `const expectedAnswerCount =
          version.scoringConfiguration.scoringModel === "ONET_IP_60_V1"
            ? 60
            : 30;
        const answerPattern = new RegExp(\`^[1-5]{\${expectedAnswerCount}}$\`);
        if (!answerPattern.test(answers))
          throw new Error(
            \`O*NET requires exactly \${expectedAnswerCount} ordered answers\`,
          );`,
  );
} else {
  console.log("skip dynamic answer count (already applied)");
}

// 3) Do NOT request O*NET career matches for new 60-item Future Fit model.
//    Keep old behavior only for ONET_MINI_IP_V2.
if (!source.includes('version.scoringConfiguration.scoringModel === "ONET_MINI_IP_V2") {\n          const matches')) {
  requireReplace(
    "separate O*NET career matching",
    /await stage\(PROCESS_STATES\.matching\);\s*const matches = await onet\("\/mnm\/interestprofiler\/careers", answers\);\s*if\s*\(\s*!Array\.isArray\(matches\.career\)\s*\|\|\s*!matches\.career\.every\(isRecord\)\s*\)\s*throw new Error\("Invalid O\*NET career response"\);\s*careerMatches = matches\.career;/,
    `await stage(PROCESS_STATES.matching);
        if (version.scoringConfiguration.scoringModel === "ONET_MINI_IP_V2") {
          const matches = await onet("/mnm/interestprofiler/careers", answers);
          if (!Array.isArray(matches.career) || !matches.career.every(isRecord))
            throw new Error("Invalid O*NET career response");
          careerMatches = matches.career;
        }
        if (version.scoringConfiguration.scoringModel === "ONET_IP_60_V1") {
          careerMatches = [];
        }`,
  );
} else {
  console.log("skip career matching split (already applied)");
}

// 4) Calculate 0-100 normalized scores for 60-item O*NET result.
if (!source.includes("const normalizedDimensions")) {
  requireReplace(
    "normalized dimensions calculation",
    /(\s*)await results\.updateOne\(\s*\n\s*\{ attemptId \},/,
    `$1const normalizedDimensions =
        version.scoringConfiguration.scoringModel === "ONET_IP_60_V1"
          ? Object.fromEntries(
              Object.entries(dimensions).map(([key, value]) => [
                key,
                Math.round((value / 40) * 10000) / 100,
              ]),
            )
          : undefined;
$1await results.updateOne(
        { attemptId },`,
  );
} else {
  console.log("skip normalized dimensions calculation (already applied)");
}

// 5) Save normalized dimensions alongside raw dimensions.
if (!source.includes("dimensions,\n            normalizedDimensions,")) {
  requireReplace(
    "normalized dimensions persistence",
    /(\s+dimensions,\s*\n)(\s+careerMatches,)/,
    `$1            normalizedDimensions,\n$2`,
  );
} else {
  console.log("skip normalized persistence (already applied)");
}

await fs.writeFile(file, source, "utf8");
console.log("worker patch complete");
