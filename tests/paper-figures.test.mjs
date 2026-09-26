import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateGuide} from '../scripts/guide-generation/library.mjs';
const guides=JSON.parse(readFileSync(new URL('../lib/learning/reviewed/library-guides.json',import.meta.url)));
const figures=JSON.parse(readFileSync(new URL('../lib/learning/reviewed/paper-figures.json',import.meta.url)));
test('batch guides have valid original assets or explicit source-only distribution',()=>{
 for(const [slug,entry] of Object.entries(guides)){
  const visuals=figures[slug];assert.equal(visuals.sourceSha256,entry.sourceSha256,slug);
  assert.equal(visuals.chapters.length,5);const seen=new Set();
  for(const [i,ids] of visuals.chapters.entries()){
   if(!ids.length)assert.ok(visuals.fallbackReasons[i],`${slug}: missing fallback explanation`);
   for(const id of ids){
    assert.ok(!seen.has(id),`${slug}: repeated figure`);seen.add(id);
    const f=visuals.figures.find(f=>f.id===id);assert.ok(f,slug);
    assert.equal(f.source,entry.source);assert.equal(f.sourceSha256,entry.sourceSha256);
    const bytes=readFileSync(new URL(`../public${f.src}`,import.meta.url));assert.equal(bytes.subarray(1,4).toString(),'PNG');
    assert.ok(bytes.readUInt32BE(16)>=150 && bytes.readUInt32BE(20)>=70,`${slug}: empty crop`);
   }
  }
  if(visuals.distribution==='source-links-only'){assert.equal(seen.size,0);assert.ok(visuals.fallbackReasons.every(Boolean));}else assert.ok(seen.size>0,slug);
 }
});
test('generation rejects invented, repeated, or missing figure selections',()=>{
 const guide=structuredClone(Object.values(guides)[0].guide);
 const pages=Array.from({length:100},()=>({text:''}));
 for(const [i,c] of guide.chapters.entries()){
  for(const e of c.evidence)pages[e.page-1].text+=' '+e.excerpt;
  c.figureIds=[`figure-${i+1}`];c.figureReading='Read the panels.';c.figureFallbackReason='';
 }
 const source={pages,figures:[1,2,3,4,5].map(n=>({id:`figure-${n}`}))};
 assert.equal(validateGuide(guide,source),guide);
 const bad=structuredClone(guide);bad.chapters[0].figureIds=['invented'];assert.throws(()=>validateGuide(bad,source),/Unknown original/);
 bad.chapters[0].figureIds=['figure-2'];assert.throws(()=>validateGuide(bad,source),/Repeated original/);
 bad.chapters[0].figureIds=[];assert.throws(()=>validateGuide(bad,source),/fallback/);
});
