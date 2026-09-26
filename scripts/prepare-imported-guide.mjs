import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {loadEnvFile} from 'node:process';
try{loadEnvFile('.env.local');}catch{}
const slug=process.argv.find(a=>a.startsWith('--slug='))?.slice(7);
if(!slug||!/^arxiv-[a-zA-Z0-9-]+$/.test(slug))throw new Error('Invalid paper slug');
const dir=`.guide-drafts/library/${slug}`;
const personal=process.env.LIBRARY_PERSONAL_DIRECTORY||'.library';
await mkdir(dir,{recursive:true});
async function status(state,message){await writeFile(`${dir}/job.json`,JSON.stringify({state,message,updatedAt:new Date().toISOString()}));}
async function run(script,args){
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[script,...args],{stdio:['ignore','pipe','pipe'],env:process.env});let output='';
  child.stdout.on('data',b=>{output=(output+b.toString()).slice(-12000);});child.stderr.on('data',b=>{output=(output+b.toString()).slice(-12000);});
  child.on('error',reject);child.on('close',async code=>{await writeFile(`${dir}/worker.log`,output);code===0?resolve():reject(new Error(`Preparation failed. ${output.slice(-500)}`));});
 });
}
try{
 await status('preparing','Downloading the paper and extracting original figures.');
 await run('scripts/prepare-library-guides.mjs',[`--slug=${slug}`]);
 const source=JSON.parse(await readFile(`${dir}/source.json`,'utf8'));
 if(!source.figures?.length)throw new Error('No original figures could be extracted automatically. This paper needs manual figure preparation.');
 await status('generating','Writing the five-chapter guide from the paper and its figures.');
 await run('scripts/generate-library-guides.mjs',['--generate',`--slug=${slug}`]);
 const validated=JSON.parse(await readFile(`${dir}/validated.json`,'utf8'));
 if(validated.sourceSha256!==source.sha256)throw new Error('The draft does not match this paper version.');
 await status('needs_review','Your illustrated draft is ready to review.');
}catch(error){
 let message=error.message;
 if(error.code==='ENOENT')message='The guide did not complete. Inspect the local draft log before retrying; any existing AI request will not be charged again automatically.';
 await status('failed',message);
}finally{await unlink(join(personal,'guide-worker.lock')).catch(()=>{});}
