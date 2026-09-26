import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalArxivId,mergeEnrichmentResults,ingestionOptions} from '../lib/backend/ingest-utils.ts';
test('arXiv versions and URLs converge on one identity',()=>{
 for(const value of ['2501.09747v1','2501.09747v3','https://arxiv.org/abs/2501.09747v3','https://arxiv.org/pdf/2501.09747v3.pdf'])assert.equal(canonicalArxivId(value),'2501.09747');
 assert.equal(canonicalArxivId('hep-th/9901001v2'),'hep-th/9901001');
 assert.throws(()=>canonicalArxivId('https://example.com/2501.09747'));
 assert.throws(()=>canonicalArxivId('2501.09747,status.eq.published'));
});
test('one provider failure retains the other enrichment',()=>{
 const result=mergeEnrichmentResults([{status:'fulfilled',value:{citationCount:42}},{status:'rejected',reason:new Error('GitHub returned 429')}]);
 assert.deepEqual(result.values,{citationCount:42});assert.deepEqual(result.errors,['GitHub returned 429']);
});
test('ingestion honors zero enrichment and bounds malformed request options',()=>{
 assert.equal(ingestionOptions({enrichLimit:0}).enrichLimit,0);
 assert.deepEqual(ingestionOptions({maxResults:-8,enrichLimit:Infinity,includeFeeds:false}),{maxResults:1,enrichLimit:12,includeFeeds:false});
 assert.equal(ingestionOptions({maxResults:999}).maxResults,100);
 assert.equal(ingestionOptions(null).maxResults,50);
});
