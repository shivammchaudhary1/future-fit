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
