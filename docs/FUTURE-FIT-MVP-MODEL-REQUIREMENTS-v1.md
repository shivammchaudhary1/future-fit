# Future Fit MVP Model Requirements v1

## Status

This document is the implementation contract for the first deterministic
Future Fit recommendation model.

Model version:

`ff-model-v1`

## What this package implements now

This first code package implements the mathematical/data foundation only:

1. normalized 0–100 assessment dimensions
2. Student Fit Profile contract
3. career requirement contract
4. career-specific importance
5. deterministic alignment calculation
6. match coverage protection
7. explainable strongest/development factors
8. source/evidence fields in the career schema
9. tests

It intentionally does **not** yet:

- create the final question bank
- import Indian careers
- remove the O*NET worker path
- generate production recommendations
- create AI interpretations

Those come after the source/question data is approved.

## Assessment model

### Interest

Framework:

RIASEC

Dimensions:

- R
- I
- A
- S
- E
- C

Target:

approximately 60 items for the first full bank.

### Personality

Framework:

Big Five

Dimensions:

- openness
- conscientiousness
- extraversion
- agreeableness
- emotionalStability

Target:

30–50 items.

### Aptitude

Future Fit original bank.

Dimensions:

- logical
- numerical
- verbal
- spatial
- dataInterpretation
- patternRecognition

Target:

approximately 60 items.

### Values

Dimensions:

- achievement
- independence
- helpingOthers
- recognition
- stability
- creativity
- leadership
- workLifeBalance
- financialReward
- learning

Target:

30–40 items.

### Academic / education context

This will be finalized separately because some fields are eligibility/context
data rather than psychometric scores.

## Scoring rule

Assessment option scoring remains deterministic.

Raw dimension scores are converted to 0–100 using the theoretical score range
of the assessment version:

```text
normalized =
(raw - theoreticalMinimum)
/
(theoreticalMaximum - theoreticalMinimum)
* 100
```

The code derives the theoretical range from the immutable question snapshot and
server-side scoring configuration.

Reverse-keyed personality items are represented in their option scoring keys,
so the normalization formula does not need a special case.

## Student Fit Profile

Example:

```json
{
  "modelVersion": "ff-model-v1",
  "interest": {
    "I": 86,
    "C": 70
  },
  "aptitude": {
    "logical": 91,
    "numerical": 78
  },
  "personality": {
    "openness": 80
  },
  "values": {
    "learning": 88
  },
  "academic": {}
}
```

## Career requirement model

Every career can define requirements.

Example:

```json
{
  "group": "aptitude",
  "dimension": "logical",
  "importance": 5,
  "matchMode": "MINIMUM",
  "target": 80,
  "evidence": "Core occupation tasks repeatedly require analysis and problem solving.",
  "sources": [
    {
      "source": "FUTURE_FIT",
      "reference": "Career task mapping v1"
    }
  ]
}
```

Importance:

```text
5 = core / essential
4 = strongly important
3 = important
2 = supporting
1 = minor relevance
```

## Match modes

### MINIMUM

Used where being above a threshold should not be punished.

Example:

```text
logical reasoning minimum = 80

student = 95
alignment = 100
```

This is useful for aptitude/ability requirements.

### TARGET

Used where similarity to a profile value is meaningful.

Example:

```text
Investigative target = 85

student = 88
alignment = 97
```

### RANGE

Used where a broader preferred range is more sensible.

Example:

```text
preferred range = 50–80
```

Students inside the range receive full alignment for that dimension.

## Final career alignment

For every career:

```text
weighted alignment =
sum(dimension alignment * career importance)
/
sum(matched importance)
```

The result is a:

`Future Fit Alignment Score`

It is **not** a probability of career success.

## Coverage rule

A career must not be ranked from one small assessment alone.

The model therefore calculates coverage:

```text
matched requirement importance
/
total career requirement importance
```

Default minimum coverage:

`70%`

If the student has only completed Interest but the career profile also depends
heavily on Aptitude and Values, the career is not eligible for final ranking.

## Explainability

Every match returns:

- complete dimension components
- strongest factors
- development factors
- coverage
- score
- eligibility for ranking

The system can therefore answer:

> Why was this career recommended?

without using an AI model.

## Career source strategy

Career data will later be normalized into the Future Fit database from:

- Indian occupational classification sources
- NSDC/QP/NOS job roles
- NCS validation/discovery
- ESCO supplementary occupation/skill data
- Future Fit curated emerging careers

Each imported or curated field should preserve source references.

## O*NET migration

The current code still contains an O*NET runtime path.

Do not delete it in this foundation commit.

Migration sequence:

```text
Future Fit model foundation
-> question bank
-> normalized Student Fit Profile
-> Indian career importer
-> career requirement profiles
-> internal matching worker
-> verify output
-> remove live O*NET dependency
```

This prevents breaking current assessment processing before its replacement is
ready.

## Data/versioning rule

Store version identifiers for:

- assessment version
- scoring model
- Future Fit model
- career profile
- career source import

A result must always be reproducible later.

## User-facing wording

Use:

- Future Fit Alignment
- Strong alignment
- Moderate alignment
- Career profile match

Do not use:

- chance of success
- guaranteed career
- intelligence percentage
- scientifically proven match

until separate validation supports such claims.
