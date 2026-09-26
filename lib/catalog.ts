import { papers, type Paper } from "@/lib/data";
import { backendConfigured } from "@/lib/backend/config";
import { createAdminClient } from "@/lib/backend/supabase";

import {getPersonalPapers} from '@/lib/imports/store';
import {headers} from 'next/headers';
import {localHost} from '@/lib/imports/access';

type CatalogRow = {
  arxiv_url?: string | null; pdf_url?: string | null;
  slug: string; arxiv_id: string | null; title: string; authors_json: string[] | null;
  institutions_json: string[] | null; published_at: string | null; plain_english_summary: string | null;
  abstract: string | null; why_it_matters: string | null; topics: string[] | null; categories: string[] | null;
  architecture: string | null; task: string | null; embodiments: string[] | null; modalities: string[] | null;
  datasets: string[] | null; github_url: string | null;
  citation_count?: number | null; semantic_scholar_id?: string | null;
};
export function paperFromRow(row: CatalogRow): Paper {
  return {
    ...(typeof row.citation_count === "number" && row.citation_count >= 0 ? { citationCount: row.citation_count,
      ...(row.semantic_scholar_id ? { citationUrl: `https://www.semanticscholar.org/paper/${row.semantic_scholar_id}` } : {}) } : {}),
    sourceUrl: row.arxiv_url || undefined, pdfUrl: row.pdf_url || undefined, publishedAt: row.published_at || undefined,
    slug: row.slug, arxivId: row.arxiv_id ?? "", title: row.title,
    shortTitle: row.title.split(/[:—]/)[0].split(" ").slice(0, 5).join(" "),
    authors: (row.authors_json ?? []).join(", "), institution: (row.institutions_json ?? []).join(" · ") || "arXiv",
    year: Number(row.published_at?.slice(0, 4)) || new Date().getFullYear(),
    summary: row.plain_english_summary || row.abstract || "No abstract available.", why: row.why_it_matters || "",
    topics: row.topics?.length ? row.topics : row.categories ?? [], accent: "blue", architecture: row.architecture || "",
    task: row.task || "", embodiments: (row.embodiments ?? []).join(", "), modalities: (row.modalities ?? []).join(", "),
    dataset: (row.datasets ?? []).join(", "), openSource: Boolean(row.github_url), contributions: [], limitations: [], lineage: []
  };
}

export type CatalogSnapshot = { papers: Paper[]; source: "connected" | "offline" | "local"; importedCount: number };
export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  const personal=localHost((await headers()).get('host'))?await getPersonalPapers():[];
  const localPapers=[...papers,...personal.filter(p=>!papers.some(c=>c.slug===p.slug||c.arxivId===p.arxivId))];
  if (!backendConfigured()) return { papers:localPapers, source: "local", importedCount: 0 };
  try {
    const { data, error } = await createAdminClient().from("papers").select("*").eq("status", "published").order("published_at", { ascending: false }).limit(200).abortSignal(AbortSignal.timeout(8000));
    if (error) return { papers:localPapers, source: "offline", importedCount: 0 };
    const imported = (data ?? []).map(row => paperFromRow(row as CatalogRow)).filter(item => !localPapers.some(paper => paper.slug === item.slug || (item.arxivId && paper.arxivId === item.arxivId.replace(/v\d+$/, ""))));
    return { papers: [...localPapers, ...imported], source: "connected", importedCount: imported.length };
  } catch { return { papers:localPapers, source: "offline", importedCount: 0 }; }
}
export async function getCatalog(): Promise<Paper[]> { return (await getCatalogSnapshot()).papers; }
