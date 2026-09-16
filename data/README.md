# Future Fit data directory

## Runtime/bootstrap source of truth

`bootstrap/assessments/` contains the canonical JSON definitions required to
create the current published assessments in a fresh database.

Run:

```bash
pnpm db:bootstrap
pnpm db:verify
```

The bootstrap is idempotent. It creates missing records, reuses matching
published immutable versions, and refuses to overwrite a published version
whose snapshots differ from the canonical JSON.

Do not run bootstrap automatically on every development server restart. Keep
application startup fast; run it when creating or validating an environment.

## Data layers

`raw/`
- immutable source snapshots/reference exports
- never used directly for recommendations

`staging/`
- normalized candidates
- still unverified

`curated/`
- reviewed Future Fit-owned career/reference data

`bootstrap/`
- canonical initial runtime data required to recreate the application database

## India-first rule

Career records must eventually be reviewed for Indian Class 9–12 users.
Legacy RIASEC/DISC values from old Career Explorer data are provenance only and
must not be treated as scientific truth.
