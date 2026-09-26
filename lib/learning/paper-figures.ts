import reviewed from './reviewed/paper-figures.json';

export type PaperFigure = {
 reading?:string; id:string; number:string; page:number; src:string; caption:string;
 source:string; sourceSha256:string; attribution:string; reuse:string;
 width:number; height:number;
};
export type PaperFigureGuide = {
 sourceSha256:string; figures:PaperFigure[]; chapters:string[][]; fallbackReasons:string[];
};
export const paperFigures = reviewed as Record<string,PaperFigureGuide>;
export function chapterFigures(slug:string,chapter:number):PaperFigure[]{
 const entry=paperFigures[slug];
 return entry?.chapters[chapter]?.flatMap(id=>entry.figures.filter(f=>f.id===id))??[];
}
export function hasOriginalPaperFigures(slug:string){
 if(['droid-robot-manipulation-dataset','fast-action-tokenization'].includes(slug))return true;
 const entry=paperFigures[slug];
 return Boolean(entry?.figures.length && entry.chapters.length===5 && entry.chapters.every((ids,i)=>ids.length ? ids.every(id=>entry.figures.some(f=>f.id===id)) : Boolean(entry.fallbackReasons[i])));
}
