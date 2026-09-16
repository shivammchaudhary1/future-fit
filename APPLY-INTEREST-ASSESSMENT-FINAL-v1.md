# Future Fit Interest Assessment — final production cleanup

This patch implements the agreed Interest Assessment flow:

- Students see exactly one `Interest Assessment`.
- The obsolete 24-question Future Fit pilot is not part of the student experience.
- The production assessment remains the existing 60-question bilingual Indian-adapted version.
- Student-facing UI does not expose provider/source terminology.
- English/Hindi selection remains supported and only the selected language is shown.
- The existing 60-answer scoring integration is not changed.
- Historical pilot data is preserved; the old pilot is archived rather than deleted.

## Apply the patch

From repo root:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"

unzip -o "/c/Users/shiva/Downloads/future-fit-interest-assessment-final-v1.zip" -d .
```

## One-time database cleanup

This validates the existing 60-question production version **before** making any metadata/status change.

```bash
cd apps/api

node --env-file=../../.env scripts/finalize-interest-assessment-production.mjs
```

Expected important fields:

```text
ok: true
productionQuestions: 60
bilingualQuestions: true
pilotArchived: true
scoringLogicChanged: false
productionVersionChanged: false
```

If `pilotArchived` is `false`, it means the exact old pilot was already absent/archived.

## Verify database state

```bash
node --env-file=../../.env scripts/verify-interest-assessment-production.mjs
```

Expected:

```text
ok: true
publishedInterestAssessments: 1
productionQuestions: 60
bilingual: true
obsolete24QuestionPilotPublished: false
studentFacingName: Interest Assessment
```

## Verify frontend

From repo root:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"

pnpm --filter @future-fit/web lint
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/web build
```

Run the production web build:

```bash
pnpm --filter @future-fit/web start
```

Open:

```text
http://localhost:3000/assessments
```

You should see one Interest Assessment card, not two.

Starting it should open the existing 60-question bilingual questionnaire.
