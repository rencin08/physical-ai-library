import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommendPapers, defaultPreferences } from '../lib/recommendations.ts';
import { emptyReadingState, updateRecord, parseReadingState, mergeReadingStates } from '../lib/reading-state.ts';
const make = (slug, topics) => ({ slug, topics, arxivId:'2401.00001', title:slug, shortTitle:slug, authors:'Author', institution:'Lab', year:2024, summary:'', why:'', accent:'blue', architecture:'', task:'', embodiments:'', modalities:'', dataset:'', openSource:false, contributions:[], limitations:[], lineage:[] });
const papers = [make('robot', ['Robotics']), make('world', ['World Models']), make('world-two', ['World Models'])];
test('cold start preserves catalog order; explicit interests prioritize and explain matches', () => {
 const state = emptyReadingState();
 assert.deepEqual(recommendPapers(papers,state,defaultPreferences()).map(x=>x.paper.slug), papers.map(x=>x.slug));
 const result = recommendPapers(papers,state,{...defaultPreferences(),interests:['world models']});
 assert.equal(result[0].paper.slug,'world');
 assert.match(result[0].reason,/interest in World Models/);
});
test('bookmarks and finished papers are signals; incidental visits and note text are not', () => {
 let state=updateRecord(emptyReadingState(),papers[1],{lastOpenedAt:new Date().toISOString(), learned:'Robotics',status:'reading'});
 assert.equal(recommendPapers(papers,state,defaultPreferences())[0].paper.slug,'robot');
 state=updateRecord(state,papers[1],{saved:true});
 assert.equal(recommendPapers(papers,state,defaultPreferences())[0].paper.slug,'world-two');
 assert.match(recommendPapers(papers,state,defaultPreferences())[0].reason,/saved world/);
 state=updateRecord(state,papers[1],{status:'completed',saved:false});
 const result=recommendPapers(papers,state,defaultPreferences());
 assert.match(result[0].reason,/finished world/);
 assert.equal(result.at(-1).paper.slug,'world');
 assert.equal(recommendPapers(papers,state,{...defaultPreferences(),useReadingHistory:false})[0].paper.slug,'robot');
});
test('explicit feedback ranks similar papers, hides dismissed papers and handles an empty shelf', () => {
 const prefs={...defaultPreferences(),feedback:{world:'more'}};
 assert.equal(recommendPapers(papers,emptyReadingState(),prefs)[0].paper.slug,'world-two');
 prefs.feedback={world:'less'};
 assert.ok(!recommendPapers(papers,emptyReadingState(),prefs).some(x=>x.paper.slug==='world'));
 prefs.feedback=Object.fromEntries(papers.map(p=>[p.slug,'less']));
 assert.equal(recommendPapers(papers,emptyReadingState(),prefs).length,0);
});
test('preferences survive reading updates and backups; old backups remain valid', () => {
 const old=emptyReadingState();
 assert.deepEqual(parseReadingState(JSON.stringify(old)).records, Object.create(null));
 const prefs={interests:['World Models'],feedback:{world:'more'},useReadingHistory:false};
 const next=updateRecord({...old,preferences:prefs},papers[0],{saved:true});
 assert.deepEqual(next.preferences,prefs);
 assert.deepEqual(parseReadingState(JSON.stringify(next)).preferences,prefs);
 assert.deepEqual(mergeReadingStates(old,next).preferences,prefs);
 assert.throws(()=>parseReadingState(JSON.stringify({...old,preferences:{...prefs,feedback:{world:'unknown'}}})));
});

test('editorial first reads beat raw popularity but explicit interests beat editorial order', () => {
 const starter={...make('survey',['Surveys']),arxivId:'2312.08782'};
 const popular={...make('popular',['Robotics']),citationCount:10000000};
 let result=recommendPapers([popular,starter],emptyReadingState(),defaultPreferences());
 assert.equal(result[0].paper.slug,'survey');
 assert.match(result[0].reason,/Suggested first reads/);
 result=recommendPapers([popular,starter],emptyReadingState(),{...defaultPreferences(),interests:['Robotics']});
 assert.equal(result[0].paper.slug,'popular');
});
