# Future Fit — Payments UI + Access Flow Update

This package updates the remaining payment/access UI while keeping your existing
Razorpay backend flow intact.

## Files included

- `apps/web/src/app/payments/page.tsx`
- `apps/web/src/styles/payments.module.css`
- `apps/web/src/app/student/dashboard/page.tsx`

## What changes

Payments page:
- uses the Future Fit dashboard shell
- responsive desktop/mobile design
- available product cards
- INR pricing
- access duration
- number of included assessments
- Razorpay checkout button
- automatic payment-history refresh
- clear PAID / pending / reconciliation statuses
- server-verification explanation
- secure payment history presentation

Student dashboard:
- adds `Access & Payments` to the sidebar
- adds a quick-access card for payments

## Existing backend behavior preserved

Your backend already:
- loads active products
- creates idempotent Razorpay orders
- verifies signed Razorpay webhooks
- marks payments `PAID`
- creates assessment entitlements after verified payment

This UI does NOT unlock access based only on the browser checkout callback.

## Small functionality fix included

The old frontend kept the same sessionStorage idempotency key even after a
verified PAID payment. That could make a later purchase of the same product in
the same browser session return the old order.

This update clears the saved request key after the payment API confirms a PAID
payment, so a genuine later repurchase can create a new order.

## Apply in Git Bash

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"
git checkout fix/local-auth-ui
git pull origin fix/local-auth-ui
git status
```

Create a backup:

```bash
git branch backup-before-payments-ui
```

Download `future-fit-payments-update.zip` into Downloads and extract:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-payments-update.zip" -d .
```

Typecheck:

```bash
pnpm --filter @future-fit/web typecheck
```

Run locally:

```bash
docker compose up -d mongo redis
pnpm --filter @future-fit/web --filter @future-fit/api dev
```

Open:

```text
http://localhost:3000/student/dashboard
http://localhost:3000/payments
```

## Important: local Razorpay configuration

The page itself can render without Razorpay credentials, but creating a real
order requires these backend values:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Do not place `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET` in a
`NEXT_PUBLIC_*` frontend environment variable.

## Test checklist

Before real payment:
- dashboard shows Access & Payments
- `/payments` loads
- products load from `/payments/products`
- existing payment history loads from `/payments`

With Razorpay test credentials:
- purchase opens Razorpay checkout
- dismissing checkout does not mark payment paid
- completing checkout shows verification message
- history changes to PAID only after webhook verification
- paid record remains after refresh
- later repurchase can generate a fresh request key after the previous payment
  has been verified as PAID

## Commit after testing

```bash
git add apps/web/src/app/payments/page.tsx \
        apps/web/src/styles/payments.module.css \
        apps/web/src/app/student/dashboard/page.tsx

git commit -m "Polish payments and assessment access UI"
git push origin fix/local-auth-ui
```

## Rollback

```bash
git reset --hard backup-before-payments-ui
```
