"""Compare a regenerated known-good GLB against its calibrated reference.

python3 scripts/check-yoga-conversion.py public/animations/npz/yoga/anim_yoga_akarna_dhanurasana_a.glb /tmp/yoga-reference/anim_yoga_akarna_dhanurasana_a.glb
"""
import json
import math
import struct
import sys
from pathlib import Path


def read_glb(path):
    data = Path(path).read_bytes()
    length, = struct.unpack_from('<I', data, 12)
    gltf = json.loads(data[20:20 + length])
    binary_start = 20 + length + 8

    def accessor(index):
        item = gltf['accessors'][index]
        assert item['componentType'] == 5126, item
        view = gltf['bufferViews'][item['bufferView']]
        components = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[item['type']]
        stride = view.get('byteStride', components * 4)
        start = binary_start + view.get('byteOffset', 0) + item.get('byteOffset', 0)
        return [struct.unpack_from('<' + 'f' * components, data, start + i * stride) for i in range(item['count'])]

    tracks = {}
    animation = gltf['animations'][0]
    for channel in animation['channels']:
        sampler = animation['samplers'][channel['sampler']]
        target = channel['target']
        key = (gltf['nodes'][target['node']]['name'], target['path'])
        tracks[key] = (accessor(sampler['input']), accessor(sampler['output']))
    return gltf, tracks


def main():
    old, old_tracks = read_glb(sys.argv[1])
    new, new_tracks = read_glb(sys.argv[2])
    assert old_tracks.keys() == new_tracks.keys(), 'Skeleton animation channels differ'
    maximum_error = 0
    for key, (old_times, old_values) in old_tracks.items():
        new_times, new_values = new_tracks[key]
        assert old_times == new_times, f'Timing differs: {key}'
        assert len(old_values) == len(new_values), key
        for a, b in zip(old_values, new_values):
            assert all(math.isfinite(x) for x in b), key
            error = max(abs(x - y) for x, y in zip(a, b))
            if key[1] == 'rotation':
                error = min(error, max(abs(x + y) for x, y in zip(a, b)))
            maximum_error = max(maximum_error, error)
            assert error < 1e-4, f'Calibrated motion changed: {key}, {error}'
    old_nodes = {n['name']: n for n in old['nodes']}
    for node in new['nodes']:
        original = old_nodes[node['name']]
        for attribute, default in [('translation', [0, 0, 0]), ('rotation', [0, 0, 0, 1]), ('scale', [1, 1, 1])]:
            a, b = original.get(attribute, default), node.get(attribute, default)
            assert max(abs(x - y) for x, y in zip(a, b)) < 1e-4, (node['name'], attribute)
    print(f'Calibrated reference reproduced: {len(new_tracks)} tracks, maximum component error {maximum_error:.2g}')


if __name__ == '__main__':
    main()
