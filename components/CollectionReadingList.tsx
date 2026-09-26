"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, Check } from "lucide-react";
import type { Paper } from "@/lib/data";
import { useReading } from "./ReadingProvider";

export function CollectionReadingList({ papers }: { papers: Paper[] }) {
  const { state, ready, update } = useReading();
  const completed = papers.filter(paper => state.records[paper.slug]?.status === "completed").length;
  const allSaved = papers.length > 0 && papers.every(paper => state.records[paper.slug]?.saved);
  return <><div className="collection-save"><button disabled={!ready || !papers.length} onClick={() => papers.forEach(paper => update(paper, { saved: true }))}><Bookmark size={15}/>{allSaved ? "All papers saved" : "Save all papers"}</button></div><div className="progress"><span><b>{completed}</b> / {papers.length} read</span><progress aria-label="Collection reading progress" max={papers.length || 1} value={completed}/></div><div className="reading-list">{papers.map((paper, index) => {
    const finished = state.records[paper.slug]?.status === "completed";
    return <article key={paper.slug}><div className="reading-num">{String(index + 1).padStart(2, "0")}</div><div className={`reading-cover ${paper.accent}`}>{paper.shortTitle}</div><div className="reading-body"><span>{index < 2 ? "Begin here" : index < 5 ? "Build context" : "Go deeper"}</span><h2><Link href={`/paper/${paper.slug}`}>{paper.title}</Link></h2><p>{paper.why}</p><small>{paper.authors} · {paper.year}</small></div><div className="reading-actions"><button disabled={!ready} aria-pressed={finished} onClick={() => update(paper, { status: finished ? "reading" : "completed" })}><Check/>{finished ? "Finished · Undo" : "Mark read"}</button><Link aria-label={`Open ${paper.title}`} href={`/paper/${paper.slug}`}><ArrowUpRight/></Link></div></article>;
  })}</div></>;
}
