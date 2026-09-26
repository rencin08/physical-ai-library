"use client";
import { useState } from 'react';
import { ArrowDown, ArrowRight, ExternalLink } from 'lucide-react';
import { libraryGuides } from '@/lib/learning/library-guides';
import { OriginalPaperFigures } from './OriginalPaperFigures';
import { chapterFigures, paperFigures } from '@/lib/learning/paper-figures';
const labels=['The idea','How it works','Learning & example','What the evidence says','What to take away'];
export function LibraryGuideChapter({slug,chapter,onContinue}:{slug:string;chapter:number;onContinue:()=>void}){
 const entry=libraryGuides[slug], content=entry.guide.chapters[chapter];
 const [selected,setSelected]=useState(0);
 const visual=content.visual;
 const figures=chapterFigures(slug,chapter);
 const fallback=paperFigures[slug]?.fallbackReasons[chapter];
 return <section className={`library-chapter library-chapter-${chapter}`} aria-labelledby={`guide-${chapter}`}>
  <header><div className="book-kicker">{entry.guide.kind} · {labels[chapter]}</div><h2 id={`guide-${chapter}`}>{content.title}</h2><p className="library-chapter-intro">{content.intro}</p></header>
  <div className="library-chapter-layout">
   <div className="library-chapter-visuals">
   <OriginalPaperFigures slug={slug} chapter={chapter}/>
   {!figures.length && <p className="figure-fallback-reason">{fallback || "Original figures are awaiting source review for this chapter."}</p>}
   <details className="supplementary-teaching" open={!figures.length}><summary>Explore the supporting teaching diagram</summary>
   <figure className="library-teaching-visual">
    <figcaption>{visual.title}</figcaption>
    <ol className="library-visual-nodes">{visual.nodes.map((node,i)=><li key={node.label}><button aria-pressed={i===selected} onClick={()=>setSelected(i)}><span className="library-node-number">{String(i+1).padStart(2,'0')}</span><strong>{node.label}</strong>{chapter===3&&<span className="library-evidence-mark">Evidence</span>}</button>{chapter===1&&i<visual.nodes.length-1&&<ArrowDown size={20} aria-hidden="true"/>}</li>)}</ol>
    <div className="library-visual-detail" aria-live="polite"><h3>{visual.nodes[selected].label}</h3><p>{visual.nodes[selected].detail}</p></div>
    <p className="library-visual-reading">{visual.reading}</p><div className="library-visual-conclusion">{visual.conclusion}</div>
    <small>Library teaching diagram · Based on the linked paper, not an experimental simulation.</small>
   </figure></details></div>
   <div className="library-chapter-explanation" data-annotation-surface="visual"><div className="book-kicker">Understand the idea</div>{content.paragraphs.map((text,i)=><p key={i}>{text}</p>)}<div className="library-key-point"><h3>Keep this in mind</h3><p>{content.takeaway}</p></div></div>
  </div>
  {chapter===0&&<details className="library-vocabulary"><summary>The vocabulary you need</summary><dl>{entry.guide.terms.map(term=><div key={term.term}><dt>{term.term}</dt><dd>{term.meaning}</dd></div>)}</dl></details>}
  <footer className="library-chapter-footer"><div className="library-page-sources"><span>Read the source</span>{[...new Set(content.evidence.map(e=>e.page))].map(page=><a key={page} href={`${entry.source}#page=${page}`} target="_blank" rel="noreferrer">PDF page {page} <ExternalLink size={13}/></a>)}</div><details className="library-understanding"><summary>{content.question}</summary><p>{content.answer}</p></details><button className="text-link" onClick={onContinue}>{chapter===4?'Back to the overview':`Next: ${labels[chapter+1]}`} <ArrowRight size={16}/></button></footer>
 </section>;
}
