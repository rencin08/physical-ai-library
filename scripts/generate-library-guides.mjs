import {readFile,writeFile,readdir} from 'node:fs/promises';
import {loadEnvFile} from 'node:process';
import {guideCatalog} from './guide-generation/catalog.mjs';
import {schema,instructions,validateGuide} from './guide-generation/library.mjs';
import {usageEstimate} from './guide-generation/droid.mjs';
try{loadEnvFile('.env.local');}catch(error){if(error.code!=='ENOENT')throw error;}
if(!process.env.OPENAI_GUIDE_MODEL)throw new Error('Set OPENAI_GUIDE_MODEL to a compatible model available to your account');
if(!process.env.OPENAI_API_KEY)throw new Error('API key not configured');
if(!process.argv.includes('--generate'))throw new Error('Explicit --generate required');
const requested=process.argv.find(a=>a.startsWith('--slug='))?.slice(7);
const catalog=guideCatalog().filter(p=>!['droid-robot-manipulation-dataset','fast-action-tokenization'].includes(p.slug)&&(!requested||p.slug===requested));
async function generate(p){
 const dir=`.guide-drafts/library/${p.slug}`;
 try{
  const names=await readdir(dir);
  if(names.includes('request.json')){if(requested&&!names.includes('validated.json'))throw new Error('An earlier AI request exists without a validated draft. Review its saved output before retrying; no new paid request was sent.');console.log('SKIP_EXISTING_REQUEST',p.slug);return;}
  const source=JSON.parse(await readFile(`${dir}/source.json`,'utf8'));
  if(!source.figures)throw new Error('Run guide:library:prepare to extract original figures first');
  if(source.figures.length>30)throw new Error('More than 30 figures: curate source.figures before generation');
  const figureInputs=[];
  for(const figure of source.figures){
    figureInputs.push({type:'input_text',text:`Original ${figure.id}, PDF page ${figure.page}: ${figure.caption}`});
    figureInputs.push({type:'input_image',image_url:`data:image/png;base64,${(await readFile(`${dir}/figures/${figure.asset}`)).toString('base64')}`});
  }
  const text=source.pages.map(p=>`[PDF PAGE ${p.page}]\n${p.text}`).join('\n\n');
  if(text.length>650000)throw new Error('Paper too long for this batch; requires chunked review');
  const request={model:process.env.OPENAI_GUIDE_MODEL,store:false,reasoning:{effort:'medium'},max_output_tokens:12000,instructions,input:[{role:'user',content:[{type:'input_text',text:`Requested paper: ${p.title}\nSource: ${source.url}\n<paper>\n${text}\n</paper>`},...figureInputs]}],text:{format:{type:'json_schema',name:'paper_learning_guide',strict:true,schema}}};
  await writeFile(`${dir}/request.json`,JSON.stringify(request));
  console.log('GENERATING',p.slug);
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(request),signal:AbortSignal.timeout(300000)});
  if(!response.ok)throw new Error(`API HTTP ${response.status}: ${(await response.text()).slice(0,300)}`);
  const result=await response.json();await writeFile(`${dir}/response.json`,JSON.stringify(result));
  await writeFile(`${dir}/usage.json`,JSON.stringify({usage:result.usage,model:result.model,estimatedCost:usageEstimate(result.usage)}));
  if(result.status!=='completed')throw new Error(`Response ${result.status}`);
  const output=result.output.filter(i=>i.type==='message').flatMap(i=>i.content??[]).filter(i=>i.type==='output_text').map(i=>i.text).join('');
  const guide=JSON.parse(output);await writeFile(`${dir}/draft.json`,JSON.stringify(guide,null,2));
  validateGuide(guide,source);
  await writeFile(`${dir}/validated.json`,JSON.stringify({slug:p.slug,source:source.url,sourceSha256:source.sha256,generatedAt:new Date().toISOString(),guide},null,2));
  console.log('VALIDATED',p.slug,usageEstimate(result.usage)?.usd);
 }catch(error){console.log('FAILED',p.slug,error.message);if(requested)process.exitCode=1;}
}

let next=0; await Promise.all(Array.from({length:3},async()=>{while(next<catalog.length){const p=catalog[next++];await generate(p);}}));
