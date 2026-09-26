"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { learningPaths, roadmapPapers, structureSource, type RoadmapOrder } from "@/lib/learning-paths";
import type { Paper } from "@/lib/data";
import { ArxivSearch } from "./ArxivSearch";
import { roadmapQueries } from "@/lib/roadmap-updates";
import { useReading } from "./ReadingProvider";

export function LearningMap({ papers }: { papers: Paper[] }) {
  const [active, setActive] = useState("start");
  const [order, setOrder] = useState<RoadmapOrder>("chronological");
  const { state } = useReading();
  const path = learningPaths.find(item => item.id === active)!;
  const currentYear = new Date().getFullYear();
  const available = roadmapPapers(papers, path, order);
  return <section id="topics" className="learning-map wrap">
    <div className="section-head"><div><div className="section-number">A map of the field</div><h1>How did the field get here?</h1></div><p>Trace the ideas over time, or switch to a suggested reading sequence.</p></div>
    <div className="learning-map-layout">
      <nav className="learning-categories" aria-label="Learning categories">{learningPaths.map(item => <button key={item.id} aria-pressed={active === item.id} aria-controls="learning-path" onClick={() => setActive(item.id)}>{item.title}</button>)}</nav>
      <div id="learning-path" className="learning-path" role="region" aria-label={path.title}>
        <span className="eyebrow">{path.title}</span><h3>{path.question}</h3>
        <p>{order === "suggested" ? path.before : "Follow the timeline from early foundations to recent developments. Dates use the first public paper submission or authors’ report release."}</p>
        <div className="roadmap-order-bar"><label>Order <select aria-label="Roadmap order" value={order} onChange={event => setOrder(event.target.value as RoadmapOrder)}><option value="chronological">Chronological · oldest first</option><option value="newest">Newest first</option><option value="suggested">Suggested reading order</option></select></label><ArxivSearch key={active} query={roadmapQueries[active]} topic={path.title} label={`Browse ${currentYear} research`} year={currentYear}/></div>
        <p className="roadmap-coverage">{available.length} selected papers{available.length > 0 && ` · ${Math.min(...available.map(p=>p.year))}–${Math.max(...available.map(p=>p.year))}`} · A growing reading map, not an exhaustive survey.</p>
        {available.length ? <ol className={order === "suggested" ? "" : "roadmap-timeline"}>{available.map(paper => <li key={paper.slug} data-year={paper.year} data-date={paper.publishedAt ?? String(paper.year)}><div><Link href={`/paper/${paper.slug}`}>{paper.shortTitle} <ArrowUpRight size={16}/></Link><time dateTime={paper.publishedAt ?? String(paper.year)}>{paper.publishedAt ?? paper.year}{state.records[paper.slug]?.status === "completed" ? " · Finished" : ""}</time></div><p>{paper.why || paper.summary}</p></li>)}</ol> : <p>No local selections yet. Browse current research or explore the source list below.</p>}
        <a className="text-link" href={`${structureSource}#${path.sourceAnchor}`} target="_blank" rel="noreferrer">More in this category <ArrowUpRight size={15}/></a>
      </div>
    </div>
    <p className="learning-attribution">Category structure inspired by <a href={structureSource} target="_blank" rel="noreferrer">Keon Kim’s Awesome Physical AI</a>. Suggested reading order and “why read” notes are editorial selections. New additions have source-based overviews; illustrated learning guides are added separately.</p>
  </section>;
}
