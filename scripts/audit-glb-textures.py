"""Rank every GLB by decoded texture pixels, independently of compressed file size.
Usage: python scripts/audit-glb-textures.py > /tmp/room-glb-textures.json
"""
import io
import json
from pathlib import Path
import struct
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'src/features/scene/scene-models.json').read_text())
report = []
for path in sorted((ROOT / 'public').rglob('*.glb')):
    data = path.read_bytes()
    # Report empty placeholders explicitly instead of silently omitting them.
    if not data:
        report.append({'path': str(path), 'error': 'Empty GLB placeholder', 'rgbaBytes': 0})
        continue
    magic, version, length, size, kind = struct.unpack_from('<IIIII', data)
    if magic != 0x46546C67 or version != 2 or length != len(data) or kind != 0x4E4F534A:
        raise ValueError(f'Invalid GLB: {path}')
    document = json.loads(data[20:20 + size])
    binary = 28 + size
    images = []
    for image in document.get('images', []):
        if 'bufferView' in image:
            view = document['bufferViews'][image['bufferView']]
            start = binary + view.get('byteOffset', 0)
            stream = io.BytesIO(data[start:start + view['byteLength']])
        else:
            stream = path.parent / image['uri']
        with Image.open(stream) as bitmap:
            w, h = bitmap.size
        images.append({'width': w, 'height': h, 'rgbaBytes': w * h * 4})
    key = '/' + str(path.relative_to(ROOT / 'public'))
    report.append({'path': str(path), 'diskBytes': len(data), 'rgbaBytes': sum(i['rgbaBytes'] for i in images),
                   'sceneVariant': manifest.get(key), 'images': images})
print(json.dumps(sorted(report, key=lambda r: r['rgbaBytes'], reverse=True), indent=2, ensure_ascii=False))
