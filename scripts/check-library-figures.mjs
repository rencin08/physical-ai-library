import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const guides=JSON.parse(readFileSync('lib/learning/reviewed/library-guides.json'));
const visuals=JSON.parse(readFileSync('lib/learning/reviewed/paper-figures.json'));
let count=0,fallbacks=0;
for(const [slug,guide] of Object.entries(guides)){
 const entry=visuals[slug];
 if(!entry||entry.sourceSha256!==guide.sourceSha256||entry.chapters.length!==5)throw new Error(`${slug}: missing or stale figures`);
 const used=new Set();
 for(const [i,ids] of entry.chapters.entries()){
  if(!ids.length){if(!entry.fallbackReasons[i])throw new Error(`${slug}: silent diagram fallback`);fallbacks++;}
  for(const id of ids){
   const figure=entry.figures.find(f=>f.id===id);
   if(!figure||used.has(id))throw new Error(`${slug}: missing/repeated ${id}`);
   used.add(id);
   if(figure.sourceSha256!==guide.sourceSha256||figure.source!==guide.source||!figure.caption||!figure.attribution||!figure.reuse||figure.page<1)throw new Error(`${slug}: invalid provenance`);
   const bytes=readFileSync(`public${figure.src}`);
   if(bytes.subarray(1,4).toString()!=='PNG'||bytes.readUInt32BE(16)<150||bytes.readUInt32BE(20)<70)throw new Error(`${slug}: invalid image`);
   count++;
  }
 }
 const pdf=`.guide-drafts/library/${slug}/paper.pdf`;
 if(existsSync(pdf)&&createHash('sha256').update(readFileSync(pdf)).digest('hex')!==entry.sourceSha256)throw new Error(`${slug}: source PDF changed`);
}
console.log(`Verified ${count} original figures across ${Object.keys(guides).length} guides; ${fallbacks} explicit chapter fallback(s). DROID and FAST retain their bespoke originals.`);
