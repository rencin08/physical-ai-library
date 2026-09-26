import {readFile,mkdir,open,writeFile,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {personalDirectory,getPersonalPapers,writePersonal} from './store';
import {libraryGuides} from '../learning/library-guides';
export type GuideJob={state:'unprepared'|'preparing'|'generating'|'needs_review'|'ready'|'failed';message?:string;updatedAt?:string};
export function guideFolder(slug:string){if(!/^arxiv-[a-zA-Z0-9-]+$/.test(slug))throw new Error('Invalid imported paper.');return join(process.cwd(),'.guide-drafts','library',slug);}
export async function guideJob(slug:string):Promise<GuideJob>{
 const folder=guideFolder(slug);
 if(libraryGuides[slug])return {state:'ready'};
 try{
  const job:GuideJob=JSON.parse(await readFile(join(folder,'job.json'),'utf8'));
  if(['preparing','generating'].includes(job.state)){
   let alive=false;
   try{const lock=JSON.parse(await readFile(join(personalDirectory(),'guide-worker.lock'),'utf8'));if(lock.slug===slug&&Number.isInteger(lock.pid)&&lock.pid>0){process.kill(lock.pid,0);alive=true;}}catch{}
   if(!alive){const stopped:GuideJob={state:'failed',message:'Preparation was interrupted. An existing AI request will not be repeated automatically.',updatedAt:new Date().toISOString()};await writeFile(join(folder,'job.json'),JSON.stringify(stopped));return stopped;}
  }
  return job;
 }catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {state:'unprepared'};throw e;}
}
export async function startGuideJob(slug:string){
 if(process.env.LIBRARY_DISABLE_GUIDE_GENERATION==='1')throw new Error('Guide generation is disabled in this environment.');
 if(!process.env.OPENAI_GUIDE_MODEL)throw new Error('Set OPENAI_GUIDE_MODEL in your local environment before preparing a guide.');
 if(!process.env.OPENAI_API_KEY)throw new Error('Add the guide-generation API key to this local library before preparing a guide.');
 if(!(await getPersonalPapers()).some(p=>p.slug===slug))throw new Error('Add this paper to your library first.');
 const job=await guideJob(slug);if(['preparing','generating','needs_review','ready'].includes(job.state))return job;
 const dir=personalDirectory();await mkdir(dir,{recursive:true});const lock=join(dir,'guide-worker.lock');
 try{const previous=JSON.parse(await readFile(lock,'utf8'));let alive=true;try{if(!Number.isInteger(previous.pid)||previous.pid<=0)throw new Error('Invalid worker');process.kill(previous.pid,0);}catch{alive=false;}if(alive)throw new Error('Another guide is being prepared. Please wait for it to finish.');await unlink(lock);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 const handle=await open(lock,'wx');await handle.writeFile(JSON.stringify({pid:process.pid,slug}));await handle.close();
 const folder=guideFolder(slug);await mkdir(folder,{recursive:true});
 const next:GuideJob={state:'preparing',updatedAt:new Date().toISOString()};await writeFile(join(folder,'job.json'),JSON.stringify(next));
 try{
  const child=spawn(process.execPath,['scripts/prepare-imported-guide.mjs',`--slug=${slug}`],{cwd:process.cwd(),detached:true,stdio:'ignore',env:{...process.env,LIBRARY_PERSONAL_DIRECTORY:dir}});
  await new Promise<void>((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});
  await writePersonal('guide-worker.lock',{pid:child.pid,slug});child.unref();return next;
 }catch(error){await unlink(lock).catch(()=>{});await writeFile(join(folder,'job.json'),JSON.stringify({state:'failed',message:'The guide worker could not start.'}));throw error;}
}
