# Bootstrap + cleanup v1

This cleanup establishes canonical JSON as the database bootstrap source of
truth for the two current student assessments.

## Canonical runtime definitions

- `data/bootstrap/assessments/interest-assessment.onet-ip-60-india.v1.json`
- `data/bootstrap/assessments/personality-assessment.ipip-bffm-50-india.v1.json`

## Commands

```bash
pnpm db:bootstrap
pnpm db:verify
```

The bootstrap does not mutate a mismatching published version. It fails and
requires a new version instead.

## Removed legacy/temporary material

The migration removes:
- obsolete 24-question Interest pilot seed data/script
- one-time patch/apply instruction files
- superseded O*NET import/adaptation/publish pipeline scripts
- superseded Personality publish module/script
- intermediate Interest adaptation/review JSON
- temporary O*NET response fixture
- tracked credential file from the current tree

Useful current verification, repair, and E2E scripts are intentionally retained.

## Security note

Removing a credential file from the current tree does not erase it from Git
history and does not rotate any credential that may have appeared in it.
Affected credentials should be rotated separately if they were real.
