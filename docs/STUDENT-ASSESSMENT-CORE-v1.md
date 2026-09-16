# Future Fit — Student Assessment Core v1

## Scope

This phase is intentionally student-first.

In scope:

- individual Class 9–12 student profile
- India-oriented education context
- personal assessment catalogue
- start / resume / autosave / submit flow (existing core retained)
- deterministic local scoring
- normalized Student Fit Profile aggregation
- bilingual original Interest pilot
- development verification

Deferred until the assessment mechanism is stable:

- principal / school admin workflows
- teacher workflows
- guardian workflows
- school analytics
- guardian report access improvements
- canonical career ranking

## Student Fit Profile

The API endpoint:

```text
GET /api/v1/students/me/fit-profile
```

uses completed locally scored `OPTION_SUM_V1` assessments.

For every latest assessment type it:

1. loads the immutable assessment version
2. derives the theoretical score range
3. normalizes dimensions to 0–100
4. composes the Future Fit profile groups:
   - interest
   - aptitude
   - personality
   - values
   - academic

Legacy O*NET scoring is intentionally excluded from this aggregate. This keeps
the new Future Fit model local and prevents mixing incompatible scales.

## Interest pilot

`data/assessments/student-interest-pilot.v1.json` contains 24 original,
bilingual, India-friendly activity-interest items: 4 per RIASEC dimension.

It is a development/pilot bank, not a validated psychometric instrument.

Do not market it as scientifically validated until expert review and
reliability/validity/fairness studies are complete.

## Career matching

Career rankings are deliberately not added in this phase. The career source
records are staging evidence, not yet reviewed canonical requirement profiles.
The model should not invent targets or percentages.
