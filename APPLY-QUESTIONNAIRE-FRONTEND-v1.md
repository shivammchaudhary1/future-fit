# Apply Future Fit Questionnaire Frontend v1

This package is based on the latest inspected `master` context after the RIASEC merge.

## 1. Update local master and create the new branch

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"

git checkout master
git pull --ff-only origin master
git checkout -b feat/questionnaire-ui-i18n-auth-guard
```

## 2. Apply the package

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-questionnaire-frontend-v1.zip" -d .
```

## 3. Verify

```bash
pnpm --filter @future-fit/web lint
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/web build
```

Do not push if one of these commands fails.

## 4. Run locally

Terminal 1:

```bash
docker compose up -d redis
pnpm --filter @future-fit/api dev
```

Terminal 2:

```bash
pnpm --filter @future-fit/worker dev
```

Terminal 3:

```bash
pnpm --filter @future-fit/web dev
```

Open `http://localhost:3000`.

## 5. Verify behavior

- Logged-in users cannot remain on `/login`, `/register`, password recovery or email verification pages.
- `/assessments` lets the student choose English or Hindi before starting.
- Questionnaire displays only one selected language.
- Questionnaire supports direct question navigation, 1–5 shortcuts, autosave, sync state, responsive layout, required-question protection and submit.
- RIASEC scoring remains unchanged.

## 6. Commit and push after verification

```bash
git status
git add -A
git commit -m "Build bilingual questionnaire experience and auth route guard"
git push -u origin feat/questionnaire-ui-i18n-auth-guard
```
