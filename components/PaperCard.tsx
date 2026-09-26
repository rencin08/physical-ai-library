import { SavePaperButton } from "./SavePaperButton";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Paper } from "@/lib/data";

export function PaperCard({ paper, index = 0 }: { paper: Paper; index?: number }) {
  return <article className="paper-card">
    <Link className={`cover ${paper.accent}`} href={`/paper/${paper.slug}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{paper.shortTitle}</strong><small>{paper.institution}</small></Link>
    <div className="paper-card-body"><div className="meta-row"><span>{paper.institution}</span><span>{paper.year}</span></div><h3><Link href={`/paper/${paper.slug}`}>{paper.title}</Link></h3><p>{paper.summary}</p>{paper.citationCount !== undefined && <p className="citation-label">{paper.citationCount.toLocaleString("en-US")} citations · Semantic Scholar{paper.citationRetrievedAt ? ` · ${paper.citationRetrievedAt.slice(0,10)}` : " · Retrieval date unavailable"}</p>}<div className="tags">{paper.topics.slice(0, 2).map((topic) => <span key={topic}>{topic}</span>)}</div><div className="card-actions"><SavePaperButton paper={paper}/><Link href={`/paper/${paper.slug}`}>Open paper <ArrowUpRight size={15}/></Link></div></div>
  </article>;
}
