import type {Paper} from './data';
import type {ReadingState} from './reading-state';
import {topicTerms,baseArxivId} from './imports/arxiv.ts';
export type DiscoveryProfile={topics:{topic:string;weight:number;reason:string}[];excludedIds:string[]};
export function buildDiscoveryProfile(state:ReadingState,catalog:Paper[]):DiscoveryProfile{
 const topics=new Map<string,{topic:string;weight:number;reason:string}>();
 const add=(topic:string,weight:number,reason:string)=>{const key=topic.toLowerCase(),old=topics.get(key);topics.set(key,{topic,weight:(old?.weight??0)+weight,reason:old&&old.weight>weight?old.reason:reason});};
 for(const topic of state.preferences?.interests??[])add(topic,8,`Your interest in ${topic}`);
 const bySlug=new Map([...catalog,...Object.values(state.records).map(r=>r.paper)].map(p=>[p.slug,p]));
 for(const paper of bySlug.values()){
  const feedback=state.preferences?.feedback[paper.slug],record=state.records[paper.slug];if(feedback==='less')continue;
  const history=state.preferences?.useReadingHistory??true;
  const weight=feedback==='more'?6:history&&record?.status==='completed'?4:history&&record?.saved?3:0;
  if(weight)for(const topic of paper.topics)add(topic,weight,`Because you ${feedback==='more'?'want more like':record?.status==='completed'?'finished':'saved'} ${paper.shortTitle}`);
 }
 return {topics:[...topics.values()].sort((a,b)=>b.weight-a.weight).slice(0,8),excludedIds:[...new Set([...catalog,...Object.values(state.records).map(r=>r.paper)].map(p=>baseArxivId(p.arxivId)).filter(Boolean))].slice(0,500)};
}
export function validateDiscoveryProfile(value:unknown):DiscoveryProfile{
 const v=value as DiscoveryProfile;
 if(!v||!Array.isArray(v.topics)||v.topics.length>8||!Array.isArray(v.excludedIds)||v.excludedIds.length>500)throw new Error('Invalid discovery preferences.');
 if(v.topics.some(t=>typeof t.topic!=='string'||t.topic.length>80||!Number.isFinite(t.weight)||t.weight<0||t.weight>100000||typeof t.reason!=='string'||t.reason.length>500)||v.excludedIds.some(id=>typeof id!=='string'||id.length>80))throw new Error('Invalid discovery preferences.');
 return {topics:v.topics.map(t=>({topic:t.topic,weight:t.weight,reason:t.reason})),excludedIds:v.excludedIds};
}
export function personalizedArxivQuery(profile:DiscoveryProfile){
 const terms=profile.topics.slice(0,4).flatMap(t=>(topicTerms[t.topic]??[t.topic]).slice(0,2)).map(t=>t.replace(/[^\p{L}\p{N}\s-]/gu,' ').trim()).filter(Boolean);
 return terms.length?`(cat:cs.RO OR cat:cs.AI OR cat:cs.CV OR cat:cs.LG) AND (${terms.map(t=>`all:"${t}"`).join(' OR ')})`:'cat:cs.RO';
}
export function discoveryReason(title:string,abstract:string,profile:DiscoveryProfile){
 const text=`${title} ${abstract}`.toLowerCase();const matches=profile.topics.filter(t=>(topicTerms[t.topic]??[t.topic]).some(term=>text.includes(term.toLowerCase())));
 return {score:matches.reduce((sum,t)=>sum+t.weight,0),reason:matches[0]?.reason??'Recent robotics research to explore'};
}
