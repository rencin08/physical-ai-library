import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {Paper} from '../data';
import {baseArxivId} from './arxiv.ts';
export const personalDirectory=()=>process.env.LIBRARY_PERSONAL_DIRECTORY||join(process.cwd(),'.library');
export async function readPersonal<T>(name:string,fallback:T):Promise<T>{
 try{return JSON.parse(await readFile(join(personalDirectory(),name),'utf8')) as T;}
 catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return fallback;throw error;}
}
export async function writePersonal(name:string,value:unknown){
 const dir=personalDirectory();await mkdir(dir,{recursive:true});const temp=join(dir,`.${name}.${randomUUID()}.tmp`);
 await writeFile(temp,JSON.stringify(value,null,2)+'\n',{mode:0o600});await rename(temp,join(dir,name));
}
let importQueue:Promise<unknown>=Promise.resolve();
export const getPersonalPapers=()=>readPersonal<Paper[]>('imports.json',[]);
export async function addPersonalPaper(paper:Paper):Promise<{paper:Paper;existing:boolean}>{
 const operation=importQueue.catch(()=>{}).then(async()=>{
  const all=await getPersonalPapers();const existing=all.find(p=>baseArxivId(p.arxivId)===baseArxivId(paper.arxivId));
  if(existing)return {paper:existing,existing:true};
  await writePersonal('imports.json',[...all,paper]);return {paper,existing:false};
 });importQueue=operation;return operation;
}
