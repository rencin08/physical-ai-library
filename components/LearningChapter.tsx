"use client";

import { libraryGuides } from "@/lib/learning/library-guides";
import { hasVisualOverview } from "./VisualPaperOverview";
import { FastSignalExample } from "./FastSignalExample";
import { useState } from "react";
import { ArrowDown, ExternalLink } from "lucide-react";
import { learningGuides, type LearningGuide } from "@/lib/learning/guides";

export const learningChapterNames = ["Foundations", "Method", "Training & example", "Results", "What to take away"];

function Paragraphs({items}: {items: string[]}) {
  return <>{items.map(text => <p key={text}>{text}</p>)}</>;
}

function Source({guide, chapter}: {guide: LearningGuide; chapter: number}) {
  return <div className="chapter-source" aria-label="Chapter sources"><span>Read alongside: {guide.sections[chapter]}</span><a href={guide.source} target="_blank" rel="noreferrer">Paper version used <ExternalLink size={12}/></a><a href={guide.project} target="_blank" rel="noreferrer">Authors’ project <ExternalLink size={12}/></a></div>;
}

function MethodDiagram({steps, overview = false}: {steps: LearningGuide["steps"]; overview?: boolean}) {
  const [selected, setSelected] = useState(0);
  return <figure className="method-diagram"><figcaption>{overview ? "Overall architecture · Select a stage" : "Follow the computation · Select a stage"}</figcaption><ol>{steps.map(([label], index) => <li key={label}><button aria-pressed={selected === index} onClick={() => setSelected(index)}><span>0{index + 1}</span>{label}</button>{index < steps.length - 1 && <ArrowDown aria-hidden="true" size={17}/>}</li>)}</ol><div className="method-explanation" aria-live="polite"><strong>{steps[selected][0]}</strong><p>{steps[selected][1]}</p></div><small>Conceptual diagram; not a measured rollout.</small></figure>;
}

function RouteExample() {
  const [route, setRoute] = useState<"left" | "mean" | "right">("mean");
  const paths = {left:"M180 195 C30 165 30 60 180 28", mean:"M180 195 L180 28", right:"M180 195 C330 165 330 60 180 28"};
  return <figure className="route-example"><figcaption>Two valid routes and their invalid average</figcaption><div className="diagram-options">{(["left", "mean", "right"] as const).map(value => <button key={value} aria-pressed={route === value} onClick={() => setRoute(value)}>{value === "mean" ? "Average" : `${value[0].toUpperCase()}${value.slice(1)} route`}</button>)}</div><svg viewBox="0 0 360 225" role="img" aria-label={route === "mean" ? "The average route passes through the obstacle" : `The ${route} route avoids the obstacle`}><rect x="147" y="80" width="66" height="66" rx="4" fill="#d6c8b5"/><text x="180" y="117" textAnchor="middle" fontSize="12" fill="#3a342c">Obstacle</text><path d={paths.left} fill="none" stroke="#b7aea0" strokeDasharray="4 4"/><path d={paths.right} fill="none" stroke="#b7aea0" strokeDasharray="4 4"/><path d={paths[route]} fill="none" stroke={route === "mean" ? "#9b4336" : "#426456"} strokeWidth="4"/><circle cx="180" cy="195" r="6" fill="#24221f"/><circle cx="180" cy="28" r="6" fill="#426456"/><text x="199" y="199" fontSize="12">Start</text><text x="199" y="32" fontSize="12">Goal</text></svg><p aria-live="polite">{route === "mean" ? "Averaging the positions collapses two safe alternatives into a path through the obstacle." : "A distribution can retain this alternative as a distinct mode. Sampling a route is different from averaging routes."}</p><small>Illustrative geometry, not experimental data or a collision guarantee.</small></figure>;
}

function TokenExample() {
  const [value, setValue] = useState(0.3);
  const bin = Math.min(7, Math.floor((value + 1) / 0.25));
  const decoded = -1 + (bin + 0.5) * 0.25;
  return <figure className="token-example"><figcaption>Try encoding one action dimension</figcaption><label>Desired displacement: {value.toFixed(2)}<input type="range" min="-1" max="1" step="0.01" value={value} onChange={event => setValue(Number(event.target.value))}/></label><div className="token-bins" aria-hidden="true">{Array.from({length:8},(_,i)=><span className={i === bin ? "active" : ""} key={i}>{i}</span>)}</div><p aria-live="polite">Token <b>{bin}</b> decodes to <b>{decoded.toFixed(3)}</b>. Absolute difference: <b>{Math.abs(value-decoded).toFixed(3)}</b>.</p><small>Eight illustrative bins over normalized units; not OpenVLA’s actual encoding configuration.</small></figure>;
}

export function LearningChapter({slug, chapter, side}: {slug: string; chapter: number; side: "left" | "right"}) {
  const guide = learningGuides[slug];
  if (!guide) return null;
  const left = side === "left";
  const kind = libraryGuides[slug]?.guide.kind;
  const isCollection = kind === "dataset" || kind === "survey" || kind === "benchmark";
  return <article className="learning-page">
    <div className="book-kicker">{learningChapterNames[chapter]} · {left ? "Read" : "Understand"}</div>
    {chapter === 0 && (left ? <><h2>{guide.title}</h2>{!hasVisualOverview(slug) && <MethodDiagram key={slug} steps={guide.steps} overview/>}<h3>What is this paper about?</h3><Paragraphs items={guide.foundations}/><p className="learning-note">A guided reading of the linked paper version. Worked examples and conceptual diagrams are teaching aids, not additional experimental results.</p></> : <><h2>The vocabulary you need</h2><dl className="learning-terms">{guide.terms.map(([term, explanation]) => <div key={term}><dt>{term}</dt><dd>{explanation}</dd></div>)}</dl><div className="guide-thesis"><h3>The thesis</h3><p>{guide.problem[0]}</p><h3>Why this matters</h3><p>{guide.problem[1] ?? guide.takeaway}</p></div></>)}
    {chapter === 1 && (left ? <><h2>The problem and the design choice</h2><Paragraphs items={guide.problem}/>{slug.startsWith("diffusion-policy") && <figure className="learning-source-figure"><img src="https://raw.githubusercontent.com/real-stanford/diffusion_policy/main/media/multimodal_sim.png" alt="Authors’ visualization of multiple possible action modes"/><figcaption>Authors’ visualization: look for separate action alternatives, rather than a single average. <a href={guide.project} target="_blank" rel="noreferrer">Figure context</a></figcaption></figure>}</> : <><h2>Inside the method</h2><MethodDiagram key={slug} steps={guide.steps}/></>)}
    {chapter === 2 && (left ? <><h2>{isCollection ? "How the work is organized and used" : "What the model learns from"}</h2><Paragraphs items={guide.training}/>{!isCollection && <div className="learning-distinction"><h3>Training and deployment</h3><p>Training changes model parameters using examples. Deployment uses those parameters to compute outputs from new inputs. Extra computation during deployment is not automatically extra learning.</p></div>}</> : <><h2>A worked example</h2><Paragraphs items={guide.example}/>{slug.startsWith("diffusion-policy") && <RouteExample/>}{slug.startsWith("openvla") && <TokenExample/>}{slug === "fast-action-tokenization" && <FastSignalExample/>}</>)}
    {chapter === 3 && (left ? <><h2>What the experiments establish</h2><Paragraphs items={guide.evidence}/></> : <><h2>How to interpret the result</h2><Paragraphs items={guide.interpretation}/><div className="learning-distinction"><h3>Keep the comparison intact</h3><p>A reported result belongs to its tasks, data, hardware, and evaluation protocol. Follow the source link before carrying a number into a different setting.</p></div></>)}
    {chapter === 4 && (left ? <><h2>Where the claim stops</h2><Paragraphs items={guide.limitations}/></> : <><h2>The argument in one place</h2><p>{guide.takeaway}</p><div className="learning-check"><h3>Test your understanding</h3><p>{guide.question}</p><details><summary>Read the explanation</summary><p>{guide.answer}</p></details></div></>)}
    <Source guide={guide} chapter={chapter}/>
  </article>;
}
