import PDFDocument from "pdfkit";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface Interpretation {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  actionPlan: string[];
}
export interface ReportInput {
  attemptId: string;
  language: "en" | "hi";
  dimensions: Record<string, number>;
  careerMatches: Record<string, unknown>[];
  interpretation: Interpretation;
}

export async function interpret(
  input: Omit<ReportInput, "interpretation">,
): Promise<Interpretation> {
  const endpoint = process.env.AI_INTERPRETATION_URL;
  const apiKey = process.env.AI_INTERPRETATION_KEY;
  if (!endpoint || !apiKey)
    throw new Error("AI interpretation provider is not configured");
  if (new URL(endpoint).protocol !== "https:")
    throw new Error("AI provider requires HTTPS");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      language: input.language,
      dimensions: input.dimensions,
      matches: input.careerMatches,
      instruction:
        "Explain supplied scores without changing them. Avoid diagnosis or guaranteed career outcomes. Return summary, strengths, growthAreas, actionPlan.",
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`AI provider status ${response.status}`);
  const value: unknown = await response.json();
  if (
    !value ||
    typeof value !== "object" ||
    !("summary" in value) ||
    typeof value.summary !== "string" ||
    value.summary.length > 10_000
  )
    throw new Error("Invalid AI summary");
  const list = (key: string) => {
    const field = (value as Record<string, unknown>)[key];
    if (
      !Array.isArray(field) ||
      field.length > 20 ||
      field.some((s) => typeof s !== "string" || s.length > 2000)
    )
      throw new Error("Invalid AI interpretation list");
    return field as string[];
  };
  return {
    summary: value.summary,
    strengths: list("strengths"),
    growthAreas: list("growthAreas"),
    actionPlan: list("actionPlan"),
  };
}

export async function createReport(input: ReportInput) {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey)
    throw new Error("Private report storage is not configured");
  const font = process.env.REPORT_FONT_PATH;
  if (input.language === "hi" && !font)
    throw new Error(
      "A Devanagari report font must be configured for Hindi reports",
    );
  const document = new PDFDocument({
    size: "A4",
    margin: 50,
    info: { Title: "Future Fit Career Assessment" },
  });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });
  if (font) document.font(font);
  document.fontSize(22).text("Future Fit").moveDown();
  document.fontSize(11).text(input.interpretation.summary).moveDown();
  for (const [dimension, score] of Object.entries(input.dimensions))
    document.text(`${dimension}: ${score}`);
  for (const [heading, lines] of Object.entries({
    Strengths: input.interpretation.strengths,
    "Growth areas": input.interpretation.growthAreas,
    "Action plan": input.interpretation.actionPlan,
  })) {
    document.moveDown().fontSize(15).text(heading).fontSize(11);
    lines.forEach((line) => document.text(`• ${line}`));
  }
  document
    .moveDown()
    .text(
      "These results support exploration and guidance; they are not a diagnosis or a guarantee of career success.",
    );
  document.end();
  const body = await completed;
  const key = `reports/${input.attemptId}.pdf`;
  const storage = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  try {
    await storage.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "application/pdf",
        CacheControl: "private, no-store",
      }),
    );
  } finally {
    storage.destroy();
  }
  return key;
}
