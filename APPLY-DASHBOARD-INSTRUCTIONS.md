# Future Fit — Dashboard UI Update

This package was prepared after reviewing the current
`fix/local-auth-ui` branch after the landing/auth push.

It adds a shared responsive dashboard shell and refreshes:
- Student dashboard
- Teacher dashboard workspace
- School Admin / Principal dashboard workspace
- Super Admin dashboard
- Guardian dashboard

The existing API endpoints and management actions are preserved.

## Files in this package

New:
- `apps/web/src/components/dashboard/dashboard-shell.tsx`
- `apps/web/src/components/dashboard/dashboard.module.css`

Replaced:
- `apps/web/src/app/student/dashboard/page.tsx`
- `apps/web/src/components/management-panel.tsx`
- `apps/web/src/components/school-workspace.tsx`
- `apps/web/src/app/admin/dashboard/page.tsx`
- `apps/web/src/app/guardian/dashboard/page.tsx`

The existing:
- `apps/web/src/app/teacher/dashboard/page.tsx`
- `apps/web/src/app/school/dashboard/page.tsx`

do not need replacement. They already render `SchoolWorkspace`, which is updated
by this package.

## What is intentionally preserved

Student:
- existing authentication store/session guard
- `/attempts` API
- `/results` API
- links to assessment, result, career and profile pages

School / teacher:
- organization membership query
- school analytics endpoint
- staff students/completion/results endpoints
- invitations/member status actions
- academic year actions
- class management/enrollment
- assessment assignment actions

Admin:
- SUPER_ADMIN role check
- assessment authoring
- question authoring/import/edit/archive/restore
- version creation/publishing
- audit log

Guardian:
- consent policy
- relationship requests
- consent/revoke actions
- explicitly shared results

## Apply with Git Bash

From your repository:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"
git checkout fix/local-auth-ui
git pull origin fix/local-auth-ui
git status
```

Create a backup:

```bash
git branch backup-before-dashboard-ui
```

Download `future-fit-dashboard-update.zip` to Downloads and extract over the
repository:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-dashboard-update.zip" -d .
```

Check changed files:

```bash
git status
```

Run the web typecheck:

```bash
pnpm --filter @future-fit/web typecheck
```

If typecheck succeeds, make sure Mongo and Redis are running:

```bash
docker compose up -d mongo redis
```

Run API + web:

```bash
pnpm --filter @future-fit/web --filter @future-fit/api dev
```

Then test:

```text
http://localhost:3000/student/dashboard
http://localhost:3000/teacher/dashboard
http://localhost:3000/school/dashboard
http://localhost:3000/admin/dashboard
http://localhost:3000/guardian/dashboard
```

Role-protected dashboards will only show their full data/actions when the signed
in user actually has the corresponding backend role/membership.

## Commit after testing

```bash
git add apps/web/src/components/dashboard \
        apps/web/src/app/student/dashboard/page.tsx \
        apps/web/src/components/management-panel.tsx \
        apps/web/src/components/school-workspace.tsx \
        apps/web/src/app/admin/dashboard/page.tsx \
        apps/web/src/app/guardian/dashboard/page.tsx

git commit -m "Polish responsive dashboards"
git push origin fix/local-auth-ui
```

## Rollback

If you need to return to the exact state before extraction:

```bash
git reset --hard backup-before-dashboard-ui
```

Only do that if you do not need uncommitted changes made after creating the
backup branch.
