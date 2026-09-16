import fs from "node:fs/promises";

const changes = [];

async function patch(path, apply) {
  const original = await fs.readFile(path, "utf8");
  const hadCrlf = original.includes("\r\n");

  // Git on Windows may checkout tracked files with CRLF.
  // Normalize only while matching, then restore the original EOL style.
  const normalized = original.replace(/\r\n/g, "\n");
  const updated = apply(normalized);

  if (updated === normalized) {
    console.log(`No change needed: ${path}`);
    return;
  }

  const finalText = hadCrlf
    ? updated.replace(/\n/g, "\r\n")
    : updated;

  await fs.writeFile(path, finalText, "utf8");
  changes.push(path);
  console.log(`Updated: ${path}`);
}

function replaceOnce(text, before, after, label) {
  if (text.includes(after)) return text;

  const matches = text.split(before).length - 1;

  if (matches !== 1) {
    throw new Error(
      `${label}: expected exactly one source match, found ${matches}. ` +
        "Your branch may differ from the expected master; stop and review instead of forcing.",
    );
  }

  return text.replace(before, after);
}

await patch(
  "packages/validation/src/assessment.constants.ts",
  (text) =>
    replaceOnce(
      text,
      `  "ONET_IP_60_V1",\n] as const;`,
      `  "ONET_IP_60_V1",\n  "IPIP_BIG_FIVE_50_V1",\n] as const;`,
      "assessment scoring model",
    ),
);

await patch(
  "packages/validation/src/assessment.ts",
  (text) => {
    let output = replaceOnce(
      text,
      `        onetOrder: z.number().int().min(1).max(60).optional(),\n`,
      `        onetOrder: z.number().int().min(1).max(60).optional(),\n` +
        `        sourceItemId: key.optional(),\n` +
        `        sourceOrder: z.number().int().min(1).max(L.questions).optional(),\n` +
        `        scoringDirection: z.enum(["POSITIVE", "REVERSE"]).optional(),\n`,
      "question provenance metadata",
    );

    output = replaceOnce(
      output,
      `  if (config.scoringModel !== "OPTION_SUM_V1")\n    throw new Error("External scoring provider required");`,
      `  if (\n` +
        `    config.scoringModel !== "OPTION_SUM_V1" &&\n` +
        `    config.scoringModel !== "IPIP_BIG_FIVE_50_V1"\n` +
        `  )\n` +
        `    throw new Error("External scoring provider required");`,
      "local personality scoring",
    );

    return output;
  },
);

await patch(
  "apps/worker/src/main.ts",
  (text) =>
    replaceOnce(
      text,
      `      const normalizedDimensions =\n` +
        `        scoringModel === "ONET_IP_60_V1"\n` +
        `          ? Object.fromEntries(\n` +
        `              Object.entries(dimensions).map(([key, value]) => [\n` +
        `                key,\n` +
        `                Math.round((value / 40) * 10000) / 100,\n` +
        `              ]),\n` +
        `            )\n` +
        `          : undefined;`,
      `      const normalizedDimensions =\n` +
        `        scoringModel === "ONET_IP_60_V1"\n` +
        `          ? Object.fromEntries(\n` +
        `              Object.entries(dimensions).map(([key, value]) => [\n` +
        `                key,\n` +
        `                Math.round((value / 40) * 10000) / 100,\n` +
        `              ]),\n` +
        `            )\n` +
        `          : scoringModel === "IPIP_BIG_FIVE_50_V1"\n` +
        `            ? Object.fromEntries(\n` +
        `                Object.entries(dimensions).map(([key, value]) => {\n` +
        `                  const normalized = ((value - 10) / 40) * 100;\n` +
        `\n` +
        `                  return [\n` +
        `                    key,\n` +
        `                    Math.round(\n` +
        `                      Math.max(0, Math.min(100, normalized)) * 100,\n` +
        `                    ) / 100,\n` +
        `                  ];\n` +
        `                }),\n` +
        `              )\n` +
        `            : undefined;`,
      "personality normalization",
    ),
);

await patch(
  "apps/api/src/assessments/assessment.schema.ts",
  (text) => {
    let output = replaceOnce(
      text,
      `export class Assessment {\n  @Prop({ default: false }) isPaid!: boolean;`,
      `export class Assessment {\n` +
        `  @Prop({ trim: true }) stableKey?: string;\n` +
        `  @Prop({ default: false }) isPaid!: boolean;`,
      "assessment stable key schema",
    );

    if (!output.includes(`AssessmentSchema.index({ stableKey: 1 }, { sparse: true });`)) {
      output = replaceOnce(
        output,
        `AssessmentSchema.index({ status: 1, type: 1 });`,
        `AssessmentSchema.index({ status: 1, type: 1 });\n` +
          `AssessmentSchema.index({ stableKey: 1 }, { sparse: true });`,
        "assessment stable key index",
      );
    }

    return output;
  },
);

await patch(
  "apps/api/src/assessments/question.schema.ts",
  (text) =>
    replaceOnce(
      text,
      `  @Prop({ default: 0, min: 0 }) revision!: number;\n  @Prop({ type: SchemaTypes.Mixed, required: true }) content!: QuestionContent;`,
      `  @Prop({ default: 0, min: 0 }) revision!: number;\n` +
        `  @Prop({ type: SchemaTypes.Mixed }) source?: Record<string, unknown>;\n` +
        `  @Prop({ type: SchemaTypes.Mixed, required: true }) content!: QuestionContent;`,
      "question source provenance schema",
    ),
);

await patch(
  "apps/api/src/assessments/assessment-version.schema.ts",
  (text) =>
    replaceOnce(
      text,
      `  @Prop({ type: SchemaTypes.Mixed, required: true })\n  scoringConfiguration!: Record<string, unknown>;\n`,
      `  @Prop({ type: SchemaTypes.Mixed, required: true })\n` +
        `  scoringConfiguration!: Record<string, unknown>;\n` +
        `  @Prop({ type: SchemaTypes.Mixed })\n` +
        `  provenance?: Record<string, unknown>;\n`,
      "assessment version provenance schema",
    ),
);

console.log(
  JSON.stringify(
    {
      ok: true,
      changedFiles: changes,
      scoringModel: "IPIP_BIG_FIVE_50_V1",
    },
    null,
    2,
  ),
);
