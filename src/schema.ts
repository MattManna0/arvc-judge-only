import { z } from "zod";

export const TargetRankingSchema = z.object({
  targetId: z.string(),
  rank: z.number().int().min(1).max(10),
  reasoning: z.string().optional(),
  keyMatches: z.array(z.string()).optional(),
  keyDifferences: z.array(z.string()).optional(),
});

export const JudgmentSchemaMany = z.object({
  rankings: z.array(TargetRankingSchema),
  reasoning: z.string(),
  keyMatches: z.array(z.string()),
  keyDifferences: z.array(z.string()),
});

export function validateRankingsForTargets(
  rankings: Array<{ targetId: string; rank: number }>,
  targetIds: string[],
): void {
  const ids = targetIds.map((id) => id.trim()).filter(Boolean);
  const idSet = new Set(ids);
  const seenIds = new Set<string>();
  const seenRanks = new Set<number>();

  if (rankings.length !== ids.length) {
    throw new Error(`[Judge] Invalid rankings: expected ${ids.length} entries, got ${rankings.length}`);
  }

  for (const r of rankings) {
    const id = typeof r.targetId === "string" ? r.targetId.trim() : "";
    if (!id || !idSet.has(id)) {
      throw new Error(`[Judge] Invalid rankings: unknown targetId "${String(r.targetId)}"`);
    }
    if (seenIds.has(id)) {
      throw new Error(`[Judge] Invalid rankings: duplicate targetId "${id}"`);
    }
    seenIds.add(id);

    if (!Number.isInteger(r.rank)) {
      throw new Error(`[Judge] Invalid rankings: non-integer rank for "${id}"`);
    }
    if (r.rank < 1 || r.rank > ids.length) {
      throw new Error(
        `[Judge] Invalid rankings: rank out of range for "${id}" (rank=${r.rank}, expected 1..${ids.length})`,
      );
    }
    if (seenRanks.has(r.rank)) {
      throw new Error(`[Judge] Invalid rankings: duplicate rank ${r.rank}`);
    }
    seenRanks.add(r.rank);
  }
}
