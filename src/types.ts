import type { ModelFactory } from "./model";

export interface TargetInput {
  id: string;
  name?: string;
  description?: string;
  imageUrl: string;
}

export interface JudgmentRanking {
  targetId: string;
  rank: number;
  reasoning?: string;
  keyMatches?: string[];
  keyDifferences?: string[];
}

export interface JudgmentResultMany {
  rankings: JudgmentRanking[];
  reasoning: string;
  keyMatches: string[];
  keyDifferences: string[];
}

export type MetadataMode = "image_only" | "with_metadata";

export interface JudgeManyParams {
  targets: TargetInput[];
  impressionImages: string[];
  impressionText?: string;
  modelName?: string;
  includePerTargetDetails?: boolean;
  metadataMode?: MetadataMode;
  timeoutMs?: number;
  createModel: ModelFactory;
}
