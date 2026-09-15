import crypto from "node:crypto";

export function normalizeCareerTitle(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function slugifyCareerTitle(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replaceAll("&", " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) =>
          left.localeCompare(right),
        )
        .map(([key, nested]) => [
          key,
          canonicalize(nested),
        ]),
    );
  }

  return value;
}

export function stableFingerprint(value) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify(canonicalize(value)),
    )
    .digest("hex");
}

export function validateSourceRecord(record) {
  const required = [
    "sourceType",
    "sourceRecordKey",
    "sourceVersion",
    "candidateSlug",
    "normalizedTitle",
    "title",
    "verificationStatus",
    "provenance",
    "fingerprint",
  ];

  for (const field of required) {
    if (
      record[field] === undefined ||
      record[field] === null ||
      record[field] === ""
    ) {
      throw new Error(
        `Career source record is missing ${field}`,
      );
    }
  }

  if (
    normalizeCareerTitle(record.title) !==
    record.normalizedTitle
  ) {
    throw new Error(
      `normalizedTitle mismatch for ${record.title}`,
    );
  }

  return true;
}
