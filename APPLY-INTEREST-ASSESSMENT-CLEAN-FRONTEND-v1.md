# Interest Assessment frontend cleanup

This patch changes only frontend-facing labels/copy.

It does **not** change:
- the existing 60 Indian-adapted questions
- answer order
- scoring model
- O*NET scoring integration on the backend
- saved assessment data

Frontend behavior:
- Shows `Interest Assessment`
- Shows only the selected language
- Uses a short student-friendly description
- Hides provider/source terminology such as O*NET/RIASEC from the student-facing assessment card

## Apply

From repo root:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-interest-assessment-clean-frontend-v2.zip" -d .
```

Then verify:

```bash
pnpm --filter @future-fit/web lint
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/web build
```

This v2 package also preserves the questionnaire lint fix for multi-select answers.
