// Run only after inspecting draft figure crops and the generated chapter explanations.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateGuide} from './guide-generation/library.mjs';
const slug=process.argv.find(a=>a.startsWith('--slug='))?.slice(7);
if(!slug||!/^[a-z0-9-]+$/.test(slug)||!process.argv.includes('--reviewed'))throw new Error('Use --slug=<slug> --reviewed after checking every selected figure and chapter.');
const dir=`.guide-drafts/library/${slug}`;
const source=JSON.parse(await readFile(`${dir}/source.json`,'utf8'));
const entry=JSON.parse(await readFile(`${dir}/validated.json`,'utf8'));
if(!source.figures)throw new Error('Original figures must be prepared first.');
if(entry.sourceSha256!==source.sha256||createHash('sha256').update(await readFile(`${dir}/paper.pdf`)).digest('hex')!==source.sha256)throw new Error('Source version changed; prepare and review again.');
validateGuide(entry.guide,source);
const figures=[];
for(const chapter of entry.guide.chapters)for(const id of chapter.figureIds){
 const figure=source.figures.find(f=>f.id===id);
 if(figure.sourceSha256!==source.sha256||!/^figure-[\da-zA-Z]+\.png$/.test(figure.asset))throw new Error('Invalid figure provenance or asset path.');
 const image=await readFile(`${dir}/figures/${figure.asset}`);
 if(image.subarray(1,4).toString()!=='PNG')throw new Error('Figure is not PNG.');
 figures.push({...figure,src:`/paper-figures/${slug}/${figure.asset}`,reading:chapter.figureReading});
}
const guides=JSON.parse(await readFile('lib/learning/reviewed/library-guides.json','utf8'));
const visuals=JSON.parse(await readFile('lib/learning/reviewed/paper-figures.json','utf8'));
const output=`public/paper-figures/${slug}`;await mkdir(output,{recursive:true});
for(const f of figures)await copyFile(`${dir}/figures/${f.asset}`,`${output}/${f.asset}`);
visuals[slug]={sourceSha256:source.sha256,figures,chapters:entry.guide.chapters.map(c=>c.figureIds),fallbackReasons:entry.guide.chapters.map(c=>c.figureFallbackReason)};
guides[slug]=entry;
await writeFile(`${output}/figures.json`,JSON.stringify(figures,null,2)+'\n');
await writeFile('lib/learning/reviewed/paper-figures.json',JSON.stringify(visuals,null,2)+'\n');
await writeFile('lib/learning/reviewed/library-guides.json',JSON.stringify(guides,null,2)+'\n');
console.log(`Integrated ${slug} with ${figures.length} original figures. Run guide:figures:check and the reader checks before publication.`);
