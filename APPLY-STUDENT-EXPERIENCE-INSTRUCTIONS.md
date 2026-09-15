# Future Fit — Student Experience UI Update

This package updates the remaining student-side screens after the landing page,
auth and dashboard redesign.

## Included

- Assessments listing
- School assignments
- Assessment-taking experience
- Results listing
- Individual result/report
- Result sharing
- Guidance notes
- Career Library
- Student Profile & Settings
- One shared responsive CSS module

## Important

The package was built around the current `fix/local-auth-ui` branch structure.

It intentionally preserves:
- existing assessment start/resume API calls
- IndexedDB/offline answer draft logic
- periodic sync logic
- conflict retry logic
- assessment submit API
- results polling and report download API
- result sharing permissions
- guidance notes APIs
- career pagination API
- profile language update API
- ManagementPanel-based guardian/session/notification endpoints

## Apply in Git Bash

```bash
cd "/c/Users/shiva/Desktop/Future Fit/future-fit"
git checkout fix/local-auth-ui
git pull origin fix/local-auth-ui
git status
```

Create a safety backup branch:

```bash
git branch backup-before-student-experience-ui
```

Download `future-fit-student-experience-update.zip` to your Downloads folder,
then extract it over your repo:

```bash
unzip -o "/c/Users/shiva/Downloads/future-fit-student-experience-update.zip" -d .
```

Check:

```bash
git status
```

Run typecheck:

```bash
pnpm --filter @future-fit/web typecheck
```

Run app:

```bash
docker compose up -d mongo redis
pnpm --filter @future-fit/web --filter @future-fit/api dev
```

Test these routes:

```text
http://localhost:3000/assessments
http://localhost:3000/results
http://localhost:3000/careers
http://localhost:3000/student/profile
```

Then start/resume an assessment and verify:

```text
/assessment/<attemptId>
```

Also open a real result:

```text
/results/<resultId>
```

## Test checklist

Assessment:
- start personal assessment
- resume assessment
- previous/next question navigation
- answers survive page refresh
- saved status changes correctly
- Save & Exit returns to assessments
- Submit redirects to results

Results:
- results list loads
- processing/ready statuses display
- result detail loads
- PDF download remains disabled until READY
- sharing form works
- revoke works
- notes still work for authorized staff

Career Library:
- pagination works
- search filters the current API page only
- English/Hindi translation selection still follows user preference

Profile:
- language change updates account
- guardian relationship panel loads
- sessions load
- notifications load

Mobile:
- test around 375px width
- assessment question card fits
- most/least fields stack
- dashboard shell mobile menu still works

## Commit after testing

```bash
git add apps/web/src/styles/student-experience.module.css \
        apps/web/src/app/assessments/page.tsx \
        apps/web/src/components/student-assignments.tsx \
        'apps/web/src/app/assessment/[attemptId]/page.tsx' \
        apps/web/src/app/results/page.tsx \
        'apps/web/src/app/results/[resultId]/page.tsx' \
        apps/web/src/components/result-sharing.tsx \
        apps/web/src/components/guidance-notes.tsx \
        apps/web/src/app/careers/page.tsx \
        apps/web/src/app/student/profile/page.tsx

git commit -m "Polish student assessment and results experience"
git push origin fix/local-auth-ui
```

## Rollback

```bash
git reset --hard backup-before-student-experience-ui
```

Only use rollback if you do not need any uncommitted work created after the
backup branch.
