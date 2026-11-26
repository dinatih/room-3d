"""Verify audited scene variants preserve every non-image payload and GLTF property."""
import copy
import io
import json
from pathlib import Path
from PIL import Image
from importlib.util import spec_from_file_location, module_from_spec

ROOT = Path(__file__).resolve().parents[1]
spec = spec_from_file_location('scene_builder', ROOT / 'scripts/build-scene-models.py')
builder = module_from_spec(spec)
spec.loader.exec_module(builder)


def normalized(document):
    result = copy.deepcopy(document)
    for view in result['bufferViews']:
        view.pop('byteOffset', None)
        view.pop('byteLength', None)
    result['buffers'][0].pop('byteLength')
    for image in result.get('images', []):
        image.pop('mimeType', None)
    return result


def payload(document, binary, index):
    view = document['bufferViews'][index]
    start = view.get('byteOffset', 0)
    return binary[start:start + view['byteLength']]


report = json.loads((ROOT / 'docs/scene-assets-2026-11-26.json').read_text())
for entry in report:
    source, src = builder.unpack((ROOT / entry['source']).read_bytes())
    target, dst = builder.unpack((ROOT / entry['target']).read_bytes())
    assert normalized(source) == normalized(target), entry['source']
    image_views = {image['bufferView'] for image in source.get('images', [])}
    for index in range(len(source['bufferViews'])):
        if index not in image_views:
            assert payload(source, src, index) == payload(target, dst, index), (entry['source'], index)
    for image in target.get('images', []):
        with Image.open(io.BytesIO(payload(target, dst, image['bufferView']))) as bitmap:
            assert max(bitmap.size) <= builder.TEXTURE_SIZE, entry['target']
    print('OK geometry, skinning, animation, materials, textures:', entry['target'])
print(f'{len(report)} variants verified')
