# Judge Specification

## Scope

This document specifies the standalone judge behavior implemented in `src/judge.ts`.

## Inputs

- `targets[]` (required): each target has `id` + `imageUrl`; optional metadata fields (`name`, `description`)
- `impressionImages[]` (optional but recommended)
- `impressionText` (optional)
- `modelName` (optional; defaults to `gemini-3.0-flash`)
- `includePerTargetDetails` (optional)
- `metadataMode` (optional):
  - `image_only` (default)
  - `with_metadata`

## Core Rules

1. All targets must have valid `imageUrl`.
2. The model must return strict JSON shape:
   - `rankings[]`
   - `reasoning`
   - `keyMatches[]`
   - `keyDifferences[]`
3. Rankings must use unique target IDs and unique ranks.
4. For full ranking:
   - one rank per target
   - rank range is `1..N`
5. No multi-pass/early-stop mode is included in this package.

## Prompting

- Judge prompt is blind by design ("AI does NOT know which is real")
- Impression evidence:
  - impression images
  - optional verbatim text
- Target evidence:
  - image references for each target ID
  - metadata only if `metadataMode = with_metadata`

## Parsing / Robustness

- Handles fenced markdown JSON outputs
- Escapes control chars inside strings before JSON parse
- Normalizes curly quotes
- Retries once with reduced output verbosity when per-target details fail validation

## Model Fallback Chain

Supported candidate expansion mirrors production mappings, e.g.:

- `gemini-3.0-flash` -> `gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-1.5-flash`

If a model is unavailable (`not found`-style errors), the next candidate is tried.

## Determinism Notes

- The engine is deterministic given:
  - identical target/impression inputs
  - identical prompt strings
  - identical model version/runtime behavior
- Closed hosted models may still vary across provider-side updates.
