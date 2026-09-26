"use client";

import { useState } from "react";

export function DroidBatchVisual() {
  const [mixture, setMixture] = useState<"task" | "droid" | "oxe">("droid");
  const mixed = mixture !== "task";
  const other = mixture === "droid" ? "DROID" : "Open-X";
  return <div className="droid-teaching-visual" data-teaching-visual="batch">
    <span className="eyebrow">One training update</span>
    <h3>What goes into a batch?</h3>
    <div className="batch-options" role="group" aria-label="Choose training data mixture">
      {([['task','Task only'],['droid','Task + DROID'],['oxe','Task + Open-X']] as const).map(([value,label])=><button key={value} aria-pressed={mixture === value} onClick={()=>setMixture(value)}>{label}</button>)}
    </div>
    <div className="batch-counts" aria-live="polite"><span><b>{mixed ? 64 : 128}</b> target-task samples</span><span><b>{mixed ? 64 : 0}</b> {mixed ? other : "other-dataset"} samples</span></div>
    <div className={`batch-grid ${mixture}`} role="img" aria-label={`Batch of 128: ${mixed ? `64 target-task samples and 64 ${other} samples` : '128 target-task samples'}`}>
      {Array.from({length:128},(_,index)=><i key={index} className={mixed && index >= 64 ? "other" : "task"}/>) }
    </div>
    <div className="batch-legend"><span><i className="task"/> Target task</span>{mixed && <span><i className={mixture}/> {other}</span>}<span>One square = one sample</span></div>
    <div className="batch-training-arrow" aria-hidden="true">↓</div>
    <div className="batch-policy"><b>Diffusion policy</b><span>Same architecture across the three comparisons</span></div>
    <p className="teaching-caption">Illustration of the reported batch construction. Squares represent sample counts, not individual records from the dataset.</p>
  </div>;
}

export function DroidActionVisual() {
  const [cycle, setCycle] = useState(0);
  return <div className="droid-teaching-visual" data-teaching-visual="actions">
    <span className="eyebrow">At deployment</span><h3>Predict ahead. Act. Look again.</h3>
    <div className="action-observations"><span>Observe</span><b>2 recent observations</b><small>Images, instruction, robot state</small></div>
    <p className="action-cycle" aria-live="polite">{cycle === 0 ? "First prediction" : `After ${cycle * 8} executed actions: observe again and make a new prediction`}</p>
    <div className="action-timeline" role="img" aria-label="Predict 16 actions. Execute the first 8, then observe again and replan.">
      {Array.from({length:16},(_,i)=><span key={i} className={i<8?'execute':'replan'}>{cycle*8+i+1}</span>)}
    </div>
    <div className="action-labels"><span>Execute these 8</span><span>Replan before these 8</span></div>
    <div className="action-loop"><span>↶ New observations → new prediction</span><button onClick={()=>setCycle(value=>(value+1)%4)}>{cycle===3?'Restart example':'Advance 8 actions'} →</button></div>
    <p className="teaching-caption">Schematic of the paper’s 2 / 16 / 8 observation, prediction, and action horizons. Numbers show sequence positions; this is not a robot simulation.</p>
  </div>;
}
