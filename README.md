<<<<<<< HEAD

# Future Fit

Assessment-first career guidance for Indian students in Classes 9–12.

## Applications

- `apps/web` — Next.js responsive web application and PWA
- `apps/api` — NestJS REST API
- `apps/worker` — background processing (added with assessment processing)

## Shared packages

- `packages/ui` — reusable visual primitives and design tokens
- `packages/types` — shared domain types
- `packages/validation` — shared Zod schemas
- `packages/config` — shared product configuration

## Local development

1. Install Node.js 20+ and pnpm 11.
2. Copy `.env.example` to `.env.local` where required.
3. Run `pnpm install`.
4. Run `pnpm dev`.

The previous Phase 2 implementation lives in `Ce-Phase2Backup` and is reference-only.

## Implemented platform modules

- Secure local and Google authentication, email verification, password recovery, rotating access/refresh cookies, CSRF protection, and revocable sessions
- Organization and membership-backed tenant validation
- Versioned assessments, resumable attempts, batched answer persistence, and idempotent submission
- BullMQ scoring queue and independent worker
- O*NET API v2 Mini-IP questions, RIASEC scoring, career matching, search, and career reports
- Swagger API documentation at `/api/docs`

## Infrastructure

Copy `.env.example` to `.env`, provide secrets and O*NET credentials, then run `docker compose up --build`. MongoDB and Redis include persistent local volumes and health checks.
=======

# future-fit

> > > > > > > 5bbae01d4d3bfbf6ec5ba48aec11dd380bd303d1
