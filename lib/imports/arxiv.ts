import type { Paper } from '../data';
import type { ArxivResult } from '../arxiv-search';

export function parseArxivId(input:string):string {
 let value=input.trim().replace(/^arxiv:\s*/i,'');
 if(/^https?:\/\//i.test(value)){
  const url=new URL(value);
  if(!['arxiv.org','www.arxiv.org','export.arxiv.org'].includes(url.hostname)||url.username||url.password||url.port)throw new Error('Paste an arXiv abstract/PDF link or an arXiv ID.');
  value=url.pathname.replace(/^\/(abs|pdf)\//,'').replace(/\.pdf$/,'');
 }
 if(!/^(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7})(?:v[1-9]\d*)?$/.test(value))throw new Error('Paste an arXiv abstract/PDF link or an arXiv ID.');
 return value;
}
export const baseArxivId=(id:string)=>id.replace(/v\d+$/,'');
export const topicTerms:Record<string,string[]>={
 'VLA':['vision-language-action','vision language action','vla'],
 'Robot Data':['robot dataset','robot data','demonstration','teleoperation','egocentric'],
 'World Models':['world model','world action model','world-action model'],
 'Diffusion Policies':['diffusion policy','diffusion policies','action diffusion'],
 'Manipulation':['manipulation','grasp','dexterous'],
 'Cross-Embodiment':['cross-embodiment','cross embodiment','embodiments'],
 'Humanoids':['humanoid'], 'Reinforcement Learning':['reinforcement learning'],
 'Sim-to-Real':['sim-to-real','domain randomization'], 'Memory':['memory','long-horizon'],
 'Foundation Models':['foundation model','generalist'], 'Planning':['planning','reasoning']
};
export function inferTopics(title:string,abstract:string):string[]{
 const text=`${title} ${abstract}`.toLowerCase();
 return Object.entries(topicTerms).filter(([,terms])=>terms.some(term=>text.includes(term))).map(([topic])=>topic).slice(0,6);
}
export function paperFromArxiv(result:ArxivResult):Paper {
 const id=baseArxivId(result.id),topics=inferTopics(result.title,result.abstract);
 return {slug:`arxiv-${id.replace(/[^a-zA-Z0-9]/g,'-')}`,arxivId:id,title:result.title,
 shortTitle:result.title.split(/[:—]/)[0].split(' ').slice(0,6).join(' '),authors:result.authors.join(', '),institution:'arXiv',
 year:Number(result.published.slice(0,4)),publishedAt:result.published,summary:result.abstract,why:'',topics:topics.length?topics:['Research'],
 sourceUrl:result.url,pdfUrl:result.pdfUrl,metadataVerifiedAt:new Date().toISOString().slice(0,10),accent:'teal',
 architecture:'',task:'',embodiments:'',modalities:'',dataset:'',openSource:false,contributions:[],limitations:[],lineage:[]};
}
