import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {guideCatalog} from '../scripts/guide-generation/catalog.mjs';
import {validateGuide} from '../scripts/guide-generation/library.mjs';
const guides=JSON.parse(readFileSync(new URL('../lib/learning/reviewed/library-guides.json',import.meta.url)));
test('every catalog paper has a complete simplified reading experience',()=>{
 const bespoke=new Set(['droid-robot-manipulation-dataset','fast-action-tokenization']);
 const catalog=guideCatalog({includePersonal:false});assert.equal(catalog.length,41);
 for(const paper of catalog){
  if(bespoke.has(paper.slug))continue;
  const entry=guides[paper.slug];assert.ok(entry,`Missing guide: ${paper.slug}`);
  assert.equal(entry.guide.sourceMatches,true);assert.equal(entry.guide.chapters.length,5);
  assert.match(entry.source,/^https:\/\//);assert.match(entry.sourceSha256,/^[a-f0-9]{64}$/);
  const diagrams=new Set();
  for(const chapter of entry.guide.chapters){
   assert.ok(chapter.paragraphs.join(' ').length>350,`${paper.slug}: sparse chapter`);
   assert.ok(chapter.evidence.length);assert.ok(chapter.evidence.every(e=>Number.isInteger(e.page)&&e.page>0));
   assert.ok(chapter.visual.nodes.length>=3);diagrams.add(chapter.visual.nodes.map(n=>n.label).join('|'));
   assert.ok(chapter.answer&&chapter.takeaway);
  }
  assert.equal(diagrams.size,5,`${paper.slug}: repeated diagram`);
 }
});
test('source validator rejects unsupported passages and source mismatches',()=>{
 const entry=Object.values(guides)[0];assert.ok(entry);
 const guide=structuredClone(entry.guide);
 const pages=Array.from({length:100},()=>({text:''}));
 for(const c of guide.chapters)for(const e of c.evidence)pages[e.page-1].text+=' '+e.excerpt;
 assert.equal(validateGuide(guide,{pages}),guide);
 guide.chapters[0].evidence[0].excerpt='This invented statement does not occur in the source.';
 assert.throws(()=>validateGuide(guide,{pages}),/Unmatched excerpt/);
 guide.sourceMatches=false;assert.throws(()=>validateGuide(guide,{pages}),/Source title mismatch/);
});
