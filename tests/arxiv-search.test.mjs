import {test} from 'node:test';
import assert from 'node:assert/strict';
import {arxivQuery,parseArxivSearch} from '../lib/arxiv-search.ts';
const feed=(entry,total=21)=>`<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/"><opensearch:totalResults>${total}</opensearch:totalResults>${entry}</feed>`;
const entry='<entry><id>http://arxiv.org/abs/2609.12345v1</id><title>A &amp; B</title><summary>Original abstract</summary><author><name>Someone</name></author><published>2026-09-22T00:00:00Z</published></entry>';
test('plain search terms cannot inject arXiv operators',()=>{
 assert.equal(arxivQuery('world model'),'all:"world" AND all:"model"');
 assert.equal(arxivQuery('cat:physics OR robot'),'all:"cat" AND all:"physics" AND all:"OR" AND all:"robot"');
 assert.equal(arxivQuery('"world model" robot'),'all:"world model" AND all:"robot"');
 assert.throws(()=>arxivQuery('"():'),/Enter/);
});
test('Atom parsing handles singleton entries, counts, pagination and canonical safe links',()=>{
 const data=parseArxivSearch(feed(entry),0);
 assert.equal(data.total,21);assert.equal(data.nextStart,1);assert.equal(data.papers[0].title,'A & B');
 assert.equal(data.papers[0].url,'https://arxiv.org/abs/2609.12345v1');
 assert.deepEqual(data.papers[0].authors,['Someone']);
 assert.equal(parseArxivSearch(feed(entry,21),20).nextStart,null);
 assert.deepEqual(parseArxivSearch(feed('',0),0).papers,[]);
 assert.throws(()=>parseArxivSearch('<html>Service unavailable</html>',0));
 assert.throws(()=>parseArxivSearch(feed(entry.replace('http://arxiv.org/abs/2609.12345v1','https://evil.example/paper')),0));
});
