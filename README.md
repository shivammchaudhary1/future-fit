# Future Fit

Future Fit is an assessment-first career guidance platform for Indian students in Classes 9–12.

The repository is a pnpm/Turborepo monorepo with:

- `apps/web` — Next.js student and management UI
- `apps/api` — NestJS API
- `apps/worker` — BullMQ scoring/report worker
- `packages/*` — shared config, types and validation
- MongoDB — application data
- Redis — queues and background processing

The current student assessment flow supports a published 60-question bilingual RIASEC Interest Profiler, autosaved attempts, worker-based scoring, raw O*NET RIASEC scores and Future Fit normalized scores.

## Prerequisites

Use the project versions where possible:

```bash
node --version
pnpm --version
docker --version
```

Recommended local setup:

- Node.js 24+
- pnpm 11+
- Docker Desktop
- MongoDB Atlas through `MONGODB_URI`, or a local MongoDB service
- Redis on `localhost:6379`

## Install

From the repository root:

```bash
pnpm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Fill the required local values in `.env`.

Do not commit `.env`, API keys, database credentials, JWT secrets or other private credentials.

## Pull the latest master and create a feature branch

```bash
git checkout master
git pull --ff-only origin master
git checkout -b feat/questionnaire-ui-i18n-auth-guard
```

## Development

Start Redis:

```bash
docker compose up -d redis
```

For the full monorepo:

```bash
pnpm dev
```

Or run the main services separately.

Terminal 1 — API:

```bash
pnpm --filter @future-fit/api dev
```

Terminal 2 — worker:

```bash
pnpm --filter @future-fit/worker dev
```

Terminal 3 — web:

```bash
pnpm --filter @future-fit/web dev
```

The web app runs on:

```text
http://localhost:3000
```

The API uses `API_PORT` from `.env`. Swagger is available at:

```text
http://localhost:<API_PORT>/api/docs
```

Health endpoint:

```text
http://localhost:<API_PORT>/api/v1/health
```

## Questionnaire frontend

The student questionnaire supports:

- one-question-at-a-time focused UI
- responsive desktop/mobile layout
- English/Hindi display switch
- only the selected language is shown
- 1–5 keyboard shortcuts for RIASEC/Likert questions
- direct question navigation
- answered/remaining progress
- required-question validation
- automatic draft persistence
- background answer sync
- save and exit
- final submission protection
- submitted-state handling

When a new personal assessment is started, the language selected on the Assessments page is sent to the API as the attempt language.

Inside the questionnaire, the language switch changes the displayed bilingual question and option content without showing both languages together.

## Authentication page protection

Authenticated users are prevented from remaining on guest authentication routes such as:

```text
/login
/register
/forgot-password
/reset-password
/verify-email
```

The auth route group waits for session restoration. If a valid user is already authenticated, it resolves their access context and redirects them to their default Future Fit workspace.

## RIASEC local verification

From `apps/api`:

```bash
node --env-file=../../.env scripts/verify-riasec-backend-ready.mjs
```

A ready backend should report:

```text
ok: true
published: true
questions: 60
scoringModel: ONET_IP_60_V1
aiRequiredForCoreResult: false
reportRequiredForCoreResult: false
```

AI interpretation and PDF reporting are optional later layers and do not block the core RIASEC result.

## Lint, typecheck and tests

Run all workspace checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

For quick frontend verification only:

```bash
pnpm --filter @future-fit/web lint
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/web build
```

For the assessment/API/worker path:

```bash
pnpm --filter @future-fit/validation build
pnpm --filter @future-fit/api test
pnpm --filter @future-fit/worker test
```

## Production build

Build the complete monorepo:

```bash
pnpm build
```

Or build the main services individually:

```bash
pnpm --filter @future-fit/web build
pnpm --filter @future-fit/api build
pnpm --filter @future-fit/worker build
```

## Run the production build for a quick check

Make sure Redis and your configured MongoDB are available first.

Terminal 1:

```bash
docker compose up -d redis
pnpm --filter @future-fit/api start
```

Terminal 2:

```bash
pnpm --filter @future-fit/worker start
```

Terminal 3:

```bash
pnpm --filter @future-fit/web start
```

Open:

```text
http://localhost:3000
```

Then quickly verify:

1. Log in as a student.
2. Open `/assessments`.
3. Select English or Hindi.
4. Start the RIASEC assessment.
5. Confirm only the selected language is visible.
6. Answer several questions and refresh to verify draft recovery.
7. Complete all 60 questions.
8. Submit.
9. Open Results and verify the scored result is available.
10. While logged in, manually open `/login` and confirm you are redirected away from the authentication page.

## Before committing

```bash
git status
pnpm --filter @future-fit/web lint
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/web build
```

Then commit and push:

```bash
git add -A
git commit -m "Build bilingual questionnaire experience and auth route guard"
git push -u origin feat/questionnaire-ui-i18n-auth-guard
```
