"""Backfill the reviewed library's figures from cached exact-version PDFs."""
import importlib.util,json,pathlib,concurrent.futures
root=pathlib.Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('extractor',root/'scripts/guide-generation/extract-figures.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
guides=json.loads((root/'lib/learning/reviewed/library-guides.json').read_text())
readings=json.loads((root/'scripts/guide-generation/figure-reading-notes.json').read_text())
assignments=json.loads((root/'scripts/guide-generation/figure-assignments.json').read_text())
def prepare(slug):
 entry=guides[slug];out=root/'public/paper-figures'/slug
 figs=mod.extract(root/'.guide-drafts/library'/slug/'paper.pdf',out,entry['source'],set(filter(None,assignments[slug])))
 by_number={f['number']:f for f in figs}
 missing=set(filter(None,assignments[slug]))-by_number.keys()
 if missing:raise ValueError(f'{slug}: missing {missing}')
 for f in figs:
  if f['sourceSha256']!=entry['sourceSha256']:raise ValueError(f'{slug}: source hash mismatch')
  f['src']=f'/paper-figures/{slug}/{f["asset"]}'
  if f['number'] in readings.get(slug,{}):f['reading']=readings[slug][f['number']]
  image=out/f['asset']
  with image.open('rb') as stream:
   header=stream.read(24)
  f['width']=int.from_bytes(header[16:20],'big');f['height']=int.from_bytes(header[20:24],'big')
 result={'sourceSha256':entry['sourceSha256'],'figures':figs,'chapters':[[f'figure-{n}'] if n else [] for n in assignments[slug]],'fallbackReasons':['' if n else 'The paper combines its architecture with Figure 1, already shown in the overview. This supplementary diagram explains the method without repeating that figure.' for n in assignments[slug]]}
 (out/'figures.json').write_text(json.dumps(figs,ensure_ascii=False,indent=2)+'\n')
 print('EXTRACTED',slug,len(figs),flush=True)
 return slug,result
if __name__=='__main__':
 # PyMuPDF is not thread safe. Separate processes own separate documents.
 with concurrent.futures.ProcessPoolExecutor(max_workers=3) as pool:
  result=json.loads((root/'lib/learning/reviewed/paper-figures.json').read_text())
  result.update(dict(pool.map(prepare,assignments)))
 (root/'lib/learning/reviewed/paper-figures.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
