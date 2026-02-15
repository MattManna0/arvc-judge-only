export type JudgeContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: string };

export type InvokeOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export interface JudgeModel {
  invoke(content: JudgeContentPart[], options?: InvokeOptions): Promise<string>;
}

export type ModelFactory = (modelName: string) => JudgeModel;

export async function invokeWithTimeout(
  model: JudgeModel,
  content: JudgeContentPart[],
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await model.invoke(content, { timeoutMs, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
