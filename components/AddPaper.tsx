'use client';
import {useRef,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Plus,X} from 'lucide-react';
import {useReading} from './ReadingProvider';
import type {Paper} from '@/lib/data';

export function AddArxivButton({arxiv,onAdded}:{arxiv:string;onAdded?:(paper:Paper)=>void}){
 const {update}=useReading(),router=useRouter();const [busy,setBusy]=useState(false),[error,setError]=useState(''),[added,setAdded]=useState<Paper|null>(null);
 async function add(){setBusy(true);setError('');try{
  const response=await fetch('/api/library/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({arxiv})});const result=await response.json();
  if(!response.ok)throw new Error(result.error||'Could not add paper.');
  update(result.paper,{saved:true});setAdded(result.paper);onAdded?.(result.paper);router.refresh();
 }catch(e){setError(e instanceof Error?e.message:'Could not add paper.');}finally{setBusy(false);}}
 return <span className="add-arxiv-action">{added?<Link href={`/paper/${added.slug}`}>Added · Open paper →</Link>:<button disabled={busy} onClick={add}>{busy?'Adding…':'Add to library'}</button>}{error&&<span role="alert">{error}</span>}</span>;
}
export function AddPaper(){
 const dialog=useRef<HTMLDialogElement>(null),router=useRouter();const {update}=useReading();
 const [value,setValue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[paper,setPaper]=useState<Paper|null>(null);
 async function add(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{
  const response=await fetch('/api/library/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({arxiv:value})});const result=await response.json();
  if(!response.ok)throw new Error(result.error||'Could not add paper.');
  update(result.paper,{saved:true});setPaper(result.paper);router.refresh();
 }catch(e){setError(e instanceof Error?e.message:'Could not add paper.');}finally{setBusy(false);}}
 return <><button className="arxiv-trigger" onClick={()=>{setPaper(null);setError('');dialog.current?.showModal();}}><Plus size={15}/> Add paper</button>
 <dialog className="arxiv-dialog add-paper-dialog" ref={dialog} aria-labelledby="add-paper-title"><div className="arxiv-dialog-heading"><div><h2 id="add-paper-title">Add a paper</h2><p>Paste an arXiv link or ID. We’ll fetch its title and abstract and save it to your library.</p></div><button aria-label="Close add paper" onClick={()=>dialog.current?.close()}><X size={20}/></button></div>
 <form className="add-paper-form" onSubmit={add}><label htmlFor="paper-link">arXiv link or ID</label><input id="paper-link" placeholder="https://arxiv.org/abs/…" value={value} onChange={e=>setValue(e.target.value)} maxLength={500} required/><button disabled={busy||!value.trim()}>{busy?'Adding paper…':'Add to library'}</button></form>
 {error&&<p role="alert">{error}</p>}{paper&&<div className="paper-added" role="status"><h3>{paper.title}</h3><p>Saved to your library. You can read the original now and prepare an illustrated guide from the paper page.</p><Link href={`/paper/${paper.slug}`} onClick={()=>dialog.current?.close()}>Open paper →</Link></div>}
 </dialog></>;
}
