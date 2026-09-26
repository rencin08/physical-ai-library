import {NextRequest,NextResponse} from 'next/server';
import {readPersonal,writePersonal} from '@/lib/imports/store';
import {localHost,localMutation} from '@/lib/imports/access';
import {personalizedArxivQuery,validateDiscoveryProfile,discoveryReason,type DiscoveryProfile} from '@/lib/discovery-profile';
import {parseArxivSearch,type ArxivResult} from '@/lib/arxiv-search';
import {baseArxivId} from '@/lib/imports/arxiv';
export const runtime='nodejs';
type Discovery={papers:(ArxivResult&{reason:string;score:number})[];updatedAt:string;profileKey:string};
let inFlight=false;
export async function GET(request:NextRequest){
 if(!localHost(request.headers.get('host')))return NextResponse.json({papers:[]},{status:403});
 return NextResponse.json(await readPersonal<Discovery|null>('discoveries.json',null)??{papers:[]},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:NextRequest){
 if(!localMutation(request))return NextResponse.json({error:'Discovery preferences are available from your local library.'},{status:403});
 try{
  const raw=await request.text();if(raw.length>50000)throw new Error('Discovery preferences are too large.');
  const body=JSON.parse(raw),profile=validateDiscoveryProfile(body.profile);
  await writePersonal('discovery-profile.json',profile);
  await writePersonal('server.json',{url:`${request.nextUrl.protocol}//${request.headers.get('host')}`});
  if(body.action==='profile')return NextResponse.json({saved:true});
  if(body.action!=='refresh')throw new Error('Choose a discovery action.');
  const key=JSON.stringify(profile),cached=await readPersonal<Discovery|null>('discoveries.json',null);
  if(cached?.profileKey===key&&Date.now()-Date.parse(cached.updatedAt)<600000)return NextResponse.json(cached);
  if(inFlight)return NextResponse.json({error:'A search is already running. Please try again in a moment.'},{status:429});
  inFlight=true;
  try{
   const query=new URLSearchParams({search_query:personalizedArxivQuery(profile),start:'0',max_results:'40',sortBy:'submittedDate',sortOrder:'descending'});
   const response=await fetch(`https://export.arxiv.org/api/query?${query}`,{cache:'no-store',signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw new Error('arXiv is temporarily unavailable. Your existing suggestions are still saved.');
   const excluded=new Set(profile.excludedIds);
   const papers=parseArxivSearch(await response.text(),0).papers.filter(p=>!excluded.has(baseArxivId(p.id))).map(p=>({...p,...discoveryReason(p.title,p.abstract,profile)})).sort((a,b)=>b.score-a.score||b.published.localeCompare(a.published)).slice(0,12);
   const result={papers,updatedAt:new Date().toISOString(),profileKey:key};await writePersonal('discoveries.json',result);return NextResponse.json(result);
  }finally{inFlight=false;}
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Could not refresh discoveries.'},{status:400});}
}
