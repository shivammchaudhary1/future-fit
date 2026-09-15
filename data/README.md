# Future Fit data directory

## Layers

`raw/`
- immutable source snapshots/reference exports
- never used directly for recommendations

`staging/`
- normalized candidates
- safe to import into `career_source_records`
- still unverified

`curated/`
- reviewed Future Fit-owned runtime data
- this is the only layer that may become authoritative recommendation data

## India-first rule

Career records must eventually be reviewed for Indian Class 9–12 users:
school streams, education routes, entrance exams, vocational routes,
professional qualifications, government/defence routes where relevant,
and English/Hindi student-facing content.

Do not convert legacy RIASEC/DISC values into scientific truth merely because
they exist in Career Explorer.
