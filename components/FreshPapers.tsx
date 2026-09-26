'use client';
import {useEffect,useMemo,useState} from 'react';
import {useReading} from './ReadingProvider';
import {AddArxivButton} from './AddPaper';
import {buildDiscoveryProfile,discoveryReason} from '@/lib/discovery-profile';
import type {Paper} from '@/lib/data';
import type {ArxivResult} from '@/lib/arxiv-search';
export function FreshPapers({papers}:{papers:Paper[]}){
 const {state,ready}=useReading();const profile=buildDiscoveryProfile(state,papers),profileKey=JSON.stringify(profile);
 const stableProfile=useMemo(()=>JSON.parse(profileKey),[profileKey]);
 const [results,setResults]=useState<(ArxivResult&{reason:string})[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[updated,setUpdated]=useState('');
 useEffect(()=>{fetch('/api/discovery').then(r=>r.ok?r.json():null).then(d=>{if(d){setResults(d.papers??[]);setUpdated(d.updatedAt??'');}}).catch(()=>{});},[]);
 useEffect(()=>{if(!ready)return;const controller=new AbortController();const timer=setTimeout(()=>{fetch('/api/discovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'profile',profile:stableProfile}),signal:controller.signal}).catch(()=>{});},750);return()=>{clearTimeout(timer);controller.abort();};},[ready,stableProfile]);
 async function refresh(){setBusy(true);setError('');try{
  const r=await fetch('/api/discovery',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'refresh',profile:stableProfile})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not find papers.');setResults(d.papers);setUpdated(d.updatedAt);
 }catch(e){setError(e instanceof Error?e.message:'Could not find papers.');}finally{setBusy(false);}}
 const excluded=new Set(profile.excludedIds);const visible=results.filter(p=>!excluded.has(p.id.replace(/v\d+$/,''))).map(p=>({...p,...discoveryReason(p.title,p.abstract,profile)})).sort((a,b)=>b.score-a.score||b.published.localeCompare(a.published));
 return <section className="fresh-papers wrap" aria-labelledby="fresh-papers-title"><div className="fresh-papers-heading"><div><div className="eyebrow">Beyond your shelf</div><h2 id="fresh-papers-title">New papers for you</h2><p>{profile.topics.length?`Looking for research on ${profile.topics.slice(0,3).map(t=>t.topic).join(', ')}.`:'Choose interests or save papers to personalize discovery. You can also explore recent robotics research.'}</p></div><button disabled={!ready||busy} onClick={refresh}>{busy?'Searching arXiv…':'Find new papers for me'}</button></div>
 <p className="discovery-privacy">Uses your interests and saved/finished paper topics. Your notes stay private.</p>
 {error&&<p role="alert">{error}</p>}{updated&&<p className="discovery-updated">Last checked {new Date(updated).toLocaleDateString()}{!visible.length?' · No new matches in this batch. Try different interests or search arXiv.':''}</p>}
 <div className="fresh-paper-grid">{visible.slice(0,6).map(p=><article key={p.id}><small>{p.published.slice(0,10)} · arXiv</small><h3><a href={p.url} target="_blank" rel="noreferrer">{p.title}</a></h3><p className="recommendation-reason">{p.reason}</p><details><summary>Read abstract</summary><p>{p.abstract}</p></details><AddArxivButton arxiv={p.id}/></article>)}</div>
 </section>;
}
