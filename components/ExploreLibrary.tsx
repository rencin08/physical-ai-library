"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { PaperCard } from "./PaperCard";
import { sortByCitations } from "@/lib/learning-paths";
import type { Paper } from "@/lib/data";

export function ExploreLibrary({ papers }: { papers: Paper[] }) {
  const search = useSearchParams();
  const urlQuery = search.get("q") ?? "";
  const [editedQuery, setEditedQuery] = useState<{ source: string; value: string } | null>(null);
  const query = editedQuery?.source === urlQuery ? editedQuery.value : urlQuery;
  const [topic, setTopic] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("default");
  const shown = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const result = papers.filter(paper => (!topic || paper.topics.includes(topic)) && (!year || String(paper.year) === year) && terms.every(term => [paper.title, paper.summary, paper.authors, paper.institution, paper.architecture, paper.dataset, ...paper.topics].join(" ").toLowerCase().includes(term)));
    return sort === "cited" ? sortByCitations(result) : sort === "newest" ? result.sort((a, b) => b.year - a.year) : result;
  }, [papers, query, topic, year, sort]);
  return <><div className="search-box compact"><Search/><input aria-label="Search papers" placeholder="What are you trying to understand?" value={query} onChange={event => setEditedQuery({ source: urlQuery, value: event.target.value })}/></div><div className="filter-bar"><span><SlidersHorizontal size={16}/> Filter by</span><select aria-label="Filter topic" value={topic} onChange={event => setTopic(event.target.value)}><option value="">All topics</option>{[...new Set(papers.flatMap(paper => paper.topics))].sort().map(item => <option key={item}>{item}</option>)}</select><select aria-label="Filter year" value={year} onChange={event => setYear(event.target.value)}><option value="">All years</option>{[...new Set(papers.map(paper => paper.year))].sort((a, b) => b - a).map(item => <option key={item}>{item}</option>)}</select><select aria-label="Sort papers" value={sort} onChange={event => setSort(event.target.value)}><option value="default">Library order</option><option value="newest">Newest first</option><option value="cited">Most cited</option></select></div><div className="results-head"><span>{shown.length} papers</span><p>Find your next idea.</p></div>{shown.length ? <div className="paper-grid explore-grid">{shown.map((paper, index) => <PaperCard paper={paper} index={index} key={paper.slug}/>)}</div> : <div className="empty-state"><h2>No papers here yet.</h2><p>Try a different search or add papers to the library.</p></div>}</>;
}
