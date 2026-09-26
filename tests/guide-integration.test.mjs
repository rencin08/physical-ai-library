import {createHash} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
test('reviewed integration installs source-matched figures and refuses changed source PDFs',async()=>{
 const root=resolve('.');const dir=await mkdtemp(join(tmpdir(),'library-guide-integration-'));
 try{
  const guides=JSON.parse(await readFile('lib/learning/reviewed/library-guides.json','utf8'));

  const original='pi-07-steerable-generalist',slug='arxiv-9901-54321';const entry=structuredClone(guides[original]);
  const pdf=Buffer.from('%PDF-1.4 synthetic integration fixture');
  const sha256=createHash('sha256').update(pdf).digest('hex');entry.sourceSha256=sha256;
  const source={url:entry.source,sha256,pages:Array.from({length:100},()=>({text:''})),figures:[]};
  for(const [i,c] of entry.guide.chapters.entries()){
   for(const e of c.evidence)source.pages[e.page-1].text+=' '+e.excerpt;
   const id=`figure-${i+1}`;source.figures.push({id,asset:`${id}.png`,sourceSha256:sha256,source:entry.source});
   c.figureIds=[id];c.figureReading='Read the original source figure panels.';c.figureFallbackReason='';
  }
  const draft=join(dir,'.guide-drafts','library',slug);await mkdir(join(draft,'figures'),{recursive:true});await mkdir(join(dir,'lib/learning/reviewed'),{recursive:true});
  for(const f of source.figures)await writeFile(join(draft,'figures',f.asset),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.alloc(1100)]));
  await writeFile(join(draft,'paper.pdf'),pdf);
  await writeFile(join(draft,'source.json'),JSON.stringify(source));await writeFile(join(draft,'validated.json'),JSON.stringify(entry));
  await writeFile(join(dir,'lib/learning/reviewed/library-guides.json'),'{}');await writeFile(join(dir,'lib/learning/reviewed/paper-figures.json'),'{}');
  const command=resolve('scripts/integrate-library-guide.mjs');
  await assert.rejects(run(process.execPath,[command,`--slug=${slug}`],{cwd:dir}),/reviewed/);
  await run(process.execPath,[command,`--slug=${slug}`,'--reviewed'],{cwd:dir});
  const integrated=JSON.parse(await readFile(join(dir,'lib/learning/reviewed/paper-figures.json'),'utf8'));
  assert.equal(integrated[slug].figures.length,5);assert.equal(integrated[slug].sourceSha256,entry.sourceSha256);
  assert.match(integrated[slug].figures[0].reading,/original source/);assert.ok((await readFile(join(dir,'public',integrated[slug].figures[0].src))).length>1000);
  const before=await readFile(join(dir,'lib/learning/reviewed/library-guides.json'),'utf8');
  await writeFile(join(draft,'paper.pdf'),'changed PDF');await assert.rejects(run(process.execPath,[command,`--slug=${slug}`,'--reviewed'],{cwd:dir}),/Source version changed/);
  assert.equal(await readFile(join(dir,'lib/learning/reviewed/library-guides.json'),'utf8'),before);
 }finally{await rm(dir,{recursive:true,force:true});}
});
