import {findLibraryServer} from './discovery-server.mjs';
import {readFile} from 'node:fs/promises';
// Local maintenance command. Credentials stay in .env.local, never in arguments or logs.
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
try { loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url))); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const command = process.argv[2] ?? 'status';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function database(path) {
 const response = await fetch(`${url}/rest/v1/${path}`, {headers:{apikey:key,Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});
 if(!response.ok) throw new Error(`Database returned HTTP ${response.status}`);
 return response.json();
}
try {
 if(!url || !key) throw new Error('Database credentials are not configured in .env.local.');
 if(command === 'status') {
  const [runs,papers] = await Promise.all([database('ingestion_runs?select=id,status,started_at,completed_at,stats&order=started_at.desc&limit=3'),database('papers?select=status&limit=1000')]);
  const counts=papers.reduce((result,paper)=>(result[paper.status]=(result[paper.status]??0)+1,result),{});
  console.log(JSON.stringify({connected:true,paperCounts:counts,countLimit:1000,recentRuns:runs},null,2));
 } else if(command === 'run') {
  if(!process.env.CRON_SECRET) throw new Error('CRON_SECRET is not configured.');
  // Fail early if the project is paused or unavailable. Never substitute another database.
  await database('ingestion_runs?select=id&limit=1');
  let remembered;
  try{remembered=JSON.parse(await readFile(`${process.env.LIBRARY_PERSONAL_DIRECTORY||'.library'}/server.json`,'utf8')).url;}catch{}
  const base=await findLibraryServer({preferred:process.env.LIBRARY_BASE_URL,remembered});
  const response=await fetch(`${base}/api/ingest`,{method:'POST',headers:{Authorization:`Bearer ${process.env.CRON_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify({maxResults:50,enrichLimit:3,includeFeeds:false}),signal:AbortSignal.timeout(120000)});
  if(!response.ok) throw new Error(`Local ingestion returned HTTP ${response.status}. Check the local server and project connection.`);
  const result=await response.json();
  console.log(JSON.stringify({at:new Date().toISOString(),...result}));
  if(result.errors?.length) process.exitCode=1;
 } else throw new Error('Use: node scripts/discovery.mjs status|run');
} catch(error) {
 const code=error.cause?.code ?? error.code;
 console.error(JSON.stringify({at:new Date().toISOString(),ok:false,error:error.message,code,...(code==='ENOTFOUND'?{next:'Open the configured Supabase project dashboard and check whether it needs to be restored.'}:{})}));
 process.exitCode=1;
}
