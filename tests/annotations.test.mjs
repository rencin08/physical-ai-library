import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAnchor, validAnnotation } from '../lib/annotations.ts';
import { emptyReadingState, updateRecord, parseReadingState } from '../lib/reading-state.ts';
const annotation={id:'note-1',chapter:0,surface:'left',start:6,end:11,quote:'paper',prefix:'First ',suffix:' matters',note:'Why this matters',createdAt:'2026-09-23T12:00:00Z',updatedAt:'2026-09-23T12:00:00Z'};
test('anchors restore their original text and recover after inserted content',()=>{
 assert.deepEqual(resolveAnchor('First paper matters',annotation),{start:6,end:11});
 assert.deepEqual(resolveAnchor('New. First paper matters',annotation),{start:11,end:16});
 assert.equal(resolveAnchor('The quoted text was removed',annotation),null);
});
test('ambiguous repeated passages are not silently attached to the wrong text',()=>{
 assert.equal(resolveAnchor('paper and paper',{...annotation,start:100,end:105,prefix:'',suffix:''}),null);
 assert.deepEqual(resolveAnchor('paper and First paper matters',{...annotation,start:100,end:105}),{start:16,end:21});
});
test('annotation schema rejects malformed anchors and overlong notes',()=>{
 assert.equal(validAnnotation(annotation),true);
 for(const value of [{...annotation,end:10},{...annotation,start:-1},{...annotation,note:'x'.repeat(20001)},{...annotation,surface:'pdf'},{...annotation,quote:''}]) assert.equal(validAnnotation(value),false);
});
test('annotation backups survive reading changes and malformed imports are rejected',()=>{
 const paper={slug:'test-paper',arxivId:'2401.00001',title:'Paper',shortTitle:'Paper',authors:'Author',institution:'Lab',year:2024,summary:'',why:'',topics:[],accent:'blue',architecture:'',task:'',embodiments:'',modalities:'',dataset:'',openSource:false,contributions:[],limitations:[],lineage:[]};
 let state=updateRecord(emptyReadingState(),paper,{annotations:[annotation]});
 state=updateRecord(state,paper,{saved:true,chapter:2});
 assert.deepEqual(parseReadingState(JSON.stringify(state)).records[paper.slug].annotations,[annotation]);
 state.records[paper.slug].annotations=[{...annotation,start:-1}];
 assert.throws(()=>parseReadingState(JSON.stringify(state)),/invalid annotations/);
});
