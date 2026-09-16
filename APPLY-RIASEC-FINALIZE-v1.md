# Future Fit RIASEC Finalize v1

This package finishes the three remaining RIASEC backend items:

1. AI/PDF report is now optional. A valid RIASEC score becomes `RESULT_READY`
   even when AI and R2 are not configured.
2. A real protected API E2E flow tests:
   start → 60 answers → save → submit → worker → O*NET → result API.
3. The 60-question local bilingual bank is checked against the approved
   O*NET source-item sequence per RIASEC area and the approved Future Fit
   English/Hindi adaptations.

## Step 1 — replace files

From repo root:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"

cp apps/worker/src/main.ts apps/worker/src/main.ts.before-riasec-final
cp apps/api/src/assessments/result.schema.ts apps/api/src/assessments/result.schema.ts.before-riasec-final

unzip -o "/c/Users/shiva/Downloads/future-fit-riasec-finalize-v1.zip" -d .
```

Do NOT run the older RIASEC patch scripts after this.

## Step 2 — build

```bash
pnpm --filter @future-fit/validation build
pnpm --filter @future-fit/api build
pnpm --filter @future-fit/worker build
```

Stop if any build fails.

## Step 3 — repair the already-scored attempt that failed only because AI was absent

```bash
cd apps/api

node --env-file=../../.env scripts/repair-riasec-pre-ai-results.mjs
```

## Step 4 — final bilingual/source question-bank verification

```bash
node --env-file=../../.env scripts/verify-riasec-question-bank-final.mjs
```

Expected:

```json
{
  "ok": true,
  "checkedSourceQuestions": 60,
  "sourceTextAlignment": true,
  "bilingualAdaptationAlignment": true,
  "publishedSnapshotAlignment": true,
  "failures": []
}
```

## Step 5 — run Redis + API + worker

Terminal 1:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"
docker compose up -d redis
pnpm --filter @future-fit/worker dev
```

Terminal 2:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"
pnpm --filter @future-fit/api dev
```

The API must be on port 8080 for the default E2E URL. If your API runs
elsewhere, set `E2E_API_BASE_URL`.

## Step 6 — real student API E2E

Terminal 3:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit/apps/api"

node --env-file=../../.env scripts/e2e-riasec-student-api-flow.mjs
```

Expected core result:

```text
ok: true
questionCount: 60
savedAnswerCount: 60
finalAttemptStatus: RESULT_READY
resultStatus: READY
aiStatus: NOT_CONFIGURED
reportStatus: NOT_CONFIGURED
rawScores: 20 each
normalizedScores: 50 each
careerMatchesCount: 0
```

The E2E temporary user/session/attempt/result are automatically removed after
a successful test. Set `E2E_KEEP_DATA=1` if you want to keep them.

## Step 7 — backend readiness

```bash
node --env-file=../../.env scripts/verify-riasec-backend-ready.mjs
```

At this point the RIASEC backend core is complete. AI interpretation, PDF
reporting, and Future Fit India-first career matching remain separate future
layers and do not block a student's RIASEC result.
