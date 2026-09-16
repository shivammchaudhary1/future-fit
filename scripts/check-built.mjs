import fs from "node:fs";
import path from "node:path";

const required = [
  {
    name: "API",
    path: "apps/api/dist/main.js",
  },
  {
    name: "Worker",
    path: "apps/worker/dist/main.js",
  },
  {
    name: "Web",
    path: "apps/web/.next/BUILD_ID",
  },
];

const missing = required.filter(
  (item) => !fs.existsSync(path.resolve(process.cwd(), item.path)),
);

if (missing.length > 0) {
  console.error("Production build is missing:");
  for (const item of missing) {
    console.error(`- ${item.name}: ${item.path}`);
  }
  console.error("\nRun this first:\n  pnpm build:all");
  process.exit(1);
}

console.log("Production build found for API, Worker and Web.");
