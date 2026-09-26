import { ExternalLink, Maximize2 } from 'lucide-react';
import { chapterFigures } from '@/lib/learning/paper-figures';

export function OriginalPaperFigures({slug,chapter}:{slug:string;chapter:number}){
 return <div className="original-paper-figures">{chapterFigures(slug,chapter).map(figure=><figure className="original-paper-figure" key={figure.id}>
  <figcaption><span className="book-kicker">From the original paper</span><h3>Figure {figure.number}</h3></figcaption>
  <a className="original-figure-image" href={figure.src} target="_blank" rel="noreferrer" aria-label={`Enlarge Figure ${figure.number}`}>
   {/* Original PDF crops retain all panels, axes and labels at their natural aspect ratio. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src={figure.src} alt={figure.caption} width={figure.width} height={figure.height} loading={chapter===0?'eager':'lazy'}/>
   <span><Maximize2 size={15}/> Enlarge figure</span>
  </a>
  {figure.reading && <p className="original-figure-reading">{figure.reading}</p>}
  <details className="original-figure-caption"><summary>Read the original caption excerpt</summary><p>{figure.caption}</p></details>
  <a className="original-figure-source" href={`${figure.source}#page=${figure.page}`} target="_blank" rel="noreferrer">Original paper · page {figure.page} <ExternalLink size={13}/></a>
  <small>{figure.attribution}</small>
 </figure>)}</div>;
}
