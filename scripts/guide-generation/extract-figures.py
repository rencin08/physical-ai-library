"""Extract caption-indexed original figure crops from a source PDF; never redraw figures.
Draft crops require visual review before their IDs are assigned to reader chapters.
"""
import argparse, hashlib, json, pathlib, re
import pymupdf as fitz

CAPTION = re.compile(r'^(?:Figure|Fig\.)\s*(\d+[a-zA-Z]?)\s*(?:[:.|∣]\s*|(?=[A-Z(]))')

def extract(pdf_path, output, source, selected=None):
    pdf_path, output = pathlib.Path(pdf_path), pathlib.Path(output)
    output.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    overrides = json.loads(pathlib.Path(__file__).with_name('figure-crop-overrides.json').read_text()).get(pdf_path.parent.name, {})
    figures, seen = [], set()
    for index, page in enumerate(doc):
        blocks = page.get_text('blocks', flags=0)
        captions = [(b, CAPTION.match(b[4].strip())) for b in blocks if CAPTION.match(b[4].strip())]
        for block, match in captions:
            number = match.group(1)
            if number in seen or (selected is not None and number not in selected):
                continue
            seen.add(number)
            # Match caption column; wide captions imply a full-width figure.
            left, right = (max(20, block[0]-3), min(page.rect.width-20, block[2]+3))
            if right-left > page.rect.width*.6:
                left, right = 35, page.rect.width-35
            elif block[0] < page.rect.width/2:
                left, right = 35, page.rect.width/2-5
            else:
                left, right = page.rect.width/2+5, page.rect.width-35
            top = 32
            for other in blocks:
                if other[3] >= block[1]-5 or other[2] < left or other[0] > right:
                    continue
                text = other[4].strip()
                # Previous paragraphs/captions bound the figure from above.
                if (len(text)>160 and other[2]-other[0] > (right-left)*.65) or CAPTION.match(text):
                    top = max(top, other[3]+4)
            if block[1]-top < 45:
                # Preserve context when a reliable crop cannot be isolated.
                top = 32
            rect = fitz.Rect(overrides.get(number, [left, top, right, block[1]-2]))
            asset = f'figure-{number}.png'
            page.get_pixmap(matrix=fitz.Matrix(2.3,2.3), clip=rect, alpha=False).save(output/asset)
            caption = ' '.join(block[4].split())
            figures.append(dict(id=f'figure-{number}',number=number,page=index+1,asset=asset,
                caption=caption,source=source,sourceSha256=hashlib.sha256(pdf_path.read_bytes()).hexdigest(),
                crop=[round(v,2) for v in rect],width=round(rect.width*2.3),height=round(rect.height*2.3),
                attribution='Original figure from the paper authors. Copyright remains with the authors or publisher.',
                reuse='Source-specific reuse terms have not been verified; not covered by the application MIT license.'))
    (output/'figures.json').write_text(json.dumps(figures,ensure_ascii=False,indent=2))
    return figures

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('pdf');p.add_argument('output');p.add_argument('--source',required=True);p.add_argument('--numbers')
    args=p.parse_args()
    result=extract(args.pdf,args.output,args.source,args.numbers.split(',') if args.numbers else None)
    print(json.dumps({'count':len(result),'output':args.output}))
