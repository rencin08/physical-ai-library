import {readFile,writeFile,readdir} from 'node:fs/promises';
import {validateGuide} from './guide-generation/library.mjs';
const norm=s=>s.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
for(const slug of await readdir('.guide-drafts/library')){
 const dir=`.guide-drafts/library/${slug}`;
 try{
  const guide=JSON.parse(await readFile(`${dir}/draft.json`,'utf8')),source=JSON.parse(await readFile(`${dir}/source.json`,'utf8'));
  for(const c of guide.chapters)for(const e of c.evidence){
   if(!norm(source.pages[e.page-1]?.text??'').includes(norm(e.excerpt))){
    const actual=source.pages.find(p=>norm(p.text).includes(norm(e.excerpt)));
    if(actual)e.page=actual.page;
   }
  }
  validateGuide(guide,source);
  await writeFile(`${dir}/validated.json`,JSON.stringify({slug,source:source.url,sourceSha256:source.sha256,generatedAt:new Date().toISOString(),guide},null,2));
  console.log('VALIDATED',slug);
 }catch(e){if(e.code!=='ENOENT')console.log('REVIEW',slug,e.message);}
}
