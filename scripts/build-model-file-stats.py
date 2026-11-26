"""Generate inventory file metadata without loading GLBs into the browser.
Run again after replacing or adding models. Sizes describe files, not RSS.
"""
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
report = {}
for folder in ['items', 'characters', 'models', 'environment']:
    for path in sorted((ROOT / 'public' / folder).rglob('*.glb')):
        data = path.read_bytes()
        key = '/' + str(path.relative_to(ROOT / 'public'))
        if not data:
            report[key] = {'error': 'Fichier GLB vide'}
            continue
        magic, version, length, size, kind = struct.unpack_from('<IIIII', data)
        if magic != 0x46546C67 or version != 2 or length != len(data) or kind != 0x4E4F534A:
            raise ValueError(f'Invalid GLB: {path}')
        doc = json.loads(data[20:20 + size])
        animation_views = set()
        for animation in doc.get('animations', []):
            for sampler in animation['samplers']:
                for role in ['input', 'output']:
                    accessor = doc['accessors'][sampler[role]]
                    if 'bufferView' in accessor:
                        animation_views.add(accessor['bufferView'])
        triangles = 0
        primitives = 0
        for mesh in doc.get('meshes', []):
            for primitive in mesh['primitives']:
                primitives += 1
                count = doc['accessors'][primitive.get('indices', primitive['attributes']['POSITION'])]['count']
                mode = primitive.get('mode', 4)
                if mode == 4:
                    triangles += count // 3
                elif mode in [5, 6]:
                    triangles += max(0, count - 2)
        report[key] = dict(fileBytes=len(data), triangles=triangles, primitives=primitives,
                           animations=len(doc.get('animations', [])),
                           animationBytes=sum(doc['bufferViews'][i]['byteLength'] for i in animation_views))
(ROOT / 'public/model-file-stats.json').write_text(json.dumps(report, ensure_ascii=False, separators=(',', ':')) + '\n')
print(f'{len(report)} file statistics generated')
