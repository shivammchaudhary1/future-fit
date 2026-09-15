# Future Fit — Landing + Auth UI Update

This package contains only the files that should be replaced in your existing
`fix/local-auth-ui` branch.

It is based on the branch structure already inspected and keeps the existing
authentication logic/forms/API calls intact. The update changes presentation,
responsive layout, asset paths and branding.

## Files replaced

- `apps/web/src/config/assets.ts`
- `apps/web/src/styles/theme.css`
- `apps/web/src/components/marketing/site-header.tsx`
- `apps/web/src/components/marketing/site-header.module.css`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/page.module.css`
- `apps/web/src/components/auth/auth-shell.tsx`
- `apps/web/src/app/(auth)/auth.css`

No backend/API/auth request logic is replaced.

## Important asset note

Your current GitHub branch contains these filenames:

- `logo-primary.png.png`
- `logo-stacked.png.png`
- `logo-icon.png.png`

So `assets.ts` intentionally points to those exact names. This fixes the broken
logo immediately without requiring you to rename the image files.

The existing hero files are used as:

- desktop: `hero-student-male.png`
- mobile: `hero-student-male-mobile.jpg`

The female assets stay available in `assets.ts` for later pages/variants.

## Recommended apply method (Git Bash)

1. Make sure you are in the repo and on the right branch:

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"
git checkout fix/local-auth-ui
git pull origin fix/local-auth-ui
git status
```

2. Make a safety backup branch:

```bash
git branch backup-before-landing-auth-ui
```

3. Download `future-fit-landing-auth-update.zip` from ChatGPT into your Windows
Downloads folder.

4. Extract it directly over the repository root:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-landing-auth-update.zip" -d .
```

The zip already contains the correct `apps/web/...` folder paths.

5. Verify changed files:

```bash
git status
git diff -- apps/web/src/config/assets.ts
git diff -- apps/web/src/app/page.tsx
git diff -- apps/web/src/components/auth/auth-shell.tsx
```

6. Run typecheck:

```bash
pnpm --filter @future-fit/web typecheck
```

7. Run the web app:

```bash
pnpm --filter @future-fit/web dev
```

Open:

```text
http://localhost:3000
```

Check:
- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

The reset/verify pages may need a real token to complete the action, but their
page layout should load correctly.

8. If everything looks correct:

```bash
git add apps/web/src/config/assets.ts \
        apps/web/src/styles/theme.css \
        apps/web/src/components/marketing/site-header.tsx \
        apps/web/src/components/marketing/site-header.module.css \
        apps/web/src/app/page.tsx \
        apps/web/src/app/page.module.css \
        apps/web/src/components/auth/auth-shell.tsx \
        'apps/web/src/app/(auth)/auth.css'

git commit -m "Polish landing page and auth UI"
git push origin fix/local-auth-ui
```

## What this update changes

Landing page:
- uses the real Future Fit primary logo
- resembles the original generated Future Fit visual direction much more closely
- hero with senior-school student, action pills and strong CTA
- six-assessment strip
- India-focused section
- four-step How It Works section
- sample report preview
- testimonials / audience section
- final CTA
- full multi-column footer
- tablet/mobile responsive behavior

Auth:
- real Future Fit logo instead of the fake CSS "F"
- shared visual system across login, register, forgot password, reset password
  and verify email
- keeps current form components and request logic intact
- responsive split-layout on desktop and compact layout on mobile
- centralized brand colors in `theme.css`

## Rollback

If needed:

```bash
git reset --hard backup-before-landing-auth-ui
```

Only use the rollback command if you do not need any uncommitted work created
after the backup branch.
