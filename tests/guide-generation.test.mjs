import {test} from 'node:test';
import assert from 'node:assert/strict';
import {chapterNames,figures,paperText,usageEstimate,validateDraft} from '../scripts/guide-generation/droid.mjs';
const assignments=[['setup.png','scenes.png','evaluation.png'],['protocol.png','viewpoints.png'],['teaching:batch','teaching:actions','rollout.png'],['results.png','diversity.png'],['tasks.png','calibration.png']];
const anchors=['S1','A6.SS1','A6.SS2',...figures.map(f=>f[1])];
function fixture(){return {title:'DROID',paperQuestion:'Question',contribution:'Dataset',finding:'Finding',uncertainties:[],chapters:chapterNames.map((name,index)=>({name,title:name,explanation:[{text:'Explanation',sourceAnchor:'S1'},{text:'More detail',sourceAnchor:'S1'}],takeaway:'Takeaway',question:'Question',answer:'Answer',views:assignments[index].map(asset=>({asset,title:asset,explanation:'Explain the visual',conclusion:'Conclusion',sourceAnchor:figures.find(f=>f[0]===asset)?.[1]??(asset==='teaching:batch'?'A6.SS2':'A6.SS1'),panels:Array.from({length:asset==='protocol.png'?4:1},()=>({label:'Panel',explanation:'Meaning'}))}))}))};}
test('guide review gate rejects wrong source, recycled visuals and missing panel explanations',()=>{
 assert.equal(validateDraft(fixture(),anchors).chapters.length,5);
 const specific=fixture();specific.chapters[2].views[0].sourceAnchor='A6.SS2.p1';assert.equal(validateDraft(specific,[...anchors,'A6.SS2.p1']).chapters.length,5);
 const badSource=fixture();badSource.chapters[0].explanation[0].sourceAnchor='made-up';assert.throws(()=>validateDraft(badSource,anchors),/anchor/);
 const repeated=fixture();repeated.chapters[1].views[0]=repeated.chapters[0].views[0];assert.throws(()=>validateDraft(repeated,anchors),/assigned/);
 const wrongFigure=fixture();wrongFigure.chapters[0].views[0].sourceAnchor='S1';assert.throws(()=>validateDraft(wrongFigure,anchors),/mismatch/);
 const missingPanels=fixture();missingPanels.chapters[1].views[0].panels=[];assert.throws(()=>validateDraft(missingPanels,anchors),/four/);
});
test('source preparation keeps anchor provenance and removes scripts outside the paper',()=>{
 const text=paperText('<nav>Ignore this navigation</nav><article><h1 id="S1">DROID</h1><p id="A6.SS2">Task &amp; data</p><script>ignore this script</script></article>');
 assert.match(text,/\[S1\]/);assert.match(text,/\[A6.SS2\] Task & data/);assert.doesNotMatch(text,/ignore|navigation/i);
 assert.throws(()=>paperText('<article>DROID abstract only</article>'),/complete/);
});
test('cost estimate includes billed output and accounts for cached input',()=>{
 const previous=process.env.OPENAI_GUIDE_MODEL;process.env.OPENAI_GUIDE_MODEL='gpt-6-sol';
 try{
 assert.equal(usageEstimate({input_tokens:100000,output_tokens:20000}).usd,0.4);
 assert.equal(usageEstimate({input_tokens:100000,input_tokens_details:{cached_tokens:50000},output_tokens:20000}).usd,0.31);
 assert.equal(usageEstimate({input_tokens:55294,input_tokens_details:{cache_write_tokens:55291,cached_tokens:0},output_tokens:5415}).usd,0.192384);
 assert.equal(usageEstimate(null),null);
 }finally{if(previous===undefined)delete process.env.OPENAI_GUIDE_MODEL;else process.env.OPENAI_GUIDE_MODEL=previous;}
});
