import PDFDocument from "pdfkit";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import type { Interpretation } from "./ai/contract.js";
export interface ReportInput {
  attemptId: string;
  language: "en" | "hi";
  dimensions: Record<string, number>;
  careerMatches: Record<string, unknown>[];
  interpretation: Interpretation;
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
