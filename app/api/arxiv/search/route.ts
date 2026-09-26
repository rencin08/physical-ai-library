import { NextResponse } from "next/server";
import { ARXIV_PAGE_SIZE, arxivQuery, parseArxivSearch, type ArxivSearchPage } from "@/lib/arxiv-search";

export const runtime = "nodejs";
const cache = new Map<string, { expires: number; data: ArxivSearchPage }>();
let nextRequestAt = 0;
let inFlight = false;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim();
  const start = Number(params.get("start") ?? 0);
  const year = params.has("year") ? Number(params.get("year")) : null;
  if (year !== null && (!Number.isInteger(year) || year < 1991 || year > new Date().getUTCFullYear())) return NextResponse.json({ error: "Choose a valid publication year." }, { status: 400 });
  const sort = params.get("sort") ?? "newest";
  if (!query || query.length > 160 || !Number.isInteger(start) || start < 0 || start > 29990 || !["newest", "relevance"].includes(sort)) return NextResponse.json({ error: "Enter a search of up to 160 characters." }, { status: 400 });
  let searchQuery: string;
  try { searchQuery = arxivQuery(query); } catch { return NextResponse.json({ error: "Enter a topic, title, or author." }, { status: 400 }); }
  if (year !== null) searchQuery = `(${searchQuery}) AND submittedDate:[${year}01010000 TO ${year}12312359]`;
  const key = JSON.stringify([searchQuery, start, sort]);
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return NextResponse.json(saved.data);
  if (inFlight || Date.now() < nextRequestAt) return NextResponse.json({ error: "Please wait a few seconds before searching again." }, { status: 429, headers: { "Retry-After": "3" } });
  inFlight = true;
  try {
    const upstream = new URLSearchParams({ search_query: searchQuery, start: String(start), max_results: String(ARXIV_PAGE_SIZE), sortBy: sort === "newest" ? "submittedDate" : "relevance", sortOrder: "descending" });
    const response = await fetch(`https://export.arxiv.org/api/query?${upstream}`, { headers: { "User-Agent": "PhysicalAILibrary/0.1 (on-demand paper search)" }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`arXiv HTTP ${response.status}`);
    const data = parseArxivSearch(await response.text(), start);
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(key, { expires: Date.now() + 300000, data });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "arXiv search is temporarily unavailable. Try again, or search on arXiv directly." }, { status: 502 });
  } finally { inFlight = false; nextRequestAt = Date.now() + 3000; }
}
