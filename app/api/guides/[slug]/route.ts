import {NextRequest,NextResponse} from 'next/server';
import {guideJob,startGuideJob,guideFolder} from '@/lib/imports/guide-jobs';
import {localHost,localMutation} from '@/lib/imports/access';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {writeFile} from 'node:fs/promises';
const execute=promisify(execFile);
export const runtime='nodejs';
type Context={params:Promise<{slug:string}>};
export async function GET(request:NextRequest,{params}:Context){
 if(!localHost(request.headers.get('host')))return NextResponse.json({error:'Local library only.'},{status:403});
 try{return NextResponse.json(await guideJob((await params).slug),{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Could not read guide status.'},{status:400});}
}
export async function POST(request:NextRequest,{params}:Context){
 if(!localMutation(request))return NextResponse.json({error:'Local same-origin requests only.'},{status:403});
 try{
  const {slug}=await params,body=await request.json();
  if(body.action==='prepare')return NextResponse.json(await startGuideJob(slug),{status:202});
  if(body.action==='integrate'){
   if((await guideJob(slug)).state!=='needs_review')throw new Error('Prepare and review a completed draft first.');
   await execute(process.execPath,['scripts/integrate-library-guide.mjs',`--slug=${slug}`,'--reviewed'],{cwd:process.cwd(),timeout:30000});
   await writeFile(`${guideFolder(slug)}/job.json`,JSON.stringify({state:'ready',updatedAt:new Date().toISOString()}));return NextResponse.json({state:'ready'});
  }
  throw new Error('Unknown guide action.');
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Guide preparation failed.'},{status:400});}
}
