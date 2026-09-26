"use client";

import { reviewedDroidGuide, DroidFigurePanels, DroidChapterExplanation } from "./ReviewedDroidNotes";
import { useId, useState } from "react";
import { DroidBatchVisual, DroidActionVisual } from "./DroidTrainingVisual";
import { ArrowRight, Maximize2 } from "lucide-react";

type View = { label: string; visual?: "batch" | "actions"; image?: string; figure: string; anchor: string; alt: string; title: string; text: string; prompt: string };
type Chapter = { name: string; title: string; intro: string; takeaway: string; views: View[] };
const chapters: Record<number, Chapter> = {
  1: {
    name: "Method", title: "Make the collection process repeatable.",
    intro: "Follow the collection protocol, then inspect the range of camera viewpoints.",
    takeaway: "The method determines both what gets demonstrated and how it is observed.",
    views: [
      { label: "Collection protocol", image: "protocol.png", figure: "9", anchor: "A1.F9", alt: "Four screens from DROID’s task selection and demonstration collection interface.", title: "A demonstration starts with a task", text: "The interface samples feasible tasks and prompts scene changes.", prompt: "Follow the four screens: list tasks, receive an instruction, record, then change the scene. Which step counters repeating easy tasks?" },
      { label: "Camera viewpoints", image: "viewpoints.png", figure: "3", anchor: "S4.F3", alt: "Spatial distribution of third-person camera viewpoints in DROID.", title: "The same action can look different", text: "The plot shows the distribution of external camera viewpoints.", prompt: "Look at the dense and sparse regions. Imagine watching a grasp from opposite sides: which visual cues would change?" },
    ],
  },
  2: {
    name: "Training & example", title: "From demonstrations to a robot that acts.",
    intro: "Build a training batch, step through action prediction, then watch the resulting behavior.",
    takeaway: "Training examples and evaluation rollouts play different roles.",
    views: [
      { label: "Build a batch", visual: "batch", figure: "Appendix F-B", anchor: "A6.SS2", alt: "", title: "Change the data mixture", text: "Compare task-only training with the two equal-mixture co-training settings.", prompt: "Switch the data source. What stays fixed? This separates a data change from an architecture change." },
      { label: "Predict & act", visual: "actions", figure: "Appendix F-A", anchor: "A6.SS1", alt: "", title: "A prediction is longer than an execution", text: "The policy predicts 16 actions, executes 8, then observes again.", prompt: "Advance the sequence. Why might it help to look again before committing to every predicted action?" },
      { label: "Worked example", image: "rollout.png", figure: "7", anchor: "S5.F7", alt: "Sequential frames comparing policy rollouts on the Cook Lentils task.", title: "Follow the sequence, not one frame", text: "These are policy rollouts on Cook Lentils, not training demonstrations.", prompt: "Track the gripper and objects across frames. Where does the next action depend on the previous one succeeding?" },
    ],
  },
  3: {
    name: "Results", title: "Read the comparison behind the claim.",
    intro: "Start with the main result, then inspect the experiment about scene diversity.",
    takeaway: "Keep the comparison, test conditions, and uncertainty visible.",
    views: [
      { label: "Co-training", image: "results.png", figure: "6", anchor: "S5.F6", alt: "Success-rate comparisons for no co-training, Open-X co-training and DROID co-training in distribution and out of distribution.", title: "Compare within each test condition", text: "The plot separates in-distribution and out-of-distribution success, with standard-error bars.", prompt: "Identify the legend first. Compare methods within a group before comparing the two groups." },
      { label: "Scene diversity", image: "diversity.png", figure: "8", anchor: "S5.F8", alt: "DROID scene-diversity ablation comparing co-training subsets with diverse scenes and only 20 scenes.", title: "Which part of the data helps?", text: "This ablation compares diverse-scene and restricted-scene subsets.", prompt: "An ablation changes an ingredient. What question can this comparison answer that the main result cannot?" },
    ],
  },
  4: {
    name: "What to take away", title: "Notice what the figures leave open.",
    intro: "Inspect uneven task coverage and the quality of camera geometry.",
    takeaway: "Ask whether the experience and evaluation match your intended use.",
    views: [
      { label: "Coverage", image: "tasks.png", figure: "1", anchor: "S3.F1", alt: "DROID distributions of task verbs and manipulated objects, showing uneven frequencies.", title: "Diverse does not mean evenly covered", text: "Task and object frequencies are uneven.", prompt: "Find the large and small categories. Would your intended task be well represented?" },
      { label: "Calibration quality", image: "calibration.png", figure: "14", anchor: "A7.F14", alt: "Per-lab distributions and cumulative curves of matched points after camera-to-camera calibration.", title: "Geometry needs its own quality check", text: "Camera correspondence quality varies across the collection.", prompt: "Compare the distributions. A large collection can still contain unreliable camera geometry; what would you check before using it for 3D learning?" },
    ],
  },
};

export function hasVisualChapter(slug: string, chapter: number) {
  return slug === "droid-robot-manipulation-dataset" && Boolean(chapters[chapter]);
}

export function VisualPaperChapter({ chapter, onContinue }: { chapter: number; onContinue: () => void }) {
  const content = chapters[chapter];
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState(false);
  const panelId = useId();
  const view = content.views[selected];
  const src = view.image ? `/paper-figures/droid/${view.image}` : undefined;
  const last = chapter === 4;
  const reviewedChapter = reviewedDroidGuide.chapters[chapter];
  const asset = view.visual ? `teaching:${view.visual}` : view.image!;
  const reviewedView = reviewedChapter.views.find(item => item.asset === asset)!;
  return <section className="visual-paper-intro visual-chapter" aria-label={`${content.name} in pictures`}>
    <header><span className="eyebrow">DROID · {content.name} in pictures</span><h2>{reviewedChapter.title}</h2><p data-annotation-surface="visual">{content.intro}</p></header>
    <nav className="figure-sequence" aria-label={`Explore ${content.name.toLowerCase()} figures`}>
      {content.views.map((item, index) => <button key={item.label} aria-pressed={selected === index} aria-controls={panelId} onClick={() => { setSelected(index); setFailed(false); }}><span>0{index + 1}</span>{item.label}{index < content.views.length - 1 && <ArrowRight aria-hidden="true" size={16}/>}</button>)}
    </nav>
    <div className="visual-figure-layout" id={panelId}>
      <figure>
        {view.visual === "batch" ? <DroidBatchVisual/> : view.visual === "actions" ? <DroidActionVisual/> : <a className="original-figure-image" href={src} target="_blank" rel="noreferrer" aria-label="Enlarge original figure">
          {!failed ? <img key={src} src={src} alt={view.alt} onError={() => setFailed(true)}/> : <span>Figure unavailable. Open the linked paper below.</span>}
          <span className="figure-enlarge"><Maximize2 aria-hidden="true" size={14}/> Enlarge</span>
        </a>}
        <figcaption><a href={`https://arxiv.org/html/2403.12945v2#${view.anchor}`} target="_blank" rel="noreferrer">Khazatsky et al. · {view.visual ? view.figure : `Figure ${view.figure}`} · DROID v2 ↗</a><span>{view.visual ? "Library teaching diagram · Based on the linked paper" : "Original figure · CC BY 4.0 · Explanations are ours"}</span></figcaption>
        <DroidFigurePanels chapter={chapter} asset={asset}/>
      </figure>
      <aside className="figure-reading-key" aria-label="How to read the figure" aria-live="polite">
        <span className="eyebrow">Look for this</span><h3>{reviewedView.title}</h3><p>{reviewedView.explanation}</p>
        <div className="figure-reading-prompt"><span className="eyebrow">What this tells us</span><p>{reviewedView.conclusion}</p></div>
        {chapter === 2 && <a className="figure-section-source" href="https://arxiv.org/html/2403.12945v2#A6.SS2" target="_blank" rel="noreferrer">Training batch details · Appendix F-B ↗</a>}
      </aside>
    </div>
    <DroidChapterExplanation chapter={chapter}/>
    <footer><p><b>Keep in mind:</b> {reviewedChapter.takeaway}</p><button onClick={onContinue}>{last ? "Return to the overview" : chapter === 1 ? "Explore training" : chapter === 2 ? "Read the results" : "Consider the limits"}<ArrowRight aria-hidden="true" size={16}/></button></footer>
  </section>;
}
