import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectForYou, sortByCitations, learningPaths } from '../lib/learning-paths.ts';
import { readFileSync } from 'node:fs';
test('shortlist stays diverse, excludes completed work and does not mutate catalog', () => {
 const ranked=Array.from({length:12},(_,i)=>({paper:{slug:String(i),topics:[i<5?'VLA':String(i)]},completed:i===0}));
 const result=selectForYou(ranked);
 assert.equal(result.length,6);
 assert.ok(!result.some(x=>x.completed));
 assert.equal(result.filter(x=>x.paper.topics[0]==='VLA').length,2);
 assert.equal(ranked.length,12);
});
test('missing citations sort after known zero and remain unknown', () => {
 const items=[{slug:'unknown'},{slug:'zero',citationCount:0},{slug:'cited',citationCount:10}];
 assert.deepEqual(sortByCitations(items).map(x=>x.slug),['cited','zero','unknown']);
 assert.equal(items[0].citationCount,undefined);
});
test('all local reading-path references resolve and citation snapshots identify their source', () => {
 const extra=JSON.parse(readFileSync(new URL('../lib/curation/reading-papers.json',import.meta.url)));
 const original=readFileSync(new URL('../lib/data.ts',import.meta.url),'utf8');
 const ids=new Set([...original.matchAll(/arxivId: "([\d.]+)"/g)].map(x=>x[1]).concat(extra.map(x=>x.arxivId)));
 for(const path of learningPaths) for(const id of path.ids) assert.ok(ids.has(id),id);
 const citations=JSON.parse(readFileSync(new URL('../lib/curation/citations.json',import.meta.url)));
 for(const [id,row] of Object.entries(citations)){assert.ok(ids.has(id));assert.ok(Number.isInteger(row.count)&&row.count>=0);assert.match(row.url,/^https:\/\/www.semanticscholar.org\/paper\//);assert.ok(Number.isFinite(Date.parse(row.retrievedAt)));}
});
test('shortlist includes current work while preserving its first recommendation',()=>{
 const year=new Date().getFullYear();
 const ranked=Array.from({length:10},(_,i)=>({paper:{slug:String(i),year:i>=8?year:2023,topics:[String(i)]},completed:false}));
 const selected=selectForYou(ranked);
 assert.equal(selected[0].paper.slug,'0');
 assert.equal(selected.filter(x=>x.paper.year===year).length,2);
 assert.equal(new Set(selected.map(x=>x.paper.slug)).size,6);
});
test('roadmap chronology uses publication dates and the shared catalog, with a separate study order',async()=>{
 const {roadmapPapers}=await import('../lib/learning-paths.ts');
 const path={id:'world-models',ids:['old-b','old-a']};
 const catalog=[
  {slug:'b',arxivId:'old-b',title:'B',year:2023,publishedAt:'2023-03-01',topics:[]},
  {slug:'a',arxivId:'old-a',title:'A',year:2023,publishedAt:'2023-01-01',topics:[]},
  {slug:'new',arxivId:'new',title:'New',year:2026,publishedAt:'2026-02-01',topics:['World Models']},
  {slug:'report',arxivId:'',title:'Report',year:2026,publishedAt:'2026-01-01',topics:[],roadmapPaths:['world-models']},
 ];
 assert.deepEqual(roadmapPapers(catalog,path).map(p=>p.slug),['a','b','report','new']);
 assert.deepEqual(roadmapPapers(catalog,path,'newest').map(p=>p.slug),['new','report','b','a']);
 assert.deepEqual(roadmapPapers(catalog,path,'suggested').map(p=>p.slug),['b','a','report','new']);
 assert.equal(catalog[0].slug,'b');
});
