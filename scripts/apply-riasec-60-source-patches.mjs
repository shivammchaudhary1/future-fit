import fs from "node:fs/promises";

async function patchFile(file, transforms) {
  let source = await fs.readFile(file, "utf8");
  const original = source;

  for (const transform of transforms) {
    const next = transform(source);
    if (next === source) {
      throw new Error(`Patch did not match expected source in ${file}`);
    }
    source = next;
  }

  await fs.writeFile(file, source, "utf8");
  console.log(`patched ${file}`);

  return source !== original;
}

await patchFile("packages/validation/src/assessment.constants.ts", [
  (s) =>
    s.replace(
      'export const SCORING_MODELS = ["OPTION_SUM_V1", "ONET_MINI_IP_V2"] as const;',
      'export const SCORING_MODELS = [\n  "OPTION_SUM_V1",\n  "ONET_MINI_IP_V2",\n  "ONET_IP_60_V1",\n] as const;',
    ),
]);

await patchFile("packages/validation/src/assessment.ts", [
  (s) =>
    s.replace(
      'onetOrder: z.number().int().min(1).max(30).optional(),',
      'onetOrder: z.number().int().min(1).max(60).optional(),',
    ),
]);

await patchFile("apps/api/src/assessments/result.schema.ts", [
  (s) =>
    s.replace(
      '  @Prop({ type: [SchemaTypes.Mixed], default: [] }) careerMatches!: Array<',
      '  @Prop({ type: SchemaTypes.Mixed }) normalizedDimensions?: Record<\n' +
        '    string,\n' +
        '    number\n' +
        '  >;\n' +
        '  @Prop({ type: [SchemaTypes.Mixed], default: [] }) careerMatches!: Array<',
    ),
]);

await patchFile("apps/worker/src/main.ts", [
  (s) =>
    s.replace(
      '      if (version.scoringConfiguration.scoringModel === "ONET_MINI_IP_V2") {',
      '      if (\n' +
        '        version.scoringConfiguration.scoringModel === "ONET_MINI_IP_V2" ||\n' +
        '        version.scoringConfiguration.scoringModel === "ONET_IP_60_V1"\n' +
        '      ) {',
    ),
  (s) =>
    s.replace(
      '        if (!/^[1-5]{30}$/.test(answers))\n' +
        '          throw new Error("O*NET requires exactly 30 ordered answers");',
      '        const expectedAnswerCount =\n' +
        '          version.scoringConfiguration.scoringModel === "ONET_IP_60_V1"\n' +
        '            ? 60\n' +
        '            : 30;\n' +
        '        const answerPattern = new RegExp(`^[1-5]{${expectedAnswerCount}}$`);\n' +
        '        if (!answerPattern.test(answers))\n' +
        '          throw new Error(\n' +
        '            `O*NET requires exactly ${expectedAnswerCount} ordered answers`,\n' +
        '          );',
    ),
  (s) =>
    s.replace(
      '        await stage(PROCESS_STATES.matching);\n' +
        '        const matches = await onet("/mnm/interestprofiler/careers", answers);\n' +
        '        if (!Array.isArray(matches.career) || !matches.career.every(isRecord))\n' +
        '          throw new Error("Invalid O*NET career response");\n' +
        '        careerMatches = matches.career;',
      '        await stage(PROCESS_STATES.matching);\n' +
        '        if (version.scoringConfiguration.scoringModel === "ONET_MINI_IP_V2") {\n' +
        '          const matches = await onet("/mnm/interestprofiler/careers", answers);\n' +
        '          if (!Array.isArray(matches.career) || !matches.career.every(isRecord))\n' +
        '            throw new Error("Invalid O*NET career response");\n' +
        '          careerMatches = matches.career;\n' +
        '        }\n' +
        '        if (version.scoringConfiguration.scoringModel === "ONET_IP_60_V1") {\n' +
        '          careerMatches = [];\n' +
        '        }',
    ),
  (s) =>
    s.replace(
      '      await results.updateOne(\n' +
        '        { attemptId },',
      '      const normalizedDimensions =\n' +
        '        version.scoringConfiguration.scoringModel === "ONET_IP_60_V1"\n' +
        '          ? Object.fromEntries(\n' +
        '              Object.entries(dimensions).map(([key, value]) => [\n' +
        '                key,\n' +
        '                Math.round((value / 40) * 10000) / 100,\n' +
        '              ]),\n' +
        '            )\n' +
        '          : undefined;\n' +
        '      await results.updateOne(\n' +
        '        { attemptId },',
    ),
  (s) =>
    s.replace(
      '            dimensions,\n' +
        '            careerMatches,',
      '            dimensions,\n' +
        '            normalizedDimensions,\n' +
        '            careerMatches,',
    ),
]);

console.log("RIASEC 60 source patches applied.");
