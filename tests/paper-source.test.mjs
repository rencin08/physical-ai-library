import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paperSource } from '../lib/paper-source.ts';

test('missing and malformed IDs never create an arXiv link', () => {
  for (const arxivId of ['', ' ', 'undefined', 'not-an-id']) {
    assert.deepEqual(paperSource({ arxivId }), { pdfUrl: undefined, sourceUrl: undefined, arxivId: undefined });
  }
});
test('author PDF and source links work without an arXiv ID', () => {
  const paper = { arxivId: '', pdfUrl: 'https://www.pi.website/download/Mem.pdf', sourceUrl: 'https://www.pi.website/research/memory' };
  assert.equal(paperSource(paper).pdfUrl, paper.pdfUrl);
  assert.equal(paperSource(paper).sourceUrl, paper.sourceUrl);
  assert.equal(paperSource({ arxivId: '', sourceUrl: paper.sourceUrl }).pdfUrl, undefined);
});
test('arXiv papers and versioned guides still resolve to PDFs', () => {
  assert.equal(paperSource({ arxivId: '2403.12945', pdfUrl: '' }).pdfUrl, 'https://arxiv.org/pdf/2403.12945');
  assert.equal(paperSource({ arxivId: '2403.12945' }, 'https://arxiv.org/html/2403.12945v2').pdfUrl, 'https://arxiv.org/pdf/2403.12945v2');
});
