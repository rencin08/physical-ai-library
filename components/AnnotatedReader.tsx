"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Highlighter, MessageSquare, X } from "lucide-react";
import type { Paper } from "@/lib/data";
import { resolveAnchor, type Annotation } from "@/lib/annotations";
import { useReading } from "./ReadingProvider";
import { learningChapterNames } from "./LearningChapter";

const EMPTY: Annotation[] = [];
type SelectionAnchor = Pick<Annotation, "start" | "end" | "quote" | "prefix" | "suffix" | "surface"> & { x: number; y: number };
type Painted = { id: string; left: number; top: number; width: number; height: number };

function textRange(surface: HTMLElement, start: number, end: number) {
  const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let offset = 0;
  let started = false;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (!started && start <= offset + length) { range.setStart(node, start - offset); started = true; }
    if (started && end <= offset + length) { range.setEnd(node, end - offset); return range; }
    offset += length;
  }
  return null;
}

export function AnnotatedReader({ paper, chapter, enabled, onNavigate, children }: { paper: Paper; chapter: number; enabled: boolean; onNavigate: (chapter: number) => void; children: ReactNode }) {
  const { state, ready, changeAnnotations } = useReading();
  const annotations = state.records[paper.slug]?.annotations ?? EMPTY;
  const content = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<SelectionAnchor | null>(null);
  const [sidebar, setSidebar] = useState(false);
  const initializedSidebar = useRef("");
  useEffect(() => {
    if (!ready || initializedSidebar.current === paper.slug) return;
    initializedSidebar.current = paper.slug;
    setSidebar(annotations.length > 0);
  }, [ready, paper.slug, annotations.length]);
  const [activeId, setActiveId] = useState("");
  const [pendingJump, setPendingJump] = useState("");
  const [painted, setPainted] = useState<Painted[]>([]);
  const [message, setMessage] = useState("");

  const locate = useCallback((annotation: Annotation) => {
    const surface = content.current?.querySelector<HTMLElement>(`[data-annotation-surface="${annotation.surface}"]`);
    if (!surface || annotation.chapter !== chapter || !enabled) return null;
    const anchor = resolveAnchor(surface.textContent ?? "", annotation);
    return anchor ? textRange(surface, anchor.start, anchor.end) : null;
  }, [chapter, enabled]);

  useEffect(() => {
    let frame = 0;
    function capture() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const selected = window.getSelection();
        if (!enabled || !selected || selected.isCollapsed || !selected.rangeCount) { setSelection(null); return; }
        const range = selected.getRangeAt(0);
        const element = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer as Element : range.startContainer.parentElement;
        const surface = element?.closest<HTMLElement>("[data-annotation-surface]");
        if (!surface || !content.current?.contains(surface) || !surface.contains(range.endContainer)) { setSelection(null); return; }
        const before = range.cloneRange();
        before.selectNodeContents(surface);
        before.setEnd(range.startContainer, range.startOffset);
        const start = before.toString().length;
        const quote = range.toString();
        if (!quote.trim() || quote.length > 4000) { setSelection(null); return; }
        const end = start + quote.length;
        const text = surface.textContent ?? "";
        const rect = range.getBoundingClientRect();
        setSelection({ start, end, quote, surface: surface.dataset.annotationSurface as Annotation["surface"], prefix: text.slice(Math.max(0, start - 40), start), suffix: text.slice(end, end + 40), x: Math.max(8, Math.min(rect.left, window.innerWidth - 240)), y: Math.max(84, Math.min(rect.bottom + 8, window.innerHeight - 58)) });
      });
    }
    document.addEventListener("selectionchange", capture);
    window.addEventListener("scroll", capture, true);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("selectionchange", capture); window.removeEventListener("scroll", capture, true); };
  }, [enabled, chapter]);

  useEffect(() => {
    const root = content.current;
    if (!root) return;
    let frame = 0;
    function paint() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = root!.getBoundingClientRect();
        const rectangles: Painted[] = [];
        for (const annotation of annotations) {
          const range = locate(annotation);
          if (!range) continue;
          for (const rect of Array.from(range.getClientRects())) if (rect.width && rect.height) rectangles.push({ id: annotation.id, left: rect.left - bounds.left, top: rect.top - bounds.top, width: rect.width, height: rect.height });
        }
        setPainted(rectangles);
      });
    }
    const resize = new ResizeObserver(paint);
    resize.observe(root);
    const mutations = new MutationObserver(paint);
    root.querySelectorAll("[data-annotation-surface]").forEach(surface => mutations.observe(surface, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["open"] }));
    paint();
    void document.fonts.ready.then(paint);
    window.addEventListener("resize", paint);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutations.disconnect(); window.removeEventListener("resize", paint); };
  }, [annotations, locate, sidebar]);

  useEffect(() => {
    if (!pendingJump || !enabled) return;
    const annotation = annotations.find(item => item.id === pendingJump);
    if (!annotation || annotation.chapter !== chapter) return;
    const frame = requestAnimationFrame(() => {
      const range = locate(annotation);
      if (range) {
        for (let parent = range.startContainer.parentElement; parent && parent !== content.current; parent = parent.parentElement) {
          if (parent instanceof HTMLDetailsElement) parent.open = true;
        }
        const rect = range.getBoundingClientRect();
        window.scrollBy({ top: rect.top - 180, behavior: "smooth" });
        setMessage("Passage highlighted in the reader.");
      } else setMessage("This passage has changed since you saved it. Your quote and note are still kept here.");
      setPendingJump("");
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingJump, enabled, chapter, annotations, locate]);

  function add(withNote: boolean) {
    if (!selection) return;
    const existing = annotations.find(item => item.chapter === chapter && item.surface === selection.surface && item.start === selection.start && item.quote === selection.quote);
    const now = new Date().toISOString();
    const { x, y, ...anchor } = selection;
    const annotation = existing ?? { ...anchor, id: crypto.randomUUID(), chapter, note: "", createdAt: now, updatedAt: now };
    if (!existing && !changeAnnotations(paper, latest => [...latest, annotation])) return;
    setActiveId(annotation.id);
    setSidebar(true);
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setMessage(withNote ? "Highlight saved. Add your note beside it." : "Highlight saved on this device.");
    if (withNote) setTimeout(() => document.getElementById(`annotation-note-${annotation.id}`)?.focus(), 0);
  }

  function jump(annotation: Annotation) {
    setSidebar(true);
    setActiveId(annotation.id);
    setPendingJump(annotation.id);
    onNavigate(annotation.chapter);
  }

  return <div className="annotation-workspace">
    <div className="annotation-help"><span>{enabled ? "Select a passage to highlight it or leave a note." : "Highlights and margin notes are available in the simplified paper."}</span><button aria-expanded={sidebar} onClick={() => setSidebar(!sidebar)}><MessageSquare size={15}/> Notes ({annotations.length})</button></div>
    <div className={`annotation-layout ${sidebar ? "with-notes" : ""}`}>
      <div className="annotation-content" ref={content} onClick={event => {
        if (window.getSelection()?.toString()) return;
        const found = annotations.find(annotation => {
          const range = locate(annotation);
          return range && Array.from(range.getClientRects()).some(rect => event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
        });
        if (found) { event.preventDefault(); setActiveId(found.id); setSidebar(true); setTimeout(() => document.getElementById(`annotation-card-${found.id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 0); }
      }}>
        {children}
        <div className="annotation-paint" aria-hidden="true">{painted.map((rect, index) => <span data-highlight-id={rect.id} key={`${rect.id}-${index}`} className={activeId === rect.id ? "active" : ""} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}/>)}</div>
      </div>
      <aside hidden={!sidebar} className="annotation-sidebar" aria-label="Margin notes"><div className="annotation-sidebar-title"><h2>Your margin notes</h2><button aria-label="Close margin notes" onClick={() => setSidebar(false)}><X size={16}/></button></div><p className="annotation-privacy">Saved in this browser · Included in your backup</p>{!annotations.length && <div className="annotation-empty"><Highlighter size={22}/><h3>Think in the margins.</h3><p>Select text in the simplified paper, then choose Highlight or Add note. Your thoughts stay linked to the passage.</p></div>}
        {annotations.map(annotation => <AnnotationCard key={annotation.id} annotation={annotation} active={activeId === annotation.id} onJump={() => jump(annotation)} save={note => changeAnnotations(paper, latest => latest.map(item => item.id === annotation.id ? { ...item, note, updatedAt: new Date().toISOString() } : item))} remove={() => changeAnnotations(paper, latest => latest.filter(item => item.id !== annotation.id))}/>)}
      </aside>
    </div>
    {selection && <div className="selection-toolbar" role="toolbar" aria-label="Annotate selected text" style={{ left: selection.x, top: selection.y }} onPointerDown={event => event.preventDefault()}><button disabled={!ready} onClick={() => add(false)}><Highlighter size={15}/> Highlight</button><button disabled={!ready} onClick={() => add(true)}><MessageSquare size={15}/> Add note</button></div>}
    {message && <p className="annotation-message" role="status">{message}</p>}
  </div>;
}

function AnnotationCard({ annotation, active, onJump, save, remove }: { annotation: Annotation; active: boolean; onJump: () => void; save: (note: string) => boolean; remove: () => boolean }) {
  const [draft, setDraft] = useState(annotation.note);
  const [unsaved, setUnsaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { if (!unsaved) setDraft(annotation.note); }, [annotation.note, unsaved]);
  return <article id={`annotation-card-${annotation.id}`} className={`annotation-card ${active ? "active" : ""}`}>
    <button className="annotation-jump" onClick={onJump}>{annotation.surface === "overview" ? "Paper overview" : learningChapterNames[annotation.chapter] ?? `Chapter ${annotation.chapter + 1}`} · Jump to passage</button>
    <blockquote>{annotation.quote}</blockquote>
    <label htmlFor={`annotation-note-${annotation.id}`}>Your note</label><textarea id={`annotation-note-${annotation.id}`} rows={4} maxLength={20000} value={draft} placeholder="What stands out? What would you question?" onChange={event => { setDraft(event.target.value); setUnsaved(!save(event.target.value)); }} onBlur={() => { if (unsaved) setUnsaved(!save(draft)); }}/>
    {unsaved && <p role="alert">Not saved. Keep this note open and copy your text somewhere safe.</p>}
    <div className="annotation-card-actions">{deleting ? <><span>Remove highlight and note?</span><button onClick={remove}>Remove</button><button onClick={() => setDeleting(false)}>Keep</button></> : <button onClick={() => setDeleting(true)}>Delete annotation</button>}</div>
  </article>;
}
