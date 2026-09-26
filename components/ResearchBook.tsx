"use client";

import { ArrowLeft, ArrowRight, BookOpen, Code2, ExternalLink, FileText, GitBranch, Maximize2, Star } from "lucide-react";
import { useEffect, useRef } from "react";
import { useReading } from "./ReadingProvider";
import { VisualPaperChapter, hasVisualChapter } from "./VisualPaperChapter";
import { VisualPaperOverview, hasVisualOverview } from "./VisualPaperOverview";
import { AnnotatedReader } from "./AnnotatedReader";
import { ReadingJournal } from "./ReadingJournal";
import { paperSource } from "@/lib/paper-source";
import type { ReaderMode } from "@/lib/reading-state";
import type { Paper } from "@/lib/data";

import { LearningChapter, learningChapterNames as chapterNames } from "@/components/LearningChapter";
import { LibraryGuideChapter } from "./LibraryGuideChapter";
import { libraryGuides } from "@/lib/learning/library-guides";
import { learningGuides } from "@/lib/learning/guides";

export function ResearchBook({ paper, overviewOnly = false, hasSummary = false }: { paper: Paper; overviewOnly?: boolean; hasSummary?: boolean }) {
  const { state, ready, update } = useReading();
  const record = state.records[paper.slug];
  const chapter = Math.min(record?.chapter ?? 0, chapterNames.length - 1);
  const mode = overviewOnly && record?.mode === "code" ? "guide" : record?.mode ?? "guide";
  const opened = useRef("");
  useEffect(() => {
    if (!ready || opened.current === paper.slug) return;
    opened.current = paper.slug;
    update(paper, { lastOpenedAt: new Date().toISOString(), status: record?.status === "completed" ? "completed" : "reading" });
  }, [ready, paper, record?.status, update]);
  function setMode(next: ReaderMode) { update(paper, { mode: next }); }
  const visualOpening = chapter === 0 && hasVisualOverview(paper.slug);
  const visualChapter = hasVisualChapter(paper.slug, chapter);
  const libraryGuide = libraryGuides[paper.slug];
  const visualReading = Boolean(libraryGuide) || visualOpening || visualChapter;
  const readerRef = useRef<HTMLDivElement>(null);
  function turnChapter(next: number) {
    update(paper, { chapter: next });
    readerRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }
  const { pdfUrl, sourceUrl, arxivId } = paperSource(paper, learningGuides[paper.slug]?.source);

  return <><section className="research-reader" aria-busy={!ready}>
    <div className="reader-bar">
      <div className="reader-modes"><button className={mode === "guide" ? "active" : ""} onClick={() => setMode("guide")}><BookOpen/> {overviewOnly ? "Paper overview" : "Simplified paper"}</button><button className={mode === "paper" ? "active" : ""} onClick={() => setMode("paper")}><FileText/> Original paper</button>{!overviewOnly && <button className={mode === "code" ? "active" : ""} onClick={() => setMode("code")}><Code2/> Code & experiments</button>}</div>
      <span>{mode === "guide" ? (overviewOnly ? "Paper overview" : `Chapter ${chapter + 1} of ${chapterNames.length}`) : mode === "paper" ? (arxivId ? `arXiv:${arxivId}` : "Authors’ original report") : "Author repository"}</span>
      {(pdfUrl || sourceUrl) && <a href={pdfUrl || sourceUrl} target="_blank" rel="noreferrer">{pdfUrl ? "Open full screen" : "Open source page"} <Maximize2/></a>}
    </div>

    <AnnotatedReader paper={paper} chapter={overviewOnly ? 0 : chapter} enabled={mode === "guide"} onNavigate={next => update(paper, { chapter: next, mode: "guide" })}>
    {mode === "paper" ? pdfUrl ? <div className="paper-embed"><div className="paper-embed-loading">Loading the original paper…</div><iframe title={`Original paper: ${paper.title}`} src={`${pdfUrl}#view=FitH`} /></div> : <div className="imported-overview"><h2>{sourceUrl ? "Read on the authors’ website" : "Original paper unavailable"}</h2><p>A direct PDF is not available for this entry.</p>{sourceUrl && <a className="text-link" href={sourceUrl} target="_blank" rel="noreferrer">Open original source <ExternalLink size={16}/></a>}</div> : mode === "code" ? <CodeAndExperiments paper={paper}/> : overviewOnly ? <div className="imported-overview" data-annotation-surface="overview"><div className="book-kicker">{hasSummary ? "In plain English" : "Learning guide pending"}</div><h2>{hasSummary ? "Start here" : "About this paper"}</h2>{!hasSummary && <p className="overview-status">A structured learning guide is not yet available for this paper. This is the catalog overview, not a full explanation of the method.</p>}<p>{paper.summary}</p>{paper.why && <><h3>Why it matters</h3><p>{paper.why}</p></>}<button onClick={() => setMode("paper")}>Read the original paper <ArrowRight size={16}/></button></div> : <>
      <div className="book-tabs" ref={readerRef}>{chapterNames.map((name,index)=><button className={chapter===index?"active":""} aria-current={chapter===index ? "step" : undefined} onClick={()=>turnChapter(index)} key={name}><span>0{index+1}</span>{index === 0 && (libraryGuide || hasVisualOverview(paper.slug)) ? "Visual overview" : name}</button>)}</div>
      {libraryGuide && <LibraryGuideChapter key={`library-${paper.slug}-${chapter}`} slug={paper.slug} chapter={chapter} onContinue={()=>turnChapter(chapter===4?0:chapter+1)}/>}
      {!libraryGuide && visualOpening && <VisualPaperOverview slug={paper.slug} onContinue={()=>turnChapter(1)}/>}
      {!libraryGuide && visualChapter && <VisualPaperChapter key={`visual-${paper.slug}-${chapter}`} chapter={chapter} onContinue={() => turnChapter(chapter === 4 ? 0 : chapter + 1)}/>}
      <details className={visualReading ? "visual-reading-details" : "standard-reading-pages"} open={visualReading ? (record?.annotations?.some(annotation => annotation.chapter === chapter && ["left", "right"].includes(annotation.surface)) || undefined) : true} key={`${paper.slug}-${chapter}`}>
      <summary>{libraryGuide ? "Read chapter text & saved passages" : visualOpening ? "Vocabulary & deeper explanation" : visualChapter ? "Read the detailed chapter & saved passages" : "Chapter text"}</summary>
      <div className="open-book substantive-book" key={chapter}>
        <div className="book-pages">
          <div className="book-page page-left"><div data-annotation-surface="left">{<LearningChapter slug={paper.slug} chapter={chapter} side="left"/>}</div><span className="page-number">{chapter*2+1}</span></div>
          <div className="book-gutter" />
          <div className="book-page page-right"><div data-annotation-surface="right">{<LearningChapter slug={paper.slug} chapter={chapter} side="right"/>}</div><span className="page-number">{chapter*2+2}</span></div>
        </div>
      </div>
      </details>
      {chapter === 0 && record?.annotations?.some(annotation => annotation.surface === "overview") && <details className="legacy-overview-notes"><summary>Notes from the earlier overview</summary><div data-annotation-surface="overview"><p>{paper.summary}</p>{paper.why && <><h3>Why it matters</h3><p>{paper.why}</p></>}</div></details>}
      <div className="book-navigation"><button disabled={chapter===0} onClick={()=>turnChapter(chapter-1)}><ArrowLeft/> Previous chapter</button><div>{chapterNames.map((_,index)=><i className={index===chapter?"active":""} key={index}/>)}</div><button disabled={chapter===chapterNames.length-1} onClick={()=>turnChapter(chapter+1)}>Next chapter <ArrowRight/></button></div>
    </>}
    </AnnotatedReader>
  </section><ReadingJournal paper={paper}/></>;
}

function CodeAndExperiments({paper}:{paper:Paper}) {
  const isDiffusion=paper.slug==="diffusion-policy-visuomotor-policy-learning";
  const github=isDiffusion?"https://github.com/real-stanford/diffusion_policy":`https://github.com/search?q=${encodeURIComponent(paper.title)}&type=repositories`;
  if (!isDiffusion) return <div className="imported-overview"><div className="book-kicker">Implementation resources</div><h2>Continue with the authors’ materials</h2><p>Repository layouts and setup commands differ across papers. Follow the project’s implementation and reproduction instructions for this model.</p><a className="text-link" href={learningGuides[paper.slug]?.project ?? `https://arxiv.org/abs/${paper.arxivId}`} target="_blank" rel="noreferrer">Authors’ project and resources <ExternalLink size={15}/></a></div>;
  return <div className="code-lab"><div className="code-lab-hero"><div><div className="book-kicker">From the authors’ repository</div><h2>{isDiffusion?"Run the real system.":"Trace the implementation."}</h2><p>{isDiffusion?"The release includes simulation and real-robot workflows, datasets, evaluation logs, checkpoints, and separate Colab notebooks for state- and vision-based policies.":"Inspect public implementations, experiment configurations, and community reproductions associated with this work."}</p><div className="repo-buttons"><a href={github} target="_blank" rel="noreferrer"><GitBranch/> Open repository <ExternalLink/></a>{isDiffusion&&<a href="https://diffusion-policy.cs.columbia.edu/" target="_blank" rel="noreferrer">Project site <ExternalLink/></a>}</div></div>{isDiffusion&&<figure><img src="https://raw.githubusercontent.com/real-stanford/diffusion_policy/main/media/teaser.png" alt="Diffusion Policy tasks and action denoising overview from the authors' repository"/><figcaption>Author-provided teaser: simulated and real manipulation tasks.</figcaption></figure>}</div><div className="code-lab-grid"><section><div className="code-section-title"><span>Repository map</span><a href={github} target="_blank" rel="noreferrer"><Star/> GitHub</a></div><div className="file-tree"><div>▾ <b>diffusion_policy/</b></div><div>　├─ <b>policy/</b> <span>inference interfaces</span></div><div>　├─ <b>dataset/</b> <span>demonstration loaders</span></div><div>　├─ <b>workspace/</b> <span>training lifecycle</span></div><div>　├─ <b>env_runner/</b> <span>evaluation</span></div><div>　└─ <b>real_world/</b> <span>UR5 + cameras</span></div><div>　<b>train.py</b> <span>training entrypoint</span></div><div>　<b>eval_real_robot.py</b> <span>deployment</span></div></div></section><section><div className="code-section-title"><span>Minimal training path</span><span>Shell</span></div><pre><code><span># create the authors&apos; environment</span>{"\n"}mamba env create -f conda_environment.yaml{"\n"}conda activate robodiff{"\n\n"}<span># train an image-conditioned policy</span>{"\n"}python train.py \{"\n"}　--config-name=train_diffusion_unet_real_image_workspace \{"\n"}　task.dataset_path=data/demo_pusht_real</code></pre></section><section><div className="code-section-title"><span>What maps to what</span><span>Paper ↔ code</span></div><div className="code-mapping"><div><b>Observation horizon</b><code>n_obs_steps</code></div><div><b>Action horizon</b><code>n_action_steps</code></div><div><b>Prediction horizon</b><code>horizon</code></div><div><b>Policy output</b><code>action: (B, Ta, Da)</code></div></div></section><section><div className="code-section-title"><span>Reproducibility inventory</span><span>Official release</span></div><ul className="repro-list"><li><i/>Training and evaluation code</li><li><i/>Configurations for reported experiments</li><li><i/>Aggregated logs across three seeds</li><li><i/>Checkpoints and real Push-T dataset</li><li><i/>State and vision Colab notebooks</li></ul></section></div></div>;
}
