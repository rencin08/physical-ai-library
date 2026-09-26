import {NextRequest,NextResponse} from 'next/server';
import {papers} from '@/lib/data';
import {parseArxivId,baseArxivId,paperFromArxiv} from '@/lib/imports/arxiv';
import {fetchArxivPaper} from '@/lib/imports/fetch-arxiv';
import {addPersonalPaper,getPersonalPapers} from '@/lib/imports/store';
import {localMutation} from '@/lib/imports/access';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 if(!localMutation(request))return NextResponse.json({error:'Adding papers is available from your local library.'},{status:403});
 try{
  const raw=await request.text();if(raw.length>2000)return NextResponse.json({error:'The paper link is too long.'},{status:400});
  const body=JSON.parse(raw);if(typeof body.arxiv!=='string')throw new Error('Enter an arXiv link or ID.');
  const id=parseArxivId(body.arxiv);
  const existing=[...papers,...await getPersonalPapers()].find(p=>baseArxivId(p.arxivId)===baseArxivId(id));
  if(existing)return NextResponse.json({paper:existing,existing:true});
  const result=await addPersonalPaper(paperFromArxiv(await fetchArxivPaper(id)));
  return NextResponse.json(result,{status:result.existing?200:201});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Could not add this paper.'},{status:400});}
}
