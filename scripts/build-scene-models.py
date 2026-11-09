"""Build scene-only GLBs with 512px textures; keep original models for previews.

Requires Pillow. Only embedded image payloads change; geometry, animation,
materials and samplers retain their original indices and values.
"""
import io
import json
from pathlib import Path
import struct
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'src/features/scene/scene-models.json'
TEXTURE_SIZE = 512  # Scene tier: full-resolution originals remain available in previews.


def unpack(data):
    magic, version, length = struct.unpack_from('<III', data)
    if magic != 0x46546C67 or version != 2 or length != len(data):
        raise ValueError('Invalid GLB')
    size, kind = struct.unpack_from('<II', data, 12)
    if kind != 0x4E4F534A:
        raise ValueError('Missing GLB JSON')
    document = json.loads(data[20:20 + size])
    bin_size, bin_kind = struct.unpack_from('<II', data, 20 + size)
    if bin_kind != 0x004E4942 or 28 + size + bin_size != length:
        raise ValueError('Expected one GLB binary chunk')
    return document, data[28 + size:]


def build_model(data, max_size=TEXTURE_SIZE):
    document, original = unpack(data)
    payloads = []
    for view in document['bufferViews']:
        if view.get('buffer', 0) != 0:
            raise ValueError('External GLB buffer')
        start = view.get('byteOffset', 0)
        payloads.append(original[start:start + view['byteLength']])
    changed = []
    for index, image in enumerate(document.get('images', [])):
        if 'bufferView' not in image:
            raise ValueError('Expected embedded GLB image')
        with Image.open(io.BytesIO(payloads[image['bufferView']])) as source:
            rgba = source.convert('RGBA')
            size = source.size
            uniform = all(low == high for low, high in rgba.getextrema())
            if uniform:
                result = Image.new('RGBA', (1, 1), rgba.getpixel((0, 0)))
            elif max(size) > max_size:
                result = rgba.copy()
                result.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            else:
                continue
            if result.size == size:
                continue
            output = io.BytesIO()
            result.save(output, format='PNG', icc_profile=source.info.get('icc_profile'))
            payloads[image['bufferView']] = output.getvalue()
            image['mimeType'] = 'image/png'
            changed.append({'image': index, 'before': list(size), 'after': list(result.size)})
    binary = bytearray()
    for view, payload in zip(document['bufferViews'], payloads):
        binary.extend(b'\0' * (-len(binary) % 4))
        view['byteOffset'] = len(binary)
        view['byteLength'] = len(payload)
        binary.extend(payload)
    document['buffers'][0]['byteLength'] = len(binary)
    encoded = json.dumps(document, separators=(',', ':'), ensure_ascii=False).encode()
    encoded += b' ' * (-len(encoded) % 4)
    binary.extend(b'\0' * (-len(binary) % 4))
    total = 28 + len(encoded) + len(binary)
    output = struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + struct.pack('<II', len(binary), 0x004E4942) + binary
    return output, changed


if __name__ == '__main__':
    for source, target in json.loads(MANIFEST.read_text()).items():
        data = (ROOT / 'public' / source.lstrip('/')).read_bytes()
        output, changes = build_model(data)
        destination = ROOT / 'public' / target.lstrip('/')
        destination.write_bytes(output)
        print(json.dumps({'source': source, 'target': target, 'bytesBefore': len(data), 'bytesAfter': len(output), 'images': changes}), flush=True)
