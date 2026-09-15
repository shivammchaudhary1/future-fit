# Future Fit workspace USER -> STUDENT fix v3.1

The v3 role repair changed the allowed workspace type from `USER` to `STUDENT`,
but five student-only route layouts still referenced the old `"USER"` value.

This patch changes only these five route guards:

```text
apps/web/src/app/assessment/layout.tsx
apps/web/src/app/assessments/layout.tsx
apps/web/src/app/careers/layout.tsx
apps/web/src/app/payments/layout.tsx
apps/web/src/app/results/layout.tsx
```

Each now uses:

```tsx
<WorkspaceBoundary workspace="STUDENT">
```

## Apply

From the Future Fit repository root:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-workspace-user-to-student-fix-v3-1.zip" -d .
```

## Validate

Run:

```bash
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/api typecheck
pnpm --filter @future-fit/api test
```

Only after all three pass, continue with the Atlas development seed/repair:

```bash
pnpm --filter @future-fit/api dev:seed:users
pnpm --filter @future-fit/api exec node --env-file=../../.env scripts/verify-dev-access.mjs
```

Do not change the database before the code validation passes.
