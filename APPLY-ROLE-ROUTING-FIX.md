# Future Fit — Role / Workspace Routing Fix

This package fixes the issue where every successful login was sent to
`/student/dashboard`.

## Model implemented

Future Fit now treats access like this:

- `SUPER_ADMIN` — platform owner only
- `SCHOOL_ADMIN` — principal / school administrator
- `TEACHER` — school teacher
- `USER` — normal Future Fit user
  - independent user, OR
  - school-linked student via organization membership `STUDENT`
- `GUARDIAN` — relationship-based guardian workspace, not a student role

`STUDENT` remains an organization membership, not a separate global account
identity.

## Default routing

```text
SUPER_ADMIN  -> /admin/dashboard
SCHOOL_ADMIN -> /school/dashboard
TEACHER      -> /teacher/dashboard
STUDENT/USER -> /student/dashboard
GUARDIAN     -> /guardian/dashboard
```

A normal user with no school membership stays on the user/student experience.
A normal user who is linked to a school with `STUDENT` membership also uses the
same user/student experience, but gets school assignments through the existing
school membership APIs.

## Direct-route protection

This package also prevents incorrect workspaces from mounting:

- guardian opening `/assessments` -> redirected to guardian dashboard
- teacher opening `/student/dashboard` -> redirected to teacher dashboard
- school admin opening `/student/dashboard` -> redirected to school dashboard
- normal user opening `/admin/dashboard` -> redirected to their own dashboard
- super admin opening role-inappropriate screens -> returned to admin workspace

## Existing teacher/school privacy remains backend-enforced

The existing backend already scopes staff students correctly:

- `SCHOOL_ADMIN` -> all ACTIVE STUDENT members in that organization
- `TEACHER` -> only students enrolled in classes where that teacher is assigned
- school results/completion -> only SCHOOL-context attempts for students in
  that scope

This package does not weaken those backend rules.

## Apply

From Git Bash:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"

git checkout fix/local-auth-ui
git status
git branch backup-before-role-routing-fix
```

Extract:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-role-routing-fix.zip" -d .
```

Run checks:

```bash
pnpm --filter @future-fit/api typecheck
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/web lint
```

Then build:

```bash
pnpm --filter @future-fit/api build
pnpm --filter @future-fit/web build
```

Run:

```bash
docker compose up -d mongo redis

pnpm --filter @future-fit/api dev
pnpm --filter @future-fit/web dev
```

## Test accounts

Expected login behavior:

```text
superadmin@gmail.com -> /admin/dashboard
admin@gmail.com      -> /school/dashboard
principal@gmail.com  -> /school/dashboard
teacher@gmail.com    -> /teacher/dashboard
student@gmail.com    -> /student/dashboard
user@gmail.com       -> /student/dashboard
guardian@gmail.com   -> /guardian/dashboard
```

Important: log out between accounts.

Then manually test wrong URLs:

```text
teacher@gmail.com + /student/dashboard
guardian@gmail.com + /assessments
student@gmail.com + /teacher/dashboard
admin@gmail.com + /student/dashboard
```

Each should redirect to the account's correct default workspace.

## Commit

```bash
git add apps/api/src/users \
        apps/web/src/lib/access-context.ts \
        apps/web/src/components/auth/workspace-boundary.tsx \
        apps/web/src/components/auth/workspace-boundary.module.css \
        apps/web/src/config/auth.constants.ts \
        apps/web/src/app/workspace \
        apps/web/src/app/admin/layout.tsx \
        apps/web/src/app/school/layout.tsx \
        apps/web/src/app/teacher/layout.tsx \
        apps/web/src/app/guardian/layout.tsx \
        apps/web/src/app/student/layout.tsx \
        apps/web/src/app/assessments/layout.tsx \
        apps/web/src/app/assessment/layout.tsx \
        apps/web/src/app/results/layout.tsx \
        apps/web/src/app/careers/layout.tsx \
        apps/web/src/app/payments/layout.tsx \
        apps/web/src/app/error.tsx

git commit -m "Fix role workspace routing and authorization"

git push origin fix/local-auth-ui
```
