import { parseModelJsonObject } from "./json";
import { invokeWithTimeout } from "./model";
import { buildJudgmentContent } from "./prompts";
import { JudgmentSchemaMany, validateRankingsForTargets } from "./schema";
import type { JudgeManyParams, JudgmentResultMany } from "./types";

function isModelNotFoundError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("[404 Not Found]") ||
    msg.includes("is not found for API version") ||
    msg.includes("Model not found") ||
    msg.includes("not supported for generateContent")
  );
}

function getModelCandidates(modelName: string): string[] {
  const candidates: string[] = [modelName];

  if (modelName === "gemini-3.0-pro") {
    candidates.push("gemini-3.0-flash", "gemini-2.5-pro", "gemini-2.5-flash");
  } else if (modelName === "gemini-3.0-flash") {
    candidates.push("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash");
  } else if (modelName === "gemini-2.5-pro") {
    candidates.push("gemini-2.5-flash", "gemini-2.0-pro", "gemini-2.0-flash");
  } else if (modelName === "gemini-2.5-flash") {
    candidates.push("gemini-2.0-flash", "gemini-1.5-flash");
  } else if (modelName === "gemini-2.0-pro") {
    candidates.push("gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash");
  } else if (modelName === "gemini-2.0-flash") {
    candidates.push("gemini-1.5-flash");
  }

  return Array.from(new Set(candidates));
}

function assertTargetsHaveImages(targets: Array<{ id: string; imageUrl: string }>): void {
  const missing = targets.filter((t) => typeof t.imageUrl !== "string" || t.imageUrl.trim().length === 0);
  if (missing.length === 0) return;
  const sampleIds = missing
    .map((t) => (typeof t.id === "string" ? t.id.trim() : ""))
    .filter((id) => id.length > 0)
    .slice(0, 6);
  throw new Error(
    `[Judge] Missing target images for ${missing.length} targets.` +
      (sampleIds.length > 0 ? ` Example IDs: ${sampleIds.join(", ")}` : ""),
  );
}

function parseAndValidateMany(rawText: string, targetIds: string[]): JudgmentResultMany {
  const parsed = parseModelJsonObject(rawText);
  const validated = JudgmentSchemaMany.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`[Judge] Invalid judgment JSON: ${validated.error.message}`);
  }
  validateRankingsForTargets(validated.data.rankings, targetIds);
  return validated.data as JudgmentResultMany;
}

/**
 * Full N-way blind ranking.
 * Defaults to image-only target context; callers can opt into metadata context.
 */
export async function judgeMany(params: JudgeManyParams): Promise<JudgmentResultMany> {
  const initialModelName = (params.modelName || "gemini-3.0-flash").trim() || "gemini-3.0-flash";
  const modelCandidates = getModelCandidates(initialModelName);
  const includePerTargetDetails = params.includePerTargetDetails === true;
  const metadataMode = params.metadataMode === "with_metadata" ? "with_metadata" : "image_only";
  const timeoutMs = Math.max(5_000, Math.floor(params.timeoutMs ?? 55_000));

  if (!Array.isArray(params.targets) || params.targets.length < 2) {
    throw new Error("[Judge] Not enough targets to rank");
  }
  assertTargetsHaveImages(params.targets);

  const targetIds = params.targets.map((t) => t.id);
  let lastError: unknown;

  const runAttempt = async (modelName: string, withPerTargetDetails: boolean): Promise<JudgmentResultMany> => {
    const model = params.createModel(modelName);
    const content = buildJudgmentContent({
      targets: params.targets,
      impressionImages: params.impressionImages,
      impressionText: params.impressionText,
      metadataMode,
      includePerTargetDetails: withPerTargetDetails,
    });
    const raw = await invokeWithTimeout(model, content, timeoutMs);
    return parseAndValidateMany(raw, targetIds);
  };

  for (const modelName of modelCandidates) {
    try {
      try {
        return await runAttempt(modelName, includePerTargetDetails);
      } catch (err) {
        if (!includePerTargetDetails) throw err;
        return await runAttempt(modelName, false);
      }
    } catch (error) {
      lastError = error;
      if (isModelNotFoundError(error)) continue;
    }
  }

  throw lastError || new Error(`Judge failed: all model candidates exhausted for ${initialModelName}`);
}
