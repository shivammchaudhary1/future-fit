# Personality Assessment backend design — v1

## Product name

`Personality Assessment`

## Source basis

The assessment is based on the public-domain IPIP Goldberg (1992)
Big-Five Factor Markers, using the 50-item short form: 10 items per factor.

The project source documents provide:
- the 50-item short-form structure and positive/reverse counts;
- the factor-level scoring key with the exact positive and reverse-keyed items.

The public/student wording in this implementation is a Future Fit
India-student adaptation. Original source wording is retained privately
on question source metadata for provenance.

## Dimensions

1. `EXTRAVERSION`
2. `AGREEABLENESS`
3. `CONSCIENTIOUSNESS`
4. `EMOTIONAL_STABILITY`
5. `INTELLECT_IMAGINATION`

Each dimension has exactly 10 items.

## Response scale

1. Very inaccurate
2. Moderately inaccurate
3. Neither inaccurate nor accurate
4. Moderately accurate
5. Very accurate

Hindi equivalents are stored for all five choices.

## Scoring

Positive-keyed item:

`1 -> 1, 2 -> 2, 3 -> 3, 4 -> 4, 5 -> 5`

Reverse-keyed item:

`1 -> 5, 2 -> 4, 3 -> 3, 4 -> 2, 5 -> 1`

Raw score for each factor:

`10..50`

Normalized Future Fit score:

`((raw - 10) / 40) * 100`

Normalized range:

`0..100`

No AI is used to calculate the core personality score.

## Storage

The implementation reuses Future Fit's existing generic assessment model:

- `questions`
- `assessments`
- `assessment_versions`
- `assessment_attempts`
- `assessment_results`

Question documents additionally keep private source/provenance metadata.
The published `assessment_versions.questionSnapshots` are immutable.

`assessment_results.dimensions` stores raw 10–50 factor scores.
`assessment_results.normalizedDimensions` stores 0–100 scores.

## Versioning

Stable assessment key:

`FUTURE_FIT_PERSONALITY_IPIP_BFFM_50`

Version:

`ipip-bffm-50-india-bilingual-v1`

Scoring model:

`IPIP_BIG_FIVE_50_V1`

Re-running the publishing script must not rewrite an already published
version with the same version id.
