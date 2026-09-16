# Future Fit — Personality Assessment UI v1

This package completes the student-facing Personality Assessment UI while
preserving the existing Interest Assessment.

## Included

- Personality Assessment card on `/assessments`
- English/Hindi public copy
- 50-question questionnaire using the existing stable questionnaire engine
- questionnaire title/description changes automatically by assessment version
- no provider/source terminology is shown to students
- Personality result card on `/results`
- 5 normalized personality dimensions
- normalized score `x / 100`
- percentage `%`
- full result page
- Interest Assessment result UI remains supported
- backend, DB, worker scoring and assessment version are not modified

## Branch

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"

git checkout master
git pull --ff-only origin master
git checkout -b feat/personality-assessment-ui-v1
```

## Apply

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-personality-ui-v1.zip" -d .

node scripts/apply-personality-ui-v1.mjs
```

## Verify

```bash
pnpm --filter @future-fit/web lint
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/web build
```

## Run production build

```bash
pnpm --filter @future-fit/web start
```

Open:

```text
http://localhost:3000/assessments
```

Expected:
- Interest Assessment card
- Personality Assessment card
- Personality Assessment opens 50 questions
- English/Hindi toggle works
- submitting routes to Results
- `/results` shows both current Interest and Personality results
- Personality detail shows 5 dimensions with normalized score and percentage
