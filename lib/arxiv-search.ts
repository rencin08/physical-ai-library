import { XMLParser, XMLValidator } from "fast-xml-parser";

export type ArxivResult = { id: string; title: string; authors: string[]; abstract: string; published: string; url: string; pdfUrl: string };
export type ArxivSearchPage = { papers: ArxivResult[]; total: number; start: number; nextStart: number | null };
export const ARXIV_PAGE_SIZE = 10;
export function arxivQuery(query: string) {
  const terms = [...query.matchAll(/"([^"]+)"|([\p{L}\p{N}-]+)/gu)].map(match => (match[1] ?? match[2]).replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!terms.length) throw new Error("Enter a topic, title, or author.");
  return terms.map(term => `all:"${term}"`).join(" AND ");
}
const array = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
export function parseArxivSearch(xml: string, start: number): ArxivSearchPage {
  if (XMLValidator.validate(xml) !== true) throw new Error("Invalid arXiv response");
  const feed = new XMLParser({ ignoreAttributes: false }).parse(xml).feed;
  if (!feed || feed["opensearch:totalResults"] === undefined) throw new Error("Missing arXiv results");
  const total = Number(feed["opensearch:totalResults"]);
  if (!Number.isSafeInteger(total) || total < 0) throw new Error("Invalid result count");
  const papers = array<Record<string, unknown>>(feed.entry).map(entry => {
    const id = String(entry.id ?? "").replace(/^https?:\/\/(?:export\.)?arxiv\.org\/abs\//, "");
    if (!/^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v\d+)?$/.test(id)) throw new Error("Invalid arXiv identifier");
    const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
    return { id, title: clean(entry.title), authors: array<{ name?: string }>(entry.author as never).map(author => clean(author.name)), abstract: clean(entry.summary), published: clean(entry.published), url: `https://arxiv.org/abs/${id}`, pdfUrl: `https://arxiv.org/pdf/${id}` };
  });
  const next = start + papers.length;
  return { papers, total, start, nextStart: papers.length && next < Math.min(total, 30000) ? next : null };
}
