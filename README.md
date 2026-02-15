# ARVC Judge-Only (Standalone)

This package contains the transparent, standalone judging engine for blind remote-viewing target ranking.

It is extracted from production logic and intentionally excludes private infrastructure.

## What This Includes

- Multi-target full ranking (`judgeMany`)
- Prompt construction and output-shape enforcement
- JSON parsing/repair helpers for model responses
- Ranking validation checks (duplicate IDs/ranks, range checks)

## What This Excludes (Intentionally)

- Database reads/writes
- Queue processing and cron orchestration
- Auth/admin controls
- Site configuration storage
- Wallets, payout logic, and any private operational code

## Default Behavior

- **Image-only target context by default** (`metadataMode = "image_only"`)
- Blind single-pass ranking across all supplied targets
- No multi-pass / early-stop API in this package
- Strict JSON output parsing + validation
- Model fallback chain for Gemini model names

## Install

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

You provide a model adapter via `createModel`. The judge engine itself is provider-agnostic.

```ts
import { judgeMany, type JudgeModel } from "./src/index";

const createModel = (_modelName: string): JudgeModel => ({
  async invoke(content) {
    // Replace with your provider SDK call.
    // Must return a JSON string in the documented shape.
    throw new Error("Implement provider adapter");
  },
});

const result = await judgeMany({
  createModel,
  modelName: "gemini-3.0-flash",
  targets: [
    { id: "t1", imageUrl: "data:image/jpeg;base64,..." },
    { id: "t2", imageUrl: "data:image/jpeg;base64,..." },
  ],
  impressionImages: ["data:image/jpeg;base64,..."],
  impressionText: "optional text",
  includePerTargetDetails: true,
  // metadataMode defaults to "image_only"
});
```

## Publish-Only-Judge Workflow

See:

- `JUDGE_SPEC.md`
- `RUN_MANIFEST.template.json`
- `PUBLISH_CHECKLIST.md`
