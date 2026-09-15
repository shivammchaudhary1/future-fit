# Future Fit Atlas development seed

This patch adds an idempotent development seed for all current Future Fit
workspace/access types.

## Accounts created

- SUPER_ADMIN -> `superadmin@futurefit.dev`
- SCHOOL_ADMIN -> `schooladmin@futurefit.dev`
- TEACHER -> `teacher@futurefit.dev`
- USER / school student -> `student@futurefit.dev`
- GUARDIAN -> `guardian@futurefit.dev`
- USER / independent student -> `user@futurefit.dev`

Guardian is intentionally **not** stored as a global role. It receives the
guardian workspace through an approved `guardian_links` relation.

The seed also creates:

- one Indian demo school
- one active academic year (`2026-27`)
- class `10-A`
- teacher assignment to that class
- student organization membership
- student class enrollment
- approved guardian/student link

## Safety

The script refuses to run when:

- `NODE_ENV=production`
- the MongoDB database name contains `prod` or `production`
- `MONGODB_URI` does not contain an explicit database name
- `DEV_SEED_PASSWORD` is missing or shorter than 8 characters

It upserts only its known demo records. It does not wipe the database.

## Apply

From the repository root:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-atlas-dev-seed-v1.zip" -d .
```

## Root .env

Keep your Atlas URI only in the local root `.env`.

Add a temporary dev password:

```env
DEV_SEED_PASSWORD=choose-your-own-dev-password
```

Do not commit `.env`.

## Before writing to Atlas

Run:

```bash
pnpm --filter @future-fit/api typecheck
pnpm --filter @future-fit/api test
pnpm --filter @future-fit/api data:careers:check
```

Only continue if all tests pass and career dry-run still reports 1375.

## Import career staging records

```bash
pnpm --filter @future-fit/api data:careers:import
```

Expected target collection:

```text
career_source_records
```

Expected source-record count:

```text
1375
```

## Seed demo users / access relations

```bash
pnpm --filter @future-fit/api dev:seed:users
```

The command prints the seeded account emails but never prints the password.

## Verify in Compass

Open the same Atlas database and verify these collections exist:

```text
users
organizations
organization_memberships
academic_years
school_classes
class_enrollments
guardian_links
career_source_records
```

Expected minimum demo records:

```text
users: 6
organizations: 1
organization_memberships: 3
academic_years: 1
school_classes: 1
class_enrollments: 1
guardian_links: 1
career_source_records: 1375
```

Counts may be higher if the database already contains other development data.

## Login

Start the app normally and log in using any seeded email with the password
stored in `DEV_SEED_PASSWORD`.

Expected default workspaces:

```text
superadmin@futurefit.dev   -> /admin/dashboard
schooladmin@futurefit.dev  -> /school/dashboard
teacher@futurefit.dev      -> /teacher/dashboard
student@futurefit.dev      -> /student/dashboard
guardian@futurefit.dev     -> /guardian/dashboard
user@futurefit.dev         -> /student/dashboard
```
