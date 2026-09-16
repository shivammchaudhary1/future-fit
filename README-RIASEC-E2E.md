# RIASEC real assessment pipeline test

This tests:

assessment_attempts
→ BullMQ / worker
→ O*NET 60-item scoring
→ raw RIASEC scores
→ Future Fit normalized scores
→ assessment_results

## Terminal 1 — worker

From repo root:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"
pnpm --filter @future-fit/worker dev
```

Leave this terminal running.

## Terminal 2 — create a submitted student attempt

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit/apps/api"

node --env-file=../../.env scripts/create-riasec-e2e-attempt.mjs
```

Then verify:

```bash
node --env-file=../../.env scripts/verify-riasec-e2e-result.mjs
```

Expected balanced pattern result:

```text
raw: 20 / 20 / 20 / 20 / 20 / 20
normalized: 50 / 50 / 50 / 50 / 50 / 50
careerMatchesCount: 0
```

`careerMatchesCount: 0` is intentional for ONET_IP_60_V1.
Future Fit career matching will be implemented separately against the India-first career model.
