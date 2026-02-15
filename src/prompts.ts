import type { JudgeContentPart } from "./model";
import type { MetadataMode, TargetInput } from "./types";

function safeName(value: string | undefined): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || "Untitled";
}

function safeDescription(value: string | undefined): string {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || "No description";
}

export function buildTargetPrelude(targets: TargetInput[], metadataMode: MetadataMode): string {
  if (metadataMode === "with_metadata") {
    return targets
      .map((t, idx) => `TARGET ${idx + 1} (ID: ${t.id}): ${safeName(t.name)} - ${safeDescription(t.description)}`)
      .join("\n\n");
  }
  return targets.map((t, idx) => `TARGET ${idx + 1} (ID: ${t.id})`).join("\n\n");
}

function outputRules(withPerTargetDetails: boolean): string {
  if (withPerTargetDetails) {
    return (
      `OUTPUT RULES (performance-critical):\n` +
      `- In the rankings array, output { targetId, rank, reasoning, keyMatches, keyDifferences } for EACH ranked target.\n` +
      `- For EACH rankings entry:\n` +
      `  - reasoning: <= 40 words (match quality + concrete cues).\n` +
      `  - keyMatches: <= 3 items, each <= 8 words.\n` +
      `  - keyDifferences: <= 3 items, each <= 8 words.\n` +
      `- Provide top-level reasoning + keyMatches + keyDifferences focusing on the TOP-RANKED target.\n` +
      `- Keep the top-level reasoning <= 120 words.\n` +
      `- Keep top-level keyMatches and keyDifferences to <= 4 items each.\n`
    );
  }
  return (
    `OUTPUT RULES (performance-critical):\n` +
    `- In the rankings array, output ONLY: { targetId, rank } for each ranked target.\n` +
    `- Provide top-level reasoning + keyMatches + keyDifferences focusing on the TOP-RANKED target.\n` +
    `- Keep the top-level reasoning <= 70 words.\n` +
    `- Keep keyMatches and keyDifferences to <= 3 items each.\n`
  );
}

export function buildJudgmentContent(params: {
  targets: TargetInput[];
  impressionImages: string[];
  impressionText?: string;
  metadataMode: MetadataMode;
  includePerTargetDetails: boolean;
}): JudgeContentPart[] {
  const idsList = params.targets.map((t) => t.id).join("\n");
  const prelude = buildTargetPrelude(params.targets, params.metadataMode);
  const content: JudgeContentPart[] = [
    {
      type: "text",
      text:
        `You are an expert remote viewing judge.\n\n` +
        `You have analyzed ${params.targets.length} targets (AI does NOT know which is real):\n\n` +
        `${prelude}\n\n` +
        `Now examine the viewer's impression (images + optional text) and RANK ALL ${params.targets.length} targets based on how closely they match.\n\n` +
        `IMPORTANT OUTPUT FORMAT:\n` +
        `- Return ONLY valid JSON. No markdown, no code fences, no extra text.\n` +
        `- All string values MUST be single-line (no literal newline characters).\n` +
        `- Do not include unescaped double-quote characters inside string values.\n\n` +
        `You MUST provide a ranking for EVERY target listed below. Each rank 1..${params.targets.length} must be used exactly once (no ties).\n` +
        `TARGET IDS (one per line):\n${idsList}\n\n` +
        outputRules(params.includePerTargetDetails) +
        `\n` +
        `JSON shape:\n` +
        `{ "rankings": [{ "targetId": "string", "rank": 1 }], "reasoning": "string", "keyMatches": ["string"], "keyDifferences": ["string"] }`,
    },
  ];

  for (const img of params.impressionImages) {
    content.push({ type: "image_url", image_url: img });
  }
  if (params.impressionText && params.impressionText.trim().length > 0) {
    content.push({
      type: "text",
      text: `Viewer's textual impression (verbatim): ${params.impressionText.trim()}`,
    });
  }

  content.push({
    type: "text",
    text: "Reference images for each target (each image is labeled with its target ID):",
  });
  for (const t of params.targets) {
    content.push({ type: "text", text: `TARGET IMAGE (ID: ${t.id})` });
    content.push({ type: "image_url", image_url: t.imageUrl });
  }

  return content;
}
