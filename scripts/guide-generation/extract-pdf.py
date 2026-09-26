import pymupdf as fitz
import json,sys
pdf=fitz.open(sys.argv[1])
pages=[{'page':i+1,'text':p.get_text(sort=False)} for i,p in enumerate(pdf)]
if sum(len(p['text']) for p in pages)<3000: raise ValueError('Insufficient paper text')
print(json.dumps({'pages':pages,'pageCount':len(pages)}))
