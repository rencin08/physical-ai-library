import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {loadEnvFile} from 'node:process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {prepare,validateDraft,usageEstimate,sourceUrl,model} from './guide-generation/droid.mjs';
const root=new URL('../',import.meta.url);
try{loadEnvFile(fileURLToPath(new URL('.env.local',root)));}catch(error){if(error.code!=='ENOENT')throw error;}
const args=process.argv.slice(2);
try {
 if(args.length!==1||!['--prepare','--generate'].includes(args[0]))throw new Error('Use npm run guide:droid:prepare (free) or npm run guide:droid:generate (one paid request).');
 if(args[0]==='--generate'&&!process.env.OPENAI_GUIDE_MODEL)throw new Error('Set OPENAI_GUIDE_MODEL to a compatible model available to your account');
 const generate=args[0]==='--generate';
 if(generate&&!process.env.OPENAI_API_KEY)throw new Error('Set OPENAI_API_KEY in the project .env.local. No generation request was sent.');
 const folder=fileURLToPath(new URL('.guide-drafts/droid/',root));
 await mkdir(folder,{recursive:true});
 const sourcePath=join(folder,'paper-v2.html');
 let html;
 try{html=await readFile(sourcePath,'utf8');}catch(error){
  if(error.code!=='ENOENT')throw error;
  const response=await fetch(sourceUrl,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error(`Paper download returned HTTP ${response.status}.`);
  html=await response.text();
  await writeFile(sourcePath,html,{flag:'wx'});
 }
 const standard=await readFile(new URL('READING_GUIDE_STANDARD.md',root),'utf8');
 const packet=await prepare(root,html,standard);
 await writeFile(join(folder,'prepared-manifest.json'),JSON.stringify({model,preparedAt:new Date().toISOString(),...packet.manifest},null,2));
 if(!generate){console.log(JSON.stringify({prepared:true,model,source:sourceUrl,figures:packet.manifest.assets.length,apiCalls:0,apiKeyConfigured:Boolean(process.env.OPENAI_API_KEY)}));}
 else {
  const runFolder=await mkdtemp(join(folder,'run-'));
  // Persist the exact request before submission. It contains public paper data, never the API key.
  await writeFile(join(runFolder,'request.json'),JSON.stringify(packet.request));
  // Deliberately no retries: a timeout may still have incurred usage.
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(packet.request),signal:AbortSignal.timeout(300000)});
  if(!response.ok)throw new Error(`OpenAI returned HTTP ${response.status}; no automatic retry. Existing guide unchanged.`);
  const result=await response.json();
  const report={responseId:result.id,model:result.model,usage:result.usage,estimatedCost:usageEstimate(result.usage),status:result.status,createdAt:new Date().toISOString(),source:packet.manifest};
  await writeFile(join(runFolder,'usage.json'),JSON.stringify(report,null,2));
  await writeFile(join(runFolder,'response.json'),JSON.stringify(result,null,2));
  if(result.status!=='completed')throw new Error(`Generation status: ${result.status}. Response and usage saved in ${runFolder}; existing guide unchanged.`);
  const text=result.output?.filter(item=>item.type==='message').flatMap(item=>item.content??[]).filter(item=>item.type==='output_text').map(item=>item.text).join('');
  if(!text)throw new Error('No guide text returned; inspect the saved response.');
  const draft=validateDraft(JSON.parse(text),packet.manifest.anchors);
  const output=join(runFolder,'draft.json');
  await writeFile(output,JSON.stringify({status:'needs_editorial_review',...report,guide:draft},null,2));
  console.log(JSON.stringify({draft:output,model:result.model,usage:result.usage,estimatedCost:report.estimatedCost,published:false}));
 }
}catch(error){console.error(error instanceof Error?error.message:'Guide generation failed.');process.exitCode=1;}
