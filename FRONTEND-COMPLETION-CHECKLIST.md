# Future Fit — Frontend Completion Checklist

After this update, the main frontend surface includes:

## Public + auth
- Landing page
- Responsive navbar
- Login
- Registration
- Forgot/reset password
- Email verification
- Future Fit theme and assets

## Dashboards
- Student
- Teacher
- School Admin / Principal
- Super Admin
- Guardian
- Responsive desktop/mobile dashboard shell

## Student journey
- Assessment listing
- School assignments
- One-question-at-a-time assessment experience
- Offline draft protection for assessment answers
- Results list
- Result/report detail
- PDF report download
- Result sharing
- Guidance notes
- Career Library
- Profile/settings
- Payments and Razorpay access UI

## Final foundation added by this package
- PWA manifest
- production service-worker registration
- safe static-asset caching
- offline navigation fallback
- install-app prompt
- online/offline status banner
- in-app notification bell
- unread notification count
- mark-notification-as-read action
- app loading screen
- route error screen
- global error screen
- 404 page
- reduced-motion accessibility
- focus-visible accessibility
- safe-area support
- basic security response headers

## Intentionally not implemented in this frontend package

### Browser push notifications
The current API exposes in-app notifications and a mark-as-read endpoint, but
there is no push-subscription/VAPID endpoint in the current backend. The bell
therefore uses the existing in-app notifications API. True background web push
should be added only after backend push subscription storage and VAPID delivery
are implemented.

### Career-data replacement
The current backend still contains O*NET-related code. Replacing O*NET with the
planned India-focused career knowledge engine/data pipeline is a separate
backend/data milestone.

### Production external services
Real production deployment still requires configured credentials/services such
as MongoDB, Redis, email, AI provider, Cloudflare/R2, Razorpay, Turnstile, etc.
Those should be configured after the application flow is stable locally.
