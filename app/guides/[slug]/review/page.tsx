import {readFile} from 'node:fs/promises';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {localHost} from '@/lib/imports/access';
import {guideFolder} from '@/lib/imports/guide-jobs';
import {GuidePreparation} from '@/components/GuidePreparation';
import type {LibraryGuide,LibraryChapter} from '@/lib/learning/library-guides';
import type {PaperFigure} from '@/lib/learning/paper-figures';
export const dynamic='force-dynamic';
export default async function ReviewGuide({params}:{params:Promise<{slug:string}>}){
 if(!localHost((await headers()).get('host')))notFound();
 const {slug}=await params;let entry:LibraryGuide,figures:(PaperFigure&{asset:string})[];
 try{const dir=guideFolder(slug);entry=JSON.parse(await readFile(`${dir}/validated.json`,'utf8'));figures=JSON.parse(await readFile(`${dir}/source.json`,'utf8')).figures;}catch{notFound();}
 return <main className="wrap guide-draft-review"><div className="page-intro"><span className="eyebrow">Illustrated draft · Review before use</span><h1>{entry.guide.sourceTitle}</h1><p>Check each figure for complete panels and labels, and compare the explanations with the linked paper. This AI-generated draft is not yet your published reader.</p><a href={entry.source} target="_blank" rel="noreferrer">Open original paper ↗</a></div>
 {entry.guide.chapters.map((chapter:LibraryChapter&{figureIds?:string[];figureReading?:string;figureFallbackReason?:string},i)=><section className="draft-chapter" key={i}><h2>{chapter.title}</h2><p>{chapter.intro}</p>{chapter.figureIds?.map(id=>{const f=figures.find(f=>f.id===id);return f?<figure key={id}><a href={`/api/guides/${slug}/figures/${f.asset}`} target="_blank" rel="noreferrer"><img src={`/api/guides/${slug}/figures/${f.asset}`} alt={f.caption}/></a><figcaption>Figure {f.number} · <a href={`${entry.source}#page=${f.page}`} target="_blank" rel="noreferrer">PDF page {f.page}</a><p>{f.caption}</p></figcaption></figure>:<p key={id}>Missing figure: {id}</p>;})}<p>{chapter.figureReading||chapter.figureFallbackReason}</p>{chapter.paragraphs.map((p,j)=><p key={j}>{p}</p>)}<strong>{chapter.takeaway}</strong></section>)}
 {entry.guide.uncertainties.length>0&&<section><h2>Points to check</h2><ul>{entry.guide.uncertainties.map(t=><li key={t}>{t}</li>)}</ul></section>}
 <GuidePreparation slug={slug} review/>
 </main>;
}
