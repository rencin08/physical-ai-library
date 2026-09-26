import { paperSource } from "@/lib/paper-source";
import { SavePaperButton } from "@/components/SavePaperButton";
import { learningGuides } from "@/lib/learning/guides";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { findPaper, papers, type Paper } from "@/lib/data";
import { PaperCard } from "@/components/PaperCard";
import { ResearchBook } from "@/components/ResearchBook";

import { backendConfigured } from "@/lib/backend/config";
import { createAdminClient } from "@/lib/backend/supabase";

import {getPersonalPapers} from '@/lib/imports/store';
import {localHost} from '@/lib/imports/access';
import {headers} from 'next/headers';
import {GuidePreparation} from '@/components/GuidePreparation';

async function loadPaper(slug: string): Promise<{paper: Paper; imported?: boolean; personal?: boolean; hasSummary?: boolean} | null> {
  const curated = findPaper(slug);
  if (curated) return {paper: curated};
  if(localHost((await headers()).get('host'))){
    const personal=(await getPersonalPapers()).find(p=>p.slug===slug);
    if(personal)return {paper:personal,imported:true,personal:true};
  }
  if (!backendConfigured()) return null;
  const {data: row} = await createAdminClient().from("papers").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!row) return null;
  return {imported: true, hasSummary: Boolean(row.plain_english_summary), paper: {
    sourceUrl: row.arxiv_url || undefined, pdfUrl: row.pdf_url || undefined, publishedAt: row.published_at || undefined,
    slug: row.slug, arxivId: row.arxiv_id ?? "", title: row.title, shortTitle: row.title,
    authors: (row.authors_json ?? []).join(", "), institution: (row.institutions_json ?? []).join(" · "),
    year: Number(row.published_at?.slice(0,4)), summary: row.plain_english_summary || row.abstract || "No abstract available.",
    why: row.why_it_matters || "", topics: row.topics?.length ? row.topics : row.categories ?? [], accent: "blue",
    architecture: row.architecture || "", task: row.task || "", embodiments: (row.embodiments ?? []).join(", "),
    modalities: (row.modalities ?? []).join(", "), dataset: (row.datasets ?? []).join(", "), openSource: Boolean(row.github_url),
    contributions: [], limitations: [], lineage: []
  }};
}

export const dynamic = "force-dynamic";

export default async function PaperPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const result=await loadPaper(slug); if(!result) notFound(); const {paper}=result;
  const {sourceUrl, arxivId}=paperSource(paper);
  return <div className="wrap paper-page book-paper-page"><div className="breadcrumb"><Link href="/">Library</Link> / {paper.topics[0]}</div><header className="paper-header book-paper-header"><div><div className="tags">{paper.topics.map(t=><span key={t}>{t}</span>)}</div><h1>{paper.title}</h1><p>{paper.authors} <i/> {paper.institution} <i/> {paper.year}</p></div><div className="paper-buttons">{sourceUrl && <a className="primary" href={sourceUrl} target="_blank">{arxivId ? "View on arXiv" : "Authors’ research page"} <ExternalLink/></a>}<SavePaperButton paper={paper}/></div></header>{!learningGuides[paper.slug]&&result.personal&&<GuidePreparation slug={paper.slug}/>}<ResearchBook paper={paper} overviewOnly={!learningGuides[paper.slug]} hasSummary={result.hasSummary}/><section className="related"><div className="section-head"><div><div className="section-number">Continue exploring</div><h2>Related papers</h2></div></div><div className="paper-grid">{papers.filter(p=>p.slug!==paper.slug).slice(0,3).map((p,i)=><PaperCard paper={p} index={i} key={p.slug}/>)}</div></section></div>;
}
