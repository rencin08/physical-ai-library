import {existsSync,readFileSync} from 'node:fs';
import ts from 'typescript';
export function guideCatalog({includePersonal=true}={}){
 const source=readFileSync(new URL('../../lib/data.ts',import.meta.url),'utf8');
 const declaration=source.slice(source.indexOf('const examplePapers'),source.indexOf('export const guidedPaperSlugs'));
 const js=ts.transpile(declaration, {target:ts.ScriptTarget.ES2020});
 const originals=new Function(`${js}; return examplePapers;`)();
 const personalPath=`${process.env.LIBRARY_PERSONAL_DIRECTORY||'.library'}/imports.json`;
 const personal=includePersonal&&existsSync(personalPath)?JSON.parse(readFileSync(personalPath,'utf8')):[];
 return [...personal,...originals,...['reading-papers','recent-papers','milestone-papers'].flatMap(name=>JSON.parse(readFileSync(new URL(`../../lib/curation/${name}.json`,import.meta.url))))];
}
