import fs from "node:fs/promises";

const path = "apps/web/src/app/assessment/[attemptId]/page.tsx";
const original = await fs.readFile(path, "utf8");
const hadCrlf = original.includes("\r\n");
let text = original.replace(/\r\n/g, "\n");

function replaceOnce(before, after, label) {
  if (text.includes(after)) return;

  const matches = text.split(before).length - 1;

  if (matches !== 1) {
    throw new Error(
      `${label}: expected exactly one source match, found ${matches}. ` +
        "Stop and review instead of forcing the change.",
    );
  }

  text = text.replace(before, after);
}

replaceOnce(
  `import {\n  questionnaireMessages,\n  type QuestionnaireLanguage,\n} from "@/config/questionnaire.constants";`,
  `import {\n  questionnaireKindFromVersion,\n  questionnaireMessages,\n  type QuestionnaireLanguage,\n} from "@/config/questionnaire.constants";`,
  "questionnaire import",
);

replaceOnce(
  `interface Payload {\n  attempt: Attempt;\n  version: { questions: Question[] };\n}`,
  `interface Payload {\n  attempt: Attempt;\n  version: { version: string; questions: Question[] };\n}`,
  "attempt payload version",
);

replaceOnce(
  `  const messages = questionnaireMessages(language);`,
  `  const assessmentKind = questionnaireKindFromVersion(\n    payload?.version.version,\n  );\n  const messages = questionnaireMessages(language, assessmentKind);`,
  "dynamic questionnaire copy",
);

const finalText = hadCrlf
  ? text.replace(/\n/g, "\r\n")
  : text;

await fs.writeFile(path, finalText, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      updated: path,
      behavior:
        "Questionnaire title/description/instruction now switch by assessment version without changing answer/save/submit logic.",
    },
    null,
    2,
  ),
);
