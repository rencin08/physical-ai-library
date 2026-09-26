import { createHash } from "node:crypto";
import { relevanceTerms } from "./config";

export function normalizeTitle(title: string) {
  return title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

export function stableId(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

export function slugify(title: string) {
  return normalizeTitle(title).replaceAll(" ", "-").slice(0, 90);
}

export function scorePhysicalAi(title: string, abstract = "") {
  if (!relevanceTerms.length) return { score: 1, matches: [] as string[] };
  const text = `${title} ${abstract}`.toLowerCase();
  const matches = relevanceTerms.filter((term) => text.includes(term));
  const titleMatches = relevanceTerms.filter((term) => title.toLowerCase().includes(term));
  const score = Math.min(1, matches.length * 0.11 + titleMatches.length * 0.16);
  return { score: Number(score.toFixed(2)), matches };
}
