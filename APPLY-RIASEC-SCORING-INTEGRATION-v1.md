# Future Fit RIASEC 60 scoring integration v1

This package moves the 60-question RIASEC assessment into the real Future Fit
assessment engine.

It does NOT use O*NET career recommendations for this new 60-item model.
O*NET is used only to score the six RIASEC dimensions. Future Fit career
matching remains a separate later step.

## 1. Unzip from repo root

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"
unzip -o "/c/Users/shiva/Downloads/future-fit-riasec-scoring-integration-v1.zip" -d .
```

## 2. Patch current branch files

```bash
node scripts/apply-riasec-60-source-patches.mjs
```

## 3. Build/typecheck before touching the assessment version

```bash
pnpm --filter @future-fit/validation build
pnpm --filter @future-fit/api build
pnpm --filter @future-fit/worker build
```

Stop if any build fails.

## 4. Publish the 60-item bilingual RIASEC assessment

```bash
cd apps/api
node --env-file=../../.env scripts/publish-onet-interest-profiler-60.mjs
node --env-file=../../.env scripts/verify-onet-interest-profiler-60-published.mjs
```

Expected verifier:

```json
{
  "ok": true,
  "questions": 60,
  "scoringModel": "ONET_IP_60_V1",
  "bilingual": true
}
```

## 5. Smoke-test live O*NET score + normalization + DB save

```bash
node --env-file=../../.env scripts/smoke-test-onet-interest-profiler-60-scoring.mjs
cd ../..
```

The balanced test `12345` repeated 12 times should produce raw scores around:

```text
R=20 I=20 A=20 S=20 E=20 C=20
```

and normalized:

```text
R=50 I=50 A=50 S=50 E=50 C=50
```

The smoke record is stored only in:

```text
assessment_scoring_smoke_tests
```

Real student results continue to be stored by the worker in:

```text
assessment_results
```

For `ONET_IP_60_V1`, worker saves:
- `dimensions` = raw O*NET scores
- `normalizedDimensions` = 0–100 Future Fit display scores
- `careerMatches` = empty for now

Do not add O*NET career matches to this model; Future Fit career matching will
be connected to the curated India-first career model separately.
