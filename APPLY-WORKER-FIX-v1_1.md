# Worker-only fix v1.1

The previous patch already updated:
- packages/validation/src/assessment.constants.ts
- packages/validation/src/assessment.ts
- apps/api/src/assessments/result.schema.ts

It failed only on `apps/worker/src/main.ts`.

Run from repository root:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-riasec-worker-fix-v1_1.zip" -d .
node scripts/apply-riasec-60-worker-fix-v1_1.mjs
```

Then build:

```bash
pnpm --filter @future-fit/validation build
pnpm --filter @future-fit/api build
pnpm --filter @future-fit/worker build
```

Do not rerun the old `apply-riasec-60-source-patches.mjs`.
