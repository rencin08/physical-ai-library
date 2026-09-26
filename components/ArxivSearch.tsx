"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { ArxivSearchPage } from "@/lib/arxiv-search";

import {AddArxivButton} from './AddPaper';

const topicQueries: Record<string, string> = { VLA: "vision language action", "Robot Data": "robot dataset", "World Models": '"world model"', "Diffusion Policies": "diffusion policy", Manipulation: "robot manipulation" };
export function ArxivSearch({ query, topic, label = "Find more on arXiv", year }: { query: string; topic: string; label?: string; year?: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sort, setSort] = useState("newest");
  const [request, setRequest] = useState({ query: "", sort: "newest", start: 0, attempt: 0 });
  const [data, setData] = useState<ArxivSearchPage | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  function search(value: string, order = sort, start = 0) {
    if (!value.trim()) return;
    setLoading(true); setError(""); setData(null);
    setRequest(previous => ({ query: value.trim(), sort: order, start, attempt: previous.attempt + 1 }));
  }
  function show() {
    const value = query.trim() || topicQueries[topic] || (topic !== "All" ? topic : "robot learning");
    setDraft(value); setSort("newest"); setOpen(true); dialog.current?.showModal(); search(value, "newest");
  }
  useEffect(() => {
    if (!open || !request.query) return;
    const controller = new AbortController();
    fetch(`/api/arxiv/search?${new URLSearchParams({ q: request.query, sort: request.sort, start: String(request.start), ...(year ? { year: String(year) } : {}) })}`, { signal: controller.signal })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not search arXiv."); return body as ArxivSearchPage; })
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not search arXiv."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, request, year]);
  const externalSearch = `https://arxiv.org/search/?${new URLSearchParams({ query: request.query || draft, searchtype: "all", order: "-announced_date_first" })}`;
  return <>
    <button className="arxiv-trigger" onClick={show}><Search size={13}/> {label}</button>
    <dialog className="arxiv-dialog" ref={dialog} onClose={() => setOpen(false)} aria-labelledby="arxiv-search-title">
      <div className="arxiv-dialog-heading"><div><h2 id="arxiv-search-title">Search arXiv</h2><p>{year ? `Papers first submitted in ${year}. ` : "Original papers from across arXiv. "}Learning guides aren’t included.</p></div><button aria-label="Close arXiv search" onClick={() => dialog.current?.close()}><X size={20}/></button></div>
      <form className="arxiv-search-form" onSubmit={event => { event.preventDefault(); search(draft); }}>
        <input aria-label="Search all of arXiv" placeholder="Topic, paper title, or author" maxLength={160} value={draft} onChange={event => setDraft(event.target.value)} required/>
        <button type="submit" disabled={loading || !draft.trim()}>Search</button>
        <label>Order <select aria-label="arXiv result order" value={sort} disabled={loading} onChange={event => { setSort(event.target.value); search(draft, event.target.value); }}><option value="newest">Newest first</option><option value="relevance">Most relevant</option></select></label>
      </form>
      <div className="arxiv-results" aria-busy={loading}>
        {loading && <p role="status">Searching arXiv…</p>}
        {error && <p role="alert">{error} <a href={externalSearch} target="_blank" rel="noreferrer">Open arXiv ↗</a></p>}
        {data && <><p className="arxiv-result-count" role="status">{data.total === 0 ? `No papers found for “${request.query}”. Try a broader search.` : `${data.start + 1}–${data.start + data.papers.length} of ${data.total.toLocaleString()} matches`}</p>
          {data.papers.map(paper => <article key={paper.id} className="arxiv-result"><p className="arxiv-date">{paper.published.slice(0, 10)} · arXiv</p><h3><a href={paper.url} target="_blank" rel="noreferrer">{paper.title} ↗</a></h3><p className="arxiv-authors">{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? " et al." : ""}</p><details><summary>Read abstract</summary><p>{paper.abstract}</p></details><a className="arxiv-pdf" href={paper.pdfUrl} target="_blank" rel="noreferrer">Open PDF ↗</a><AddArxivButton arxiv={paper.id}/></article>)}
          {(data.start > 0 || data.nextStart !== null) && <div className="arxiv-pagination"><button disabled={data.start === 0} onClick={() => search(request.query, request.sort, Math.max(0, data.start - 10))}>Previous</button><button disabled={data.nextStart === null} onClick={() => search(request.query, request.sort, data.nextStart!)}>Next 10</button></div>}
        </>}
      </div>
    </dialog>
  </>;
}
