// Refresh public citation metadata only. Never reads or uploads reading records.
import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const added = JSON.parse(await readFile(new URL('lib/curation/reading-papers.json', root), 'utf8'));
const data = await readFile(new URL('lib/data.ts', root), 'utf8');
const ids = [...new Set([...data.matchAll(/arxivId: "([\d.]+)"/g)].map(match => match[1]).concat(added.map(paper => paper.arxivId)))];
const destination = new URL('lib/curation/citations.json', root);
const previous = JSON.parse(await readFile(destination, 'utf8'));
const headers = { 'Content-Type': 'application/json' };
if (process.env.SEMANTIC_SCHOLAR_API_KEY) headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
const response = await fetch('https://api.semanticscholar.org/graph/v1/paper/batch?fields=externalIds,citationCount,url', {
  method: 'POST', headers, body: JSON.stringify({ ids: ids.map(id => `ARXIV:${id}`) }), signal: AbortSignal.timeout(20000)
});
if (!response.ok) throw new Error(`Semantic Scholar returned ${response.status}; existing snapshot left intact.`);
const rows = await response.json();
if (!Array.isArray(rows)) throw new Error('Unexpected response; existing snapshot left intact.');
let count = 0;
for (const row of rows) {
  const id = row?.externalIds?.ArXiv;
  if (!ids.includes(id) || !Number.isSafeInteger(row.citationCount) || row.citationCount < 0 || !/^https:\/\/www\.semanticscholar\.org\/paper\/[a-f0-9]+$/.test(row.url)) continue;
  previous[id] = { count: row.citationCount, url: row.url, retrievedAt: new Date().toISOString() };
  count++;
}
if (!count) throw new Error('No verified counts returned; existing snapshot left intact.');
await writeFile(destination, JSON.stringify(previous, null, 2) + '\n');
console.log(`Updated citation snapshots for ${count}/${ids.length} papers. Unavailable records retain their previous retrieval dates.`);
