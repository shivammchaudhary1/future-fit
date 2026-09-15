# Future Fit role + Atlas DB repair v3

This package fixes the role contract and the development seed together.

## Final role/access contract

There are only five Future Fit access types:

```text
SUPER_ADMIN
SCHOOL_ADMIN   (Principal)
TEACHER
STUDENT
GUARDIAN
```

There is no separate normal `USER` role.

The student dashboard still remains:

```text
/student/dashboard
```

but its workspace kind is now `STUDENT`, not `USER`.

## Database relation design

This package intentionally keeps authorization normalized:

```text
SUPER_ADMIN
  -> users.globalRoles

SCHOOL_ADMIN / Principal
  -> organization_memberships.role = SCHOOL_ADMIN

TEACHER
  -> organization_memberships.role = TEACHER

STUDENT
  -> organization_memberships.role = STUDENT
  -> class_enrollments

GUARDIAN
  -> guardian_links
```

So `globalRoles: []` is correct for principal, teacher, student and guardian.
It does not mean those accounts have no access.

## Dev accounts after repair

```text
superadmin@futurefit.dev -> SUPER_ADMIN
principal@futurefit.dev  -> SCHOOL_ADMIN / Principal
teacher@futurefit.dev    -> TEACHER
student@futurefit.dev    -> STUDENT
guardian@futurefit.dev   -> GUARDIAN
```

The obsolete development seed accounts are removed:

```text
schooladmin@futurefit.dev
user@futurefit.dev
```

No arbitrary users are deleted.

## 1. Apply

From repository root:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-role-db-repair-v3.zip" -d .
```

## 2. Validate code before database changes

```bash
pnpm --filter @future-fit/api typecheck
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/api test
```

Do not continue if any command fails.

## 3. Repair the five Atlas development accounts

Keep your Atlas `MONGODB_URI` and `DEV_SEED_PASSWORD` in the root `.env`.

Then:

```bash
pnpm --filter @future-fit/api dev:seed:users
```

## 4. Verify the complete development database

```bash
pnpm --filter @future-fit/api exec node --env-file=../../.env scripts/verify-dev-access.mjs
```

Expected:

```json
{
  "ok": true
}
```

The verifier checks:

- all five access types
- principal membership
- teacher membership
- student membership
- guardian link
- demo school
- academic year
- teacher/class mapping
- student/class enrollment
- career_source_records = 1375
- obsolete seed accounts removed

If the only failed check is `career_source_records`, run:

```bash
pnpm --filter @future-fit/api data:careers:import
```

Then rerun the verifier.

## 5. Expected dashboard routing

```text
SUPER_ADMIN  -> /admin/dashboard
SCHOOL_ADMIN -> /school/dashboard
TEACHER      -> /teacher/dashboard
STUDENT      -> /student/dashboard
GUARDIAN     -> /guardian/dashboard
```
