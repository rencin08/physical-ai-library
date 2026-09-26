export type Annotation = {
  id: string;
  chapter: number;
  surface: "left" | "right" | "overview" | "visual";
  start: number;
  end: number;
  quote: string;
  prefix: string;
  suffix: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

// Prefer the original position; after an editorial change, recover only a
// unique quote/context match. Never silently attach a note to another passage.
export function resolveAnchor(text: string, anchor: Pick<Annotation, "start" | "end" | "quote" | "prefix" | "suffix">): { start: number; end: number } | null {
  if (!anchor.quote) return null;
  if (text.slice(anchor.start, anchor.end) === anchor.quote) return { start: anchor.start, end: anchor.end };
  const matches: number[] = [];
  for (let at = text.indexOf(anchor.quote); at !== -1; at = text.indexOf(anchor.quote, at + 1)) matches.push(at);
  if (matches.length === 1) return { start: matches[0], end: matches[0] + anchor.quote.length };
  const contextual = matches.filter(at => (!anchor.prefix || text.slice(Math.max(0, at - anchor.prefix.length), at) === anchor.prefix) && (!anchor.suffix || text.slice(at + anchor.quote.length, at + anchor.quote.length + anchor.suffix.length) === anchor.suffix));
  return contextual.length === 1 ? { start: contextual[0], end: contextual[0] + anchor.quote.length } : null;
}

export function validAnnotation(value: unknown): value is Annotation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const a = value as Record<string, unknown>;
  return typeof a.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(a.id)
    && Number.isInteger(a.chapter) && Number(a.chapter) >= 0 && Number(a.chapter) <= 1000
    && ["left", "right", "overview", "visual"].includes(String(a.surface))
    && Number.isSafeInteger(a.start) && Number(a.start) >= 0 && Number.isSafeInteger(a.end) && Number(a.end) > Number(a.start)
    && typeof a.quote === "string" && a.quote.trim().length > 0 && a.quote.length <= 4000 && Number(a.end) - Number(a.start) === a.quote.length
    && typeof a.prefix === "string" && a.prefix.length <= 40 && typeof a.suffix === "string" && a.suffix.length <= 40
    && typeof a.note === "string" && a.note.length <= 20000
    && typeof a.createdAt === "string" && Number.isFinite(Date.parse(a.createdAt))
    && typeof a.updatedAt === "string" && Number.isFinite(Date.parse(a.updatedAt));
}
