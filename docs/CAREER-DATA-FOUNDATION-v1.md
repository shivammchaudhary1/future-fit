# Future Fit Career Data Foundation v1

## What this package does

This package starts the coding-side migration from the old Career Explorer data
to an India-first Future Fit career database without making unverified legacy
data authoritative.

## Legacy data preserved as JSON

- modern Career Explorer career records: **364**
- legacy occupation records: **1011**
- legacy survey questions: **7**
- normalized staging source records: **1375**

No user, payment, resume, report, or personal assessment data is included in
the migration package.

## Data layers

```text
data/raw
  -> immutable legacy/source snapshot

data/staging
  -> normalized but UNVERIFIED source candidates

data/curated
  -> reviewed Future Fit runtime data only
```

## Mongo relation

```text
career_source_records
        |
        | mappedCareerSlug (after review)
        v
career_profiles
```

A source record can come from Career Explorer, NCO, NSDC, NCS, ESCO or a
Future Fit-curated source. Multiple source records can later map to one
canonical Future Fit career.

## Important safety rule

Legacy RIASEC and DISC values are retained as `legacySignals` only.

They are not automatically used by the Future Fit matching engine.

## India-first fields

Canonical careers now support:

- India relevance review
- school-stream context
- qualification routes
- vocational routes
- regulators/professional bodies
- entrance exams
- English/Hindi content
- source provenance
- verification status
- data version

The package also includes a product-level India pathway taxonomy under:

`data/curated/india/india-pathway-taxonomy.v1.json`

This taxonomy does not claim eligibility for a specific career. Career-specific
eligibility must be added from verified Indian sources.

## Import behavior

The importer writes only to:

`career_source_records`

It does **not** publish these records to `career_profiles`.

This is deliberate.

Run a dry check first:

```bash
pnpm --filter @future-fit/api data:careers:check
```

Then import staging records:

```bash
pnpm --filter @future-fit/api data:careers:import
```

The importer is idempotent because it upserts by:

```text
sourceType + sourceRecordKey
```

## Next coding phase

After this package passes:

1. create canonical career dedupe/review service
2. ingest verified Indian sources
3. map source records to canonical careers
4. create India education-path data
5. create evidence-backed career requirement profiles
6. only then connect careers to the matching engine
