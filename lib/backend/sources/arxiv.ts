import { canonicalArxivId } from "../ingest-utils";
import { XMLParser } from "fast-xml-parser";
import { libraryConfig } from "../../library-config";
import { physicalAiQuery } from "../config";
import type { DiscoveredPaper } from "../types";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const asArray = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];

export async function fetchRecentArxiv(maxResults = 50, query = physicalAiQuery): Promise<DiscoveredPaper[]> {
  const params = new URLSearchParams({
    search_query: query,
    start: "0",
    max_results: String(Math.min(maxResults, 100)),
    sortBy: "submittedDate",
    sortOrder: "descending"
  });
  let response: Response;
  try { response = await fetch(`https://export.arxiv.org/api/query?${params}`, {
    headers: { "User-Agent": "PhysicalAILibrary/0.1 (research discovery prototype)" },
    next: { revalidate: 0 }, signal: AbortSignal.timeout(15000)
  }); } catch { return fetchArxivRss(maxResults); }
  if (response.status === 429 || response.status >= 500) return fetchArxivRss(maxResults);
  if (!response.ok) throw new Error(`arXiv returned ${response.status}`);
  const body = parser.parse(await response.text());
  return asArray<Record<string, unknown>>(body.feed?.entry).map((entry) => {
    const id = String(entry.id);
    const arxivId = canonicalArxivId(id);
    const links = asArray<{ "@_href"?: string; "@_title"?: string }>(entry.link as never);
    return {
      externalId: arxivId,
      title: String(entry.title ?? "").replace(/\s+/g, " ").trim(),
      abstract: String(entry.summary ?? "").replace(/\s+/g, " ").trim(),
      authors: asArray<{ name?: string }>(entry.author as never).map((author) => String(author.name ?? "")),
      publishedAt: String(entry.published),
      updatedAt: String(entry.updated),
      url: id,
      pdfUrl: links.find((link) => link["@_title"] === "pdf")?.["@_href"],
      categories: asArray<{ "@_term"?: string }>(entry.category as never).map((category) => String(category["@_term"])),
      source: "arxiv" as const,
      raw: entry
    };
  });
}

async function fetchArxivRss(maxResults: number): Promise<DiscoveredPaper[]> {
  const response = await fetch(`https://rss.arxiv.org/rss/${encodeURIComponent(libraryConfig.arxivRssCategory)}`, {
    headers: { "User-Agent": "PhysicalAILibrary/0.1 (research discovery prototype)" },
    cache: "no-store", signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw new Error(`arXiv API was unavailable and RSS returned ${response.status}`);
  const body = parser.parse(await response.text());
  const items = asArray<Record<string, unknown>>(body.rss?.channel?.item).slice(0, maxResults);
  return items.map((item) => {
    const url = String(item.link ?? item.guid ?? "");
    const arxivId = canonicalArxivId(url);
    return {
      externalId: arxivId,
      title: String(item.title ?? "").replace(/\s+/g, " ").trim(),
      abstract: String(item.description ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      authors: String(item["dc:creator"] ?? "").split(",").map((author) => author.trim()).filter(Boolean),
      publishedAt: new Date(String(item.pubDate ?? Date.now())).toISOString(),
      url,
      pdfUrl: url.replace("/abs/", "/pdf/"),
      categories: [libraryConfig.arxivRssCategory],
      source: "arxiv" as const,
      raw: item
    };
  });
}
