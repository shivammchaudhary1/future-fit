# Future Fit

Future Fit is an assessment-first career guidance platform for Indian students,
primarily Classes 9–12.

## Purpose

The goal is to understand a student's interests, personality, aptitude, values
and academic preferences, then combine those signals into a transparent
Student Fit Profile for future career guidance.

Core assessment scores are deterministic. AI may later explain results, but AI
must not calculate the core assessment score.

Future Fit Alignment should be treated as guidance, not a guarantee of career
success, intelligence, mental health, or future performance.

## Current Assessments

### 1. Interest Assessment

**Purpose:** understand the kinds of activities and work styles a student
naturally enjoys.

**Foundation:** O*NET Interest Profiler, 60 questions.

**Internal dimensions:**
- Realistic
- Investigative
- Artistic
- Social
- Enterprising
- Conventional

The student-facing product name remains **Interest Assessment**. Provider and
scoring implementation details stay internal.

Future Fit stores the bilingual India-focused wording in canonical JSON while
preserving original source/provenance information.

Scoring model:

```text
ONET_IP_60_V1
```

Canonical data:

```text
data/bootstrap/assessments/interest-assessment.onet-ip-60-india.v1.json
```

### 2. Personality Assessment

**Purpose:** understand broad personality tendencies that can later be combined
with interests and other assessment dimensions.

**Foundation:** International Personality Item Pool (IPIP), Goldberg (1992)
Big-Five Factor Markers, 50-item short scales.

There are 50 questions, 10 per factor.

**Internal dimensions:**
- Extraversion
- Agreeableness
- Conscientiousness
- Emotional Stability
- Intellect or Imagination

The assessment uses positive and reverse-keyed items. Scoring is completely
local and deterministic.

Raw score per factor:

```text
10–50
```

Normalized score:

```text
((raw - 10) / 40) * 100
```

Scoring model:

```text
IPIP_BIG_FIVE_50_V1
```

Canonical data:

```text
data/bootstrap/assessments/personality-assessment.ipip-bffm-50-india.v1.json
```

The Personality Assessment describes tendencies; it is not a clinical or mental
health diagnosis.

## Stack

- Web: Next.js
- API: NestJS
- Worker: BullMQ
- Database: MongoDB
- Queue/cache: Redis
- Monorepo: pnpm + Turborepo
- Languages: English + Hindi

Main applications:

```text
apps/web
apps/api
apps/worker
```

## Setup

Install dependencies:

```bash
pnpm install
```

Create local environment file:

```bash
cp .env.example .env
```

Do not commit database credentials, API keys, JWT secrets, or credential files.

## Initial Database Data

The canonical assessment definitions live in JSON inside the repository.

To create missing initial data in a new dev/staging/production database:

```bash
pnpm db:bootstrap
```

To verify database data against the canonical JSON:

```bash
pnpm db:verify
```

The bootstrap is idempotent. Running it repeatedly must not create duplicate
assessments, versions, or questions.

Published assessment versions are immutable. If a published database version
does not match the canonical definition, bootstrap stops instead of silently
overwriting it.

## Development

Start Redis:

```bash
docker compose up -d redis
```

Run all development services:

```bash
pnpm dev
```

Web:

```text
http://localhost:3000
```

API uses `API_PORT` from `.env`.

## Production Build

Build the complete monorepo:

```bash
pnpm build:all
```

This builds the shared packages plus API, Worker and Web through Turborepo.

## Run an Existing Build

If the project is already built:

```bash
pnpm start:built
```

Before starting, this checks for:

```text
apps/api/dist/main.js
apps/worker/dist/main.js
apps/web/.next/BUILD_ID
```

If any build output is missing, it tells you to run `pnpm build:all`.

## Build and Start in One Command

```bash
pnpm build:start
```

## Full Code/Data Check

```bash
pnpm check:all
```

This runs database verification, lint, typecheck and the complete build.

## Current Testing Focus

Before adding more assessments, verify both current flows end-to-end:

1. Register/login as a student.
2. Start Interest Assessment.
3. Save, refresh and resume.
4. Complete all 60 questions.
5. Submit and verify the result.
6. Start Personality Assessment.
7. Save, refresh and resume.
8. Complete all 50 questions.
9. Submit and verify the result.
10. Confirm both results appear correctly in Results.

## Data Rule

Repository canonical JSON is the source of truth for initial assessment data.
MongoDB is the runtime copy.

When an assessment definition genuinely changes, create a new immutable version
instead of modifying an already-published version.
