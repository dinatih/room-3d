"""Freeze a review batch and build independent NPZ references for both actors."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import numpy as np
from interx_catalog import ROOT, MANIFEST, DEFAULT_SOURCE, read_pair, glb_info


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--batch', type=int, default=1)
    parser.add_argument('--size', type=int, default=100)
    args = parser.parse_args()
    if args.batch < 1 or args.size < 1:
        raise ValueError('Batch and size must be positive')
    manifest = json.loads(MANIFEST.read_text())
    entries = sorted(manifest['duos'], key=lambda item: item['source']['recording'])
    selected = entries[(args.batch - 1) * args.size:args.batch * args.size]
    if not selected:
        raise ValueError('Empty review batch')
    selection_path = ROOT / f'scripts/interx-review-batch-{args.batch:03}.json'
    selection = dict(schemaVersion=1, dataset='inter-x', batch=args.batch, size=args.size, order='source.recording', ids=[entry['id'] for entry in selected])
    if selection_path.exists() and json.loads(selection_path.read_text()) != selection:
        raise ValueError('Catalog order changed; preserve the existing batch before creating a new selection')
    selection_path.write_text(json.dumps(selection, indent=2) + '\n')
    references = []
    for entry in selected:
        pair = read_pair(DEFAULT_SOURCE, entry['source']['recording'])
        expected_offset = pair[1]['trans'][0].astype(np.float64) - pair[0]['trans'][0].astype(np.float64)
        np.testing.assert_array_equal(entry['start_offset'], expected_offset)
        actors = []
        for person, motion in zip(['p1', 'p2'], pair):
            source_path = DEFAULT_SOURCE / entry['source'][person]
            if hashlib.sha256(source_path.read_bytes()).hexdigest() != entry['source']['sha256'][person]:
                raise ValueError(f'Stale source: {source_path}')
            info = glb_info(ROOT / 'public' / entry['clips'][person]['path'])
            if any(info[key] != entry['clips'][person][key] for key in info):
                raise ValueError(f'Stale GLB: {entry["id"]}/{person}')
            if info['frameCount'] != len(motion['trans'][::4]):
                raise ValueError('Source/GLB frame mismatch')
            actors.append(dict(person=person, path=entry['clips'][person]['path'], trans=motion['trans'][::4].tolist(), root=motion['root_orient'][::4].tolist()))
        references.append(dict(id=entry['id'], actionCode=entry['actionCode'], source=entry['source']['recording'], actors=actors))
    output = Path(f'/tmp/interx-review-batch-{args.batch:03}-reference.json')
    output.write_text(json.dumps(dict(selection=selection, duos=references)))
    print(json.dumps(dict(totalDuos=len(entries), reviewedDuos=len(selected), clips=len(selected)*2,
                         first=selected[0]['source']['recording'], last=selected[-1]['source']['recording'],
                         actions=dict(Counter(entry['actionCode'] for entry in selected)),
                         footSupport=dict(Counter(entry.get('footSupport', 'none') for entry in selected)),
                         placement=dict(Counter(entry.get('placement', {}).get('verticalOrigin', 'none') for entry in selected)),
                         reference=str(output)), indent=2))


if __name__ == '__main__':
    main()
