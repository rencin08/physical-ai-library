"""Download and extract one example paper locally, without AI generation."""
import argparse, hashlib, importlib.util, json, pathlib, urllib.request
root = pathlib.Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--slug', required=True)
args = parser.parse_args()
guides = json.loads((root/'lib/learning/reviewed/library-guides.json').read_text())
if args.slug not in guides:
    parser.error('Unknown example paper slug')
entry = guides[args.slug]
if not entry['source'].startswith('https://'):
    raise ValueError('Expected HTTPS source')
request = urllib.request.Request(entry['source'], headers={'User-Agent': 'PhysicalAILibrary/0.1 (local paper import)'})
with urllib.request.urlopen(request, timeout=60) as response:
    data = response.read(100 * 1024 * 1024 + 1)
if len(data) > 100 * 1024 * 1024 or not data.startswith(b'%PDF-'):
    raise ValueError('Expected PDF under 100 MB')
if hashlib.sha256(data).hexdigest() != entry['sourceSha256']:
    raise ValueError('Source version changed: review the new PDF before importing figures')
cache = root/'.guide-drafts/library'/args.slug
cache.mkdir(parents=True, exist_ok=True)
(cache/'paper.pdf').write_bytes(data)
spec = importlib.util.spec_from_file_location('prepare', root/'scripts/prepare-library-figures.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
slug, figures = module.prepare(args.slug)
manifest = root/'lib/learning/reviewed/paper-figures.json'
all_figures = json.loads(manifest.read_text())
all_figures[slug] = figures
manifest.write_text(json.dumps(all_figures, indent=2)+'\n')
print('Imported locally. Inspect the reader and restart/rebuild a production server. Figure rights remain with the authors.')
