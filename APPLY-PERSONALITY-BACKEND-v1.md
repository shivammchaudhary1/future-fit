# Apply Personality Assessment backend v1

## 1. Create the feature branch first

From repo root:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"

git checkout master
git pull --ff-only origin master
git checkout -b feat/personality-assessment-backend-v1
```

## 2. Extract this ZIP into the repo root

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-personality-backend-v1.1.zip" -d .
```

## 3. Apply the safe targeted backend changes

```bash
node scripts/apply-personality-backend-v1.mjs
```

The patcher supports both LF and Windows CRLF checkouts. It still stops instead of forcing a change if the expected source code does not match the current master.

## 4. Build/typecheck backend packages

```bash
pnpm --filter @future-fit/validation build
pnpm --filter @future-fit/api build
pnpm --filter @future-fit/worker build
```

## 5. Prefill/publish the Personality Assessment into MongoDB

Run from repo root:

```bash
node --env-file=.env apps/api/scripts/publish-personality-ipip-bffm-50.mjs
```

Important expected values:

```text
ok: true
name: Personality Assessment
questions: 50
scoringModel: IPIP_BIG_FIVE_50_V1
rawRangePerDimension: 10..50
normalizedRangePerDimension: 0..100
```

## 6. Verify the DB/question/scoring setup

```bash
node --env-file=.env apps/api/scripts/verify-personality-ipip-bffm-50.mjs
```

Expected:

```text
ok: true
questions: 50
scoringModel: IPIP_BIG_FIVE_50_V1
neutralAnswerExpectedRaw: 30
neutralAnswerExpectedNormalized: 50
failures: []
```

## 7. Final git check

```bash
git status --short
```

Do not commit until the build and DB verification both pass.

## What is intentionally NOT included yet

This package completes the backend + database prefill only.

The existing frontend may list the published Personality Assessment because
the generic assessment API returns published assessments, but dedicated
Personality result UI is a separate next step.
