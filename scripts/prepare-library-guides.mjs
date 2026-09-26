import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {guideCatalog} from './guide-generation/catalog.mjs';
const folder='.guide-drafts/library'; await mkdir(folder,{recursive:true});
const requested=process.argv.find(a=>a.startsWith('--slug='))?.slice(7);
for(const p of guideCatalog().filter(p=>(!requested||p.slug===requested)&&!['droid-robot-manipulation-dataset','fast-action-tokenization'].includes(p.slug))){
 const dir=`${folder}/${p.slug}`;await mkdir(dir,{recursive:true});
 try{
  try{
    const cached=JSON.parse(await readFile(`${dir}/source.json`,'utf8'));
    if(!cached.figures){
      execFileSync('python3',['scripts/guide-generation/extract-figures.py',`${dir}/paper.pdf`,`${dir}/figures`,'--source',cached.url],{maxBuffer:20*1024*1024});
      cached.figures=JSON.parse(await readFile(`${dir}/figures/figures.json`,'utf8'));
      await writeFile(`${dir}/source.json`,JSON.stringify(cached));
    }
    console.log('CACHED',p.slug);continue;
  }catch(error){if(error.code!=='ENOENT')throw error;}
  const url=p.pdfUrl||`https://arxiv.org/pdf/${p.arxivId}`;
  let bytes;
  try { bytes=await readFile(`${dir}/paper.pdf`); } catch {
    const response=await fetch(url,{signal:AbortSignal.timeout(60000)});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    bytes=Buffer.from(await response.arrayBuffer());
    if(bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('Not PDF');
    await writeFile(`${dir}/paper.pdf`,bytes);
  }
  const extracted=JSON.parse(execFileSync('python3',['scripts/guide-generation/extract-pdf.py',`${dir}/paper.pdf`],{maxBuffer:20*1024*1024}));
  execFileSync('python3',['scripts/guide-generation/extract-figures.py',`${dir}/paper.pdf`,`${dir}/figures`,'--source',url],{maxBuffer:20*1024*1024});
  const figures=JSON.parse(await readFile(`${dir}/figures/figures.json`,'utf8'));
  await writeFile(`${dir}/source.json`,JSON.stringify({figures,paper:p,url,sha256:createHash('sha256').update(bytes).digest('hex'),downloadedAt:new Date().toISOString(),...extracted}));
  console.log('PREPARED',p.slug,extracted.pageCount,'pages');
 }catch(error){console.log('FAILED',p.slug,error.message);if(requested)process.exitCode=1;}
 await new Promise(resolve=>setTimeout(resolve,3100));
}
