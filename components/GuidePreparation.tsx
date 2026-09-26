'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import type {GuideJob} from '@/lib/imports/guide-jobs';
export function GuidePreparation({slug,review=false}:{slug:string;review?:boolean}){
 const router=useRouter();const [job,setJob]=useState<GuideJob>({state:'unprepared'}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let stopped=false;const load=()=>fetch(`/api/guides/${slug}`).then(r=>r.ok?r.json():null).then(d=>{if(d&&!stopped){setJob(d);if(d.state==='ready')router.refresh();}}).catch(()=>{});load();const timer=['preparing','generating'].includes(job.state)?setInterval(load,4000):undefined;return()=>{stopped=true;if(timer)clearInterval(timer);};},[slug,router,job.state]);
 async function run(action:string){setBusy(true);setError('');try{const r=await fetch(`/api/guides/${slug}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action})});const d=await r.json();if(!r.ok)throw new Error(d.error);setJob(d);if(d.state==='ready'){router.push(`/paper/${slug}`);router.refresh();}}catch(e){setError(e instanceof Error?e.message:'Could not prepare guide.');}finally{setBusy(false);}}
 if(job.state==='ready'&&!review)return null;
 const running=['preparing','generating'].includes(job.state);
 return <section className="guide-preparation" aria-label="Illustrated guide preparation"><div><span className="eyebrow">Your illustrated reader</span><h2>{job.state==='needs_review'?'Your draft is ready':running?'Preparing your illustrated guide…':job.state==='ready'?'Guide ready':'Turn this paper into a guided read'}</h2><p>{job.message||'Read the original now, or prepare five chapters with the paper’s original figures.'}</p>{error&&<p role="alert">{error}</p>}</div>
 {review?<button disabled={busy||job.state!=='needs_review'} onClick={()=>run('integrate')}>{busy?'Saving…':'Use reviewed guide'}</button>:job.state==='needs_review'?<Link href={`/guides/${slug}/review`}>Review illustrated draft →</Link>:!running&&job.state!=='ready'?<div><button disabled={busy} onClick={()=>run('prepare')}>{busy?'Starting…':job.state==='failed'?'Retry preparation':'Prepare illustrated guide'}</button><small>Uses your configured AI API credits for one draft. You’ll review it before it replaces the overview.</small></div>:<p role="status">You can keep reading. This continues in the background.</p>}
 </section>;
}
