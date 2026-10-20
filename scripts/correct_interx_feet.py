"""Correct published standing Inter-X feet without re-exporting unrelated tracks.

python scripts/correct_interx_feet.py --recordings G019T006A000R024 G019T000A000R003
python scripts/correct_interx_feet.py
"""
import argparse
import json
import struct
from pathlib import Path

import numpy as np
from interx_catalog import DEFAULT_SOURCE, MANIFEST, ROOT, SOURCE_FPS, glb_document, glb_info, publish_manifest
from convert_interx_duos import GROUND_STANDING_ACTIONS, verified
from interx_foot_support import FOOT_SUPPORT_METHOD, correct_foot_support, load_model, quaternion, quaternion_matrix, rotations


def corrected_glb(path, motion, model):
    corrected, report = correct_foot_support(motion, model)
    data, doc = glb_document(path)
    json_length = struct.unpack_from('<I', data, 12)[0]
    binary = bytearray(data[28 + json_length:])
    animation, = doc['animations']
    def array(index):
        accessor = doc['accessors'][index]; view = doc['bufferViews'][accessor['bufferView']]
        offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
        size = {'SCALAR': 1, 'VEC4': 4}[accessor['type']]
        return np.frombuffer(binary, dtype='<f4', count=accessor['count'] * size, offset=offset).reshape(-1, size).copy()
    reference = max(animation['samplers'], key=lambda s: doc['accessors'][s['input']]['count'])['input']
    times = array(reference)[:, 0]
    frames = np.rint(times * SOURCE_FPS).astype(int)
    parents = {c: i for i, node in enumerate(doc['nodes']) for c in node.get('children', [])}
    rest = {}
    def world(index):
        if index not in rest:
            local = quaternion_matrix(doc['nodes'][index].get('rotation', [0, 0, 0, 1]))
            rest[index] = world(parents[index]) @ local if index in parents else local
        return rest[index]
    for side, ankle, foot in zip(['Left', 'Right'], [7, 8], report):
        active = foot['correction'][frames] > 0
        if not active.any():
            continue
        node = next(i for i, n in enumerate(doc['nodes']) if n.get('name', '').replace(':', '') == 'mixamorig' + side + 'Foot')
        channel, = [c for c in animation['channels'] if c['target'] == {'node': node, 'path': 'rotation'}]
        sampler = animation['samplers'][channel['sampler']]
        values = array(sampler['output'])
        same_times = np.array_equal(array(sampler['input'])[:, 0], times)
        if not same_times:
            if not np.all(values == values[0]):
                raise ValueError(f'Unexpected sparse ankle track: {path}')
            values = np.repeat(values[:1], len(times), axis=0)
        local = rotations(corrected['pose_body'].reshape(-1, 21, 3)[frames[active], ankle - 1])
        for index, matrix in zip(np.flatnonzero(active), world(parents[node]).T @ local @ world(node)):
            q = quaternion(matrix)
            values[index] = q if np.dot(q, values[index]) >= 0 else -q
        encoded = values.astype('<f4').tobytes()
        accessor = doc['accessors'][sampler['output']]
        view = doc['bufferViews'][accessor['bufferView']]
        if same_times:
            offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
            binary[offset:offset + len(encoded)] = encoded
        else:
            doc['bufferViews'].append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(encoded)})
            binary.extend(encoded)
            doc['accessors'].append({'bufferView': len(doc['bufferViews']) - 1, 'componentType': 5126, 'count': len(times), 'type': 'VEC4'})
            sampler.update(input=reference, output=len(doc['accessors']) - 1)
    doc['buffers'][0]['byteLength'] = len(binary)
    text = json.dumps(doc, separators=(',', ':')).encode(); text += b' ' * (-len(text) % 4)
    output = struct.pack('<III', 0x46546C67, 2, 28 + len(text) + len(binary))
    return output + struct.pack('<II', len(text), 0x4E4F534A) + text + struct.pack('<II', len(binary), 0x004E4942) + binary, report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--recordings', nargs='+')
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--models', type=Path, default=DEFAULT_SOURCE.parent.parent)
    args = parser.parse_args()
    manifest = json.loads(MANIFEST.read_text()); selected = set(args.recordings or [])
    if selected - {d['source']['recording'] for d in manifest['duos']}:
        raise ValueError('Unknown Inter-X recording')
    count = 0
    for duo in manifest['duos']:
        if (selected and duo['source']['recording'] not in selected) or duo['actionCode'] not in GROUND_STANDING_ACTIONS:
            continue
        if duo.get('footSupport') == FOOT_SUPPORT_METHOD:
            if not verified(duo):
                raise ValueError(f"Stale corrected assets: {duo['id']}")
            continue
        if not verified(duo):
            raise ValueError(f"Unverified source assets: {duo['id']}")
        outputs = []
        for person in ['p1', 'p2']:
            with np.load(args.source / duo['source'][person], allow_pickle=False) as data:
                motion = {key: data[key] for key in data.files}
            model = load_model(args.models / f"SMPLX_{str(motion['gender'].item()).upper()}.npz")
            path = ROOT / 'public' / duo['clips'][person]['path']
            output, _ = corrected_glb(path, motion, model)
            outputs.append((person, path, output))
        for person, path, output in outputs:
            path.write_bytes(output)
            duo['clips'][person].update(glb_info(path))
        duo['footSupport'] = FOOT_SUPPORT_METHOD
        publish_manifest(manifest)
        count += 1
        print(f"Corrected {duo['source']['recording']}", flush=True)
    print(f'Corrected {count} duos / {count * 2} clips')


if __name__ == '__main__':
    main()
