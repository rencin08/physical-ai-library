"use client";

import { AddPaper } from './AddPaper';
import { FreshPapers } from './FreshPapers';
import { ArxivSearch } from "./ArxivSearch";
import { useReading } from "./ReadingProvider";
import { defaultPreferences, recommendPapers } from "@/lib/recommendations";
import { SavePaperButton } from "./SavePaperButton";
import { selectForYou, sortByCitations } from "@/lib/learning-paths";
import { libraryConfig } from "@/lib/library-config";
import Link from "next/link";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { papers, guidedPaperSlugs, type Paper } from "@/lib/data";

type ShelfPaper = Paper & { href?: string; sourceLabel?: string };

export function InteractiveLibrary({ livePapers = [], initialQuery = "" }: { livePapers?: ShelfPaper[]; initialQuery?: string }) {
  const libraryPapers: ShelfPaper[] = [
    ...papers,
    ...livePapers.filter(item => !papers.some(curated => curated.slug === item.slug || (item.arxivId && curated.arxivId === item.arxivId))),
  ];
  const { state, ready, changePreferences } = useReading();
  const preferences = state.preferences ?? defaultPreferences();
  const [view, setView] = useState<"for-you" | "all">(initialQuery ? "all" : "for-you");
  const [showInterests, setShowInterests] = useState(false);
  const [message, setMessage] = useState("");
  const recommendations = recommendPapers(libraryPapers, state, preferences);
  const [filter, setFilter] = useState("All");
  const [catalogSort, setCatalogSort] = useState("newest");
  const ordered = view === "for-you" ? selectForYou(recommendations.filter(item => filter === "All" || [...item.paper.topics, item.paper.task].join(" ").toLowerCase().includes(filter.toLowerCase()))).map(item => item.paper) : catalogSort === "cited" ? sortByCitations(libraryPapers) : catalogSort === "newest" ? [...libraryPapers].sort((a,b) => b.year-a.year || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")) : libraryPapers;
  const [activeSlug, setActiveSlug] = useState("");

  const [query, setQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const shelfRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLAnchorElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ left: 16, top: 90 });
  function keepPreview() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }
  function closePreview() { keepPreview(); setActiveSlug(""); }
  function leavePreview() {
    keepPreview();
    closeTimer.current = setTimeout(() => {
      if (previewRef.current?.matches(":hover") || previewRef.current?.contains(document.activeElement) || anchorRef.current?.matches(":hover")) return;
      setActiveSlug("");
    }, 220);
  }
  function openPreview(slug: string, anchor: HTMLAnchorElement) {
    keepPreview(); anchorRef.current = anchor; setActiveSlug(slug);
  }
  useLayoutEffect(() => {
    if (!activeSlug) return;
    const position = () => {
      if (!anchorRef.current || !previewRef.current) return;
      const anchor = anchorRef.current.getBoundingClientRect();
      const box = previewRef.current.getBoundingClientRect();
      const left = anchor.right + 12 + box.width <= window.innerWidth - 16
        ? anchor.right + 12 : anchor.left - box.width - 12;
      const next = {
        left: Math.max(16, Math.min(left, window.innerWidth - box.width - 16)),
        top: Math.max(84, Math.min(anchor.top, window.innerHeight - box.height - 16)),
      };
      setPreviewPosition(current => current.left === next.left && current.top === next.top ? current : next);
    };
    position();
    const observer = new ResizeObserver(position);
    if (previewRef.current) observer.observe(previewRef.current);
    window.addEventListener("scroll", position, true);
    return () => { observer.disconnect(); window.removeEventListener("scroll", position, true); };
  }, [activeSlug]);
  useEffect(() => {
    if (!activeSlug) return;
    const dismiss = () => setActiveSlug("");
    const outside = (event: PointerEvent) => {
      if (!previewRef.current?.contains(event.target as Node) && !anchorRef.current?.contains(event.target as Node)) dismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { anchorRef.current?.focus(); dismiss(); }
    };
    const scroll = (event: Event) => { if (!previewRef.current?.contains(event.target as Node) && !(event.target === shelfRef.current && previewRef.current?.contains(document.activeElement))) dismiss(); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("wheel", scroll, true);
    window.addEventListener("touchmove", scroll, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("wheel", scroll, true);
      window.removeEventListener("touchmove", scroll, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [activeSlug]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  const matchesQuery = (item: ShelfPaper) => !query.trim() || [item.title, item.summary, item.authors, item.institution, ...item.topics].join(" ").toLowerCase().includes(query.trim().toLowerCase());
  const shelfPapers = (query.trim() ? libraryPapers : ordered).filter(matchesQuery).filter(item => filter === "All" || [...item.topics, item.task].join(" ").toLowerCase().includes(filter.toLowerCase()));
  const paper = shelfPapers.find(item => item.slug === activeSlug);
  const availableTopics = [...new Set([...libraryConfig.topics, ...libraryPapers.flatMap(item => item.topics), ...preferences.interests])].sort();
  function feedback(slug: string, choice: "more" | "less") {
    const wasSelected = preferences.feedback[slug] === choice;
    if (changePreferences(current => {
      const next = { ...current.feedback };
      if (next[slug] === choice) delete next[slug]; else next[slug] = choice;
      return { ...current, feedback: next };
    })) { setActiveSlug(choice === "more" ? slug : ""); setMessage(wasSelected ? "Feedback removed." : choice === "less" ? "Hidden from For you. You can restore it in All papers." : "Your shelf now favors papers with similar topics."); }
  }
  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = normalizedQuery ? libraryPapers.filter((item) => [item.title,item.summary,item.authors,item.institution,...item.topics].join(" ").toLowerCase().includes(normalizedQuery)).slice(0,5) : [];
  const suggestedResults = searchResults.length ? searchResults : libraryPapers.slice(0,3);

  useEffect(() => { if (showInterests) document.getElementById("shelf-interests")?.scrollIntoView({ block: "center", behavior: "smooth" }); }, [showInterests]);

  function moveShelf(direction: number) {
    shelfRef.current?.scrollBy({ left: direction * 520, behavior: "smooth" });
  }

  if (!libraryPapers.length) return <div className="library-stage"><div className="empty-state"><h2>Your library starts here.</h2><AddPaper/><p>Add papers to your catalog, or connect arXiv discovery and publish your first selections.</p><Link className="text-link" href="/admin/review">Open the review desk <ArrowRight size={15}/></Link></div></div>;

  return <div id="papers" className="library-stage">
    <div className="personal-shelf-bar wrap">
      <div className="shelf-view" role="group" aria-label="Choose your shelf">
        <button aria-pressed={view === "for-you"} onClick={() => { setView("for-you"); setActiveSlug(""); shelfRef.current?.scrollTo({ left: 0 }); }}>For you</button>
        <button aria-label="All papers" aria-pressed={view === "all"} onClick={() => { setView("all"); setActiveSlug(""); shelfRef.current?.scrollTo({ left: 0 }); }}>All papers <span className="shelf-count">{libraryPapers.length}</span></button>
      </div>
      <div className="shelf-browse-actions">
        {view === "all" && <select className="shelf-sort" aria-label="Shelf order" value={catalogSort} onChange={event => { setCatalogSort(event.target.value); setActiveSlug(""); shelfRef.current?.scrollTo({left:0}); }}><option value="library">Library order</option><option value="newest">Newest first</option><option value="cited">Most cited</option></select>}
        <button className="choose-interests" aria-expanded={showInterests} aria-controls="shelf-interests" onClick={() => setShowInterests(!showInterests)}>Your interests{preferences.interests.length > 0 && <span className="interest-count">{preferences.interests.length}</span>}</button>
      </div>
    </div>
    <div className="shelf-explanation wrap"><p>{query.trim() ? `${shelfPapers.length} ${shelfPapers.length === 1 ? "paper" : "papers"} matching “${query.trim()}”` : filter !== "All" ? `${shelfPapers.length} ${shelfPapers.length === 1 ? "paper" : "papers"} on this shelf in ${filter}.` : view === "for-you" ? "A mix of foundations and recent research, picked for you." : "Your whole collection, ready to explore."}</p><div className="library-import-actions"><AddPaper/><ArxivSearch query={query} topic={filter}/></div></div>
    <div className="shelf-scene">
      <div className="shelf-back" />
      {!shelfPapers.length && <div className="shelf-empty"><h2>No papers on this shelf yet.</h2><p>{query.trim() ? "Try a different search or show all papers." : filter !== "All" ? "Try another topic or clear the filter." : "No unread suggestions remain. Browse All papers to revisit finished or hidden papers."}</p><button onClick={() => { setFilter("All"); setQuery(""); setView("all"); }}>Show all papers</button></div>}
      <div className="shelf-viewport" ref={shelfRef} onWheel={(event) => {
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) shelfRef.current?.scrollBy({ left: event.deltaY });
      }}><div className="book-row">
        {shelfPapers.map((item, index) => {
          const heights = [214,252,228,276,238,263,219,247,282,230,258,222,270,242,286,226,265,235,253];
          const lean = [-1,0,0,-.5,1,0,-1,0,0,1,-.5,0,1,-.5,.5,0,-1,.5,0];
          return <Link
            href={`/paper/${item.slug}`}
            aria-label={`Open learning view for ${item.title}`}
            className={`shelf-book ${item.accent} shelf-tone-${index % 8} ${paper?.slug === item.slug ? "selected" : ""}`}
            style={{height:Math.max(260, heights[index % heights.length]),transform:`rotate(${lean[index % lean.length]}deg) translateZ(${index % 4}px)`}}
            aria-expanded={activeSlug === item.slug}
            aria-controls={activeSlug === item.slug ? "shelf-preview" : undefined}
            onPointerEnter={event => { if (event.pointerType === "mouse") openPreview(item.slug, event.currentTarget); }}
            onPointerLeave={event => { if (event.pointerType === "mouse") leavePreview(); }}
            onFocus={event => { if (event.currentTarget.matches(":focus-visible")) openPreview(item.slug, event.currentTarget); }}
            onBlur={event => { if (!previewRef.current?.contains(event.relatedTarget as Node)) leavePreview(); }}
            onClick={event => {
              if (window.matchMedia("(hover: none)").matches) { event.preventDefault(); openPreview(item.slug, event.currentTarget); }
            }}
            onKeyDown={event => { if (event.key === "ArrowDown" && activeSlug === item.slug) { event.preventDefault(); previewRef.current?.querySelector<HTMLButtonElement>("button")?.focus(); } }}
            key={item.slug}
          >
            <i /><i className="lower-rib" />
            <span>{item.title}</span>
            <small>{item.authors}</small>
            <b>{item.year}</b>
          </Link>;
        })}
      </div></div>
      <div className="shelf-board"><span>{libraryConfig.shelfLabel}</span></div>
      <div className="shelf-controls"><button onClick={() => moveShelf(-1)} aria-label="Scroll shelf left"><ArrowLeft/></button><span>Scroll to browse</span><button onClick={() => moveShelf(1)} aria-label="Scroll shelf right"><ArrowRight/></button></div>
    </div>
    <p className="shelf-hint"><span className="desktop-shelf-hint">Hover to preview · Click to read</span><span className="touch-shelf-hint">Tap a book to preview</span> <span>↗</span></p>
    <div id="library-search" className="library-tools">
      <form className="library-search" onSubmit={(event)=>{event.preventDefault();setShowSuggestions(false); setView("all"); shelfRef.current?.scrollTo({left:0}); document.getElementById("papers")?.scrollIntoView({behavior:"smooth",block:"start"})}}><Search size={15}/><input aria-label="Find a paper" placeholder="Search papers, authors, labs, or ideas…" value={query} onChange={event=>{setQuery(event.target.value);setShowSuggestions(true);setActiveSlug("");shelfRef.current?.scrollTo({left:0})}}/>{query&&<button type="button" aria-label="Clear search" onClick={()=>setQuery("")}>×</button>}</form>
      {query&&showSuggestions&&<div className="search-suggestions"><div className="suggestion-label">{searchResults.length?`${searchResults.length} close matches`:"No exact match — try these starting points"}</div>{suggestedResults.map(item=><button key={item.slug} onClick={()=>router.push(`/paper/${item.slug}`)}><span className={`suggestion-cover ${item.accent}`}>{item.shortTitle.slice(0,2)}</span><span><b>{item.title}</b><small>{item.authors} · {item.year}</small></span><ArrowRight/></button>)}<button className="search-all" onClick={()=>{setShowSuggestions(false);setView("all");document.getElementById("papers")?.scrollIntoView({behavior:"smooth",block:"start"});}}>View matches on the shelf <ArrowRight/></button></div>}
      <div id="topics" className="library-filters">{["All", ...libraryConfig.topics].map(item => <button className={filter === item ? "active" : ""} aria-pressed={filter === item} onClick={() => { setFilter(item); setActiveSlug(""); shelfRef.current?.scrollTo({ left: 0, behavior: "smooth" }); }} key={item}>{item}</button>)}</div>
    </div>

    {showInterests && <section id="shelf-interests" className="interest-panel" aria-label="Your interests"><h2>What are you curious about?</h2><p>Choose a few topics to shape your shelf. Recommendations stay on this device and never use your learning notes.</p><div className="interest-options">{availableTopics.map(topic => <button disabled={!ready} aria-pressed={preferences.interests.includes(topic)} key={topic} onClick={() => changePreferences(current => ({ ...current, interests: current.interests.includes(topic) ? current.interests.filter(item => item !== topic) : [...current.interests, topic] }))}>{topic}</button>)}</div><label className="history-preference"><input type="checkbox" disabled={!ready} checked={preferences.useReadingHistory} onChange={event => changePreferences(current => ({ ...current, useReadingHistory: event.target.checked }))}/> Use my bookmarks and finished papers</label><p>Reset clears interests and feedback and switches off reading history for recommendations. Your bookmarks and notes stay saved.</p><div className="interest-actions"><button disabled={!ready} onClick={() => { if (changePreferences(() => ({ interests: [], feedback: {}, useReadingHistory: false }))) { setFilter("All"); setMessage("Preferences reset. Your bookmarks and notes are unchanged."); } }}>Reset preferences</button><button onClick={() => setShowInterests(false)}>Done</button></div></section>}
    {message && <p className="shelf-feedback-status" role="status">{message}</p>}
    {paper && createPortal(<div id="shelf-preview" role="region" aria-label={`Preview: ${paper.title}`} className="shelf-preview book-tooltip" key={paper.slug} ref={previewRef} style={previewPosition}
      onPointerEnter={keepPreview} onPointerLeave={event => { if (event.pointerType === "mouse") leavePreview(); }} onFocus={keepPreview}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) leavePreview(); }}>
      <button className="preview-close" aria-label="Close preview" onClick={closePreview}><X size={18}/></button>
      <p className="recommendation-reason">{view === "for-you" ? recommendations.find(item => item.paper.slug === paper.slug)?.reason : preferences.feedback[paper.slug] === "less" ? "Hidden from your For you shelf" : "From the full library"}</p>
      <div className="tooltip-top"><span>{guidedPaperSlugs.includes(paper.slug) ? "Illustrated learning book" : "Paper overview"} · {paper.topics[0]}</span><SavePaperButton paper={paper}/></div>
      <h3>{paper.title}</h3>
      <p className="preview-authors">{paper.authors} · {paper.year}</p>
      <p className="preview-summary">{paper.summary}</p>
      {paper.citationCount !== undefined && <p className="preview-citations">{paper.citationUrl ? <a href={paper.citationUrl} target="_blank" rel="noreferrer">{paper.citationCount.toLocaleString("en-US")} citations · Semantic Scholar ↗</a> : `${paper.citationCount.toLocaleString("en-US")} citations · Semantic Scholar`}{paper.citationRetrievedAt && <small>Retrieved {paper.citationRetrievedAt.slice(0,10)}</small>}</p>}
      <div className="preview-open"><span>{`${paper.year} · ${guidedPaperSlugs.includes(paper.slug) ? "Learning guide" : "Paper overview"}`}</span><Link href={`/paper/${paper.slug}`} aria-label="Open book">Open book <ArrowUpRight size={16}/></Link></div>
      <div className="recommendation-feedback"><button disabled={!ready} aria-pressed={preferences.feedback[paper.slug] === "more"} onClick={() => feedback(paper.slug, "more")}>More like this</button><button disabled={!ready} aria-pressed={preferences.feedback[paper.slug] === "less"} onClick={() => feedback(paper.slug, "less")}>{preferences.feedback[paper.slug] === "less" ? "Restore to For you" : "Not interested"}</button></div>
    </div>, document.body)}

    <FreshPapers papers={libraryPapers}/>
  </div>;
}
