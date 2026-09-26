"use client";
import { reviewedDroidGuide, DroidFigurePanels, DroidChapterExplanation } from "./ReviewedDroidNotes";
import { useState } from 'react';
import { ArrowRight, Maximize2 } from 'lucide-react';

const droidFigures = [
 {label:'Collect',src:'/paper-figures/droid/setup.png',figure:'Figure 0',anchor:'S3.F0',alt:'Original DROID figure identifying the cameras, Franka robot arm, gripper, teleoperation headset, control laptop, and portable desk.',title:'One shared collection setup',text:'A person guides the arm while cameras and robot sensors record what it sees and does. The same hardware is used across 13 institutions.'},
 {label:'Diversify',src:'/paper-figures/droid/scenes.png',figure:'Figure 10',anchor:'A2.F10',alt:'Original DROID montage of robot collection scenes in kitchens, offices, and other real environments.',title:'Move it beyond one lab',text:'Look at the backgrounds, surfaces, and objects. DROID collects 76,000 demonstrations across 564 scenes, rather than repeating one tidy workspace.'},
 {label:'Test',src:'/paper-figures/droid/evaluation.png',figure:'Figure 5',anchor:'S4.F5',alt:'Original DROID evaluation task setups in laboratories, offices and a home kitchen.',title:'Put the learned policy to work',text:'These settings show where the authors evaluate learned behavior. The Results chapter examines the success-rate comparisons.'}
];
export const hasVisualOverview = (slug:string) => ['droid-robot-manipulation-dataset','fast-action-tokenization'].includes(slug);

export function VisualPaperOverview({slug,onContinue}:{slug:string;onContinue:()=>void}) {
 const [selected,setSelected]=useState(0);
 const isDroid=slug==='droid-robot-manipulation-dataset';
 const [failed,setFailed]=useState(false);
 const figure=droidFigures[selected];
 const source=isDroid?`https://arxiv.org/html/2403.12945v2#${figure.anchor}`:'https://arxiv.org/html/2501.09747v1#S5.F4';
 const src=isDroid?figure.src:'/paper-figures/fast/pipeline.svg';
 const reviewedView=reviewedDroidGuide.chapters[0].views.find(item=>item.asset===figure.src.split('/').pop())!;
 return <section className={`visual-paper-intro ${isDroid?'droid-visual':'fast-visual'}`} aria-label="Visual paper overview">
   <header><span className="eyebrow">{isDroid?'DROID · The idea in pictures':'FAST · The idea in pictures'}</span><h2>{isDroid?'Helping robots work beyond the lab.':'Turn a movement into a shorter sequence of tokens.'}</h2>{isDroid && <div className="paper-purpose">
     <p><b>{reviewedDroidGuide.paperQuestion}</b></p>
     <p>{reviewedDroidGuide.contribution}</p>
     <details className="overview-finding"><summary>What did the authors find?</summary><p>{reviewedDroidGuide.finding}</p></details>
     <a href="https://arxiv.org/html/2403.12945v2#S1" target="_blank" rel="noreferrer">Read the paper’s question and contribution ↗</a>
   </div>}<p data-annotation-surface="visual">{isDroid?'The contribution is a diverse collection of robot experience. Follow the hardware → the places → the test.':'Read the authors’ diagram from left to right: movement → frequency coefficients → discrete symbols → action tokens.'}</p></header>
   {isDroid && <nav className="figure-sequence" aria-label="Explore DROID figures">{droidFigures.map((item,index)=><button key={item.label} aria-pressed={index===selected} aria-controls="original-overview-figure" onClick={()=>{setSelected(index);setFailed(false)}}><span>0{index+1}</span>{item.label}{index<2&&<ArrowRight aria-hidden="true" size={16}/>}</button>)}</nav>}
   <div className="visual-figure-layout">
     <figure id="original-overview-figure">
       <a className="original-figure-image" href={src} target="_blank" rel="noreferrer" aria-label="Enlarge original figure">{!failed?<img key={src} src={src} onError={()=>setFailed(true)} alt={isDroid?figure.alt:'Original FAST Figure 4: normalized action sequences are transformed with DCT, quantized, flattened, and compressed with BPE into action tokens.'}/>:<span>Figure unavailable. Open the linked paper below.</span>}<span className="figure-enlarge"><Maximize2 aria-hidden="true" size={14}/> Enlarge</span></a>
       <figcaption><a href={source} target="_blank" rel="noreferrer">{isDroid?`Khazatsky et al. · ${figure.figure} · DROID v2`:'Pertsch et al. · Figure 4 · FAST v1'} ↗</a><span>Original figure · CC BY 4.0 · Explanations below are ours</span></figcaption>
       {isDroid && <DroidFigurePanels chapter={0} asset={reviewedView.asset}/>}
     </figure>
     <aside className="figure-reading-key" aria-label="How to read the figure">
       <span className="eyebrow">{isDroid?'Look for this':'Follow the signal'}</span>
       {isDroid?<><h3>{reviewedView.title}</h3><p>{reviewedView.explanation}</p><div className="figure-reading-prompt"><span className="eyebrow">What this tells us</span><p>{reviewedView.conclusion}</p></div></>:<ol><li><b>Start with movement</b><p>Each curve is an action dimension changing over time.</p></li><li><b>Change the representation</b><p>DCT describes the curve using cosine coefficients. It changes coordinates, not the intended movement.</p></li><li><b>Make discrete symbols</b><p>Scaling and rounding turn coefficients into integers. This is where precision can be lost.</p></li><li><b>Compress into tokens</b><p>BPE merges frequent symbol sequences. A policy learns to predict these tokens; decoding recovers an action chunk.</p></li></ol>}
     </aside>
   </div>
   {isDroid && <DroidChapterExplanation chapter={0}/>}
   <footer><p>{isDroid?<><b>The point:</b> change the experience available to the learner, not just the model.</>:<><b>The point:</b> the action vocabulary can make the same learning objective more useful.</>}</p><button onClick={onContinue}>Explore the method <ArrowRight aria-hidden="true" size={16}/></button></footer>
 </section>;
}
