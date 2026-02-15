function extractLikelyJsonObject(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return candidate.slice(start, end + 1);
  return candidate;
}

function escapeControlCharsInJsonStrings(jsonLike: string): string {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonLike.length; i += 1) {
    const ch = jsonLike[i];

    if (!inString) {
      if (ch === "\"") inString = true;
      out += ch;
      continue;
    }

    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      out += ch;
      escaped = true;
      continue;
    }

    if (ch === "\"") {
      out += ch;
      inString = false;
      continue;
    }

    if (ch === "\n") {
      out += "\\n";
      continue;
    }

    if (ch === "\r") {
      out += "\\r";
      continue;
    }

    if (ch === "\t") {
      out += "\\t";
      continue;
    }

    out += ch;
  }

  return out;
}

export function parseModelJsonObject(rawText: string): unknown {
  const extracted = extractLikelyJsonObject(rawText)
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'");
  const sanitized = escapeControlCharsInJsonStrings(extracted);
  return JSON.parse(sanitized) as unknown;
}
