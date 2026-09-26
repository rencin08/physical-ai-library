import type { Enrichment } from "../types";

export async function enrichFromSemanticScholar(arxivId: string): Promise<Enrichment> {
  const fields = "paperId,citationCount,influentialCitationCount,referenceCount,openAccessPdf";
  const headers: HeadersInit = {};
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/ARXIV:${encodeURIComponent(arxivId)}?fields=${fields}`, { headers, signal: AbortSignal.timeout(8000) });
  if (response.status === 404) return {};
  if (!response.ok) throw new Error(`Semantic Scholar returned ${response.status}`);
  const data = await response.json();
  return {
    semanticScholarId: data.paperId,
    citationCount: data.citationCount,
    influentialCitationCount: data.influentialCitationCount,
    referenceCount: data.referenceCount,
    openAccessPdf: data.openAccessPdf?.url
  };
}
