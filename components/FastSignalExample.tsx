"use client";
import { useState } from 'react';

const samples = Array.from({length:32},(_,n) => 0.5 + 0.3*Math.cos(Math.PI*(n+0.5)/32) + 0.13*Math.cos(7*Math.PI*(n+0.5)/32));
const coefficients = Array.from({length:32},(_,k) => samples.reduce((sum,value,n) => sum+value*Math.cos(Math.PI*(n+0.5)*k/32),0)*(k===0 ? Math.sqrt(1/32) : Math.sqrt(2/32)));
export function FastSignalExample() {
 const [count,setCount]=useState(3);
 const reconstructed=samples.map((_,n)=>coefficients.slice(0,count).reduce((sum,value,k)=>sum+value*(k===0?Math.sqrt(1/32):Math.sqrt(2/32))*Math.cos(Math.PI*(n+0.5)*k/32),0));
 const points=(values:number[])=>values.map((value,n)=>`${24+n*312/31},${170-value*140}`).join(' ');
 const error=Math.sqrt(samples.reduce((sum,value,n)=>sum+(value-reconstructed[n])**2,0)/32);
 return <figure className="fast-signal"><figcaption>Build a movement from cosine components</figcaption><label>Components retained: {count} of 32<input aria-label="Cosine components retained" type="range" min="1" max="32" value={count} onChange={event=>setCount(Number(event.target.value))}/></label><svg viewBox="0 0 360 205" role="img" aria-label="Original synthetic movement and its reconstruction from the selected cosine components"><path d="M24 22 V174 H340" fill="none" stroke="#b7ad9d"/><polyline points={points(samples)} stroke="#9c6a49" strokeWidth="3" strokeDasharray="5 4" fill="none"/><polyline points={points(reconstructed)} stroke="#35685b" strokeWidth="3" fill="none"/><text x="24" y="198" fontSize="11">Time →</text><text x="25" y="15" fontSize="11">Normalized command</text></svg><div className="signal-legend"><span>Dashed: original</span><span>Green: reconstruction</span></div><p aria-live="polite">Reconstruction error (RMSE): <strong>{error.toFixed(3)}</strong>. {count<8?'The small, faster correction is missing.':'The faster correction is recovered in this synthetic example.'}</p><small>Teaching illustration of the DCT only. No quantization, BPE, policy prediction, or measured robot performance is simulated here. Component count is not FAST token count.</small></figure>;
}
