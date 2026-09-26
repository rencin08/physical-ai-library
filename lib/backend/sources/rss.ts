import { XMLParser } from "fast-xml-parser";
import { stableId } from "../normalize";
import type { FeedItem } from "../types";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const asArray = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];

export async function fetchFeed(url: string): Promise<FeedItem[]> {
  const response = await fetch(url, { headers: { "User-Agent": "PhysicalAILibrary/0.1" }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Feed ${url} returned ${response.status}`);
  const parsed = parser.parse(await response.text());
  const channel = parsed.rss?.channel;
  const atom = parsed.feed;
  const sourceName = channel?.title ?? atom?.title ?? new URL(url).hostname;
  const items = asArray<Record<string, unknown>>(channel?.item ?? atom?.entry);
  return items.slice(0, 30).map((item) => {
    const linkValue = typeof item.link === "string" ? item.link : (item.link as { "@_href"?: string })?.["@_href"];
    const itemUrl = String(linkValue ?? item.guid ?? "");
    return {
      externalId: stableId(itemUrl || String(item.title)),
      title: String(item.title ?? "Untitled"),
      summary: String(item.description ?? item.summary ?? item.content ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000),
      url: itemUrl,
      publishedAt: String(item.pubDate ?? item.published ?? item.updated ?? "") || undefined,
      sourceName: String(sourceName), contentKind: "news", raw: item
    };
  });
}
