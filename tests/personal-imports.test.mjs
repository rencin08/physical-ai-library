import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseArxivId,paperFromArxiv} from '../lib/imports/arxiv.ts';
import {fetchArxivPaper} from '../lib/imports/fetch-arxiv.ts';
import {addPersonalPaper,getPersonalPapers} from '../lib/imports/store.ts';
import {buildDiscoveryProfile,personalizedArxivQuery,discoveryReason,validateDiscoveryProfile} from '../lib/discovery-profile.ts';
import {findLibraryServer} from '../scripts/discovery-server.mjs';
const result={id:'2609.12345v2',title:'A robot world model',abstract:'A world model for dexterous robot manipulation.',authors:['A. Researcher'],published:'2026-09-20T00:00:00Z',url:'https://arxiv.org/abs/2609.12345v2',pdfUrl:'https://arxiv.org/pdf/2609.12345v2'};
test('import IDs accept arXiv formats and cannot become arbitrary URLs or paths',()=>{
 for(const input of ['2609.12345v2','arXiv:2609.12345v2','https://arxiv.org/abs/2609.12345v2','https://arxiv.org/pdf/2609.12345v2.pdf'])assert.equal(parseArxivId(input),'2609.12345v2');
 assert.equal(parseArxivId('https://arxiv.org/abs/hep-th/9901001'),'hep-th/9901001');
 for(const input of ['https://evil.test/abs/2609.12345','https://arxiv.org.evil.test/abs/2609.12345','https://me@arxiv.org/abs/2609.12345','../../secret','https://arxiv.org:1234/abs/2609.12345','2609.12345v0'])assert.throws(()=>parseArxivId(input));
});
test('metadata is fetched by ID from arXiv and the returned identity is checked',async()=>{
 let requested;
 const fetcher=async url=>{requested=url;return new Response(`<?xml version="1.0"?><feed><opensearch:totalResults>1</opensearch:totalResults><entry><id>${result.url}</id><title>${result.title}</title><summary>${result.abstract}</summary><published>${result.published}</published><author><name>A. Researcher</name></author></entry></feed>`);};
 assert.equal((await fetchArxivPaper('2609.12345v2',fetcher)).id,result.id);
 assert.equal(new URL(requested).hostname,'export.arxiv.org');assert.equal(new URL(requested).searchParams.get('id_list'),result.id);
 await assert.rejects(fetchArxivPaper('2609.99999',fetcher),/No paper/);
});
test('concurrent imports preserve both papers and deduplicate arXiv versions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'library-import-test-'));const previous=process.env.LIBRARY_PERSONAL_DIRECTORY;process.env.LIBRARY_PERSONAL_DIRECTORY=dir;
 try{
  const first=paperFromArxiv(result),second=paperFromArxiv({...result,id:'2609.67890v1'});
  await Promise.all([addPersonalPaper(first),addPersonalPaper(second),addPersonalPaper({...first,title:'Duplicate should not replace title'})]);
  const stored=await getPersonalPapers();assert.equal(stored.length,2);assert.equal(stored[0].title,first.title);
  assert.equal((await addPersonalPaper({...first,arxivId:first.arxivId+'v3'})).existing,true);
  await writeFile(join(dir,'imports.json'),'damaged');await assert.rejects(addPersonalPaper(second));assert.equal(await readFile(join(dir,'imports.json'),'utf8'),'damaged');
 }finally{if(previous===undefined)delete process.env.LIBRARY_PERSONAL_DIRECTORY;else process.env.LIBRARY_PERSONAL_DIRECTORY=previous;await rm(dir,{recursive:true,force:true});}
});
test('fresh discovery uses explicit signals and never serializes notes or incidental reads',()=>{
 const paper=paperFromArxiv(result),record={paper,saved:true,status:'reading',learned:'private secret',annotations:[{note:'private note'}]};
 const state={version:1,records:{[paper.slug]:record},preferences:{interests:['VLA'],feedback:{},useReadingHistory:true}};
 const profile=buildDiscoveryProfile(state,[paper]);assert.ok(profile.topics.some(t=>t.topic==='World Models'));assert.ok(profile.excludedIds.includes(paper.arxivId));assert.doesNotMatch(JSON.stringify(profile),/private secret|private note|annotations/);
 const query=personalizedArxivQuery(profile);assert.match(query,/world model/);assert.match(query,/vision-language-action/);
 assert.match(discoveryReason('A new world model','robotics',profile).reason,/saved/);
 state.preferences.useReadingHistory=false;assert.deepEqual(buildDiscoveryProfile(state,[paper]).topics.map(t=>t.topic),['VLA']);
 state.preferences.interests=[];assert.equal(buildDiscoveryProfile(state,[paper]).topics.length,0);
 state.preferences.useReadingHistory=true;record.saved=false;assert.equal(buildDiscoveryProfile(state,[paper]).topics.length,0);
 assert.throws(()=>validateDiscoveryProfile({topics:[{topic:'x',weight:NaN,reason:'x'}],excludedIds:[]}));
});
test('discovery finds the current library port and never sends credentials to unrelated servers',async()=>{
 const calls=[];const fetcher=async url=>{calls.push(url);if(url.startsWith('http://localhost:3000'))throw new Error('old port hung');return Response.json({app:'physical-ai-library'});};
 assert.equal(await findLibraryServer({preferred:'http://localhost:3000',remembered:'http://localhost:3001',fetcher}),'http://localhost:3001');assert.equal(calls.length,2);
 calls.length=0;await findLibraryServer({preferred:'https://external.test',fetcher});assert.ok(calls.every(url=>url.startsWith('http://localhost:')));
 await assert.rejects(findLibraryServer({fetcher:async()=>Response.json({app:'other-app'})}),/No responding library/);
});
