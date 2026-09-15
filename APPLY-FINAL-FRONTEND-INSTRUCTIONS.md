# Future Fit — Final Frontend Foundation Update

This is the large "finish the remaining frontend foundation" package.

It assumes you already applied the previous:
- landing/auth update
- dashboards update
- student assessment/results update
- payments update

## What this package finishes

- PWA manifest and install experience
- service worker for production
- safe static caching (never caches `/api/*`)
- offline navigation fallback
- online/offline status
- in-app notification bell on every dashboard role
- unread badge
- mark notification as read
- global loading UI
- normal route error UI
- global fatal error UI
- 404 UI
- focus/reduced-motion/mobile safe-area polish
- basic secure response headers
- consistent `Access & Payments` link across student pages

## Apply

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"
git checkout fix/local-auth-ui
git pull origin fix/local-auth-ui
git status
```

Backup:

```bash
git branch backup-before-final-frontend-foundation
```

Download `future-fit-final-frontend-update.zip` to Downloads, then:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-final-frontend-update.zip" -d .
```

Run:

```bash
pnpm --filter @future-fit/web typecheck
pnpm --filter @future-fit/web lint
```

Then normal local development:

```bash
docker compose up -d mongo redis
pnpm --filter @future-fit/web --filter @future-fit/api dev
```

## Important PWA testing note

The service worker is intentionally registered only in production builds so it
does not fight Next.js/Turbopack during development.

To test PWA behavior locally:

```bash
pnpm --filter @future-fit/web build
pnpm --filter @future-fit/web start
```

Then open:

```text
http://localhost:3000
```

Chrome/Edge can install PWAs from localhost.

## Test

Check:
- landing/auth still work
- student/teacher/school/admin/guardian dashboard loads
- notification bell appears in dashboard topbar
- unread notifications show a badge when backend data exists
- mark-read works
- student sidebar contains Access & Payments
- assessments/results/careers/profile still work
- `/payments` still works
- unknown URL shows custom 404
- disconnect network while production build is running and navigate to a new
  route: `/offline` fallback should display

## Notifications

Your existing backend currently supports:

```text
GET  /api/v1/notifications
POST /api/v1/notifications/:id/read
```

This update uses those existing endpoints.

It does NOT fake browser push. True background push requires a backend
push-subscription/VAPID implementation, which is not currently present.

## Commit

```bash
git add apps/web

git commit -m "Complete PWA notifications and frontend resilience"

git push origin fix/local-auth-ui
```

## Rollback

```bash
git reset --hard backup-before-final-frontend-foundation
```
