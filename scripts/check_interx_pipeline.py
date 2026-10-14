"""Check Inter-X selection, source validation, manifests and non-mutating dry-runs."""
import argparse
from collections import Counter
import json
from pathlib import Path
import subprocess
import tempfile

import numpy as np

from interx_catalog import ROOT, DEFAULT_SOURCE, MANIFEST, RUNTIME_MANIFEST, read_pair, glb_info
from select_interx_duos import select_recordings
from convert_interx_duos import load_selection, verified


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference', type=Path)
    args = parser.parse_args()
    selection_path = ROOT / 'scripts/interx_selection.json'
    selection = load_selection(selection_path, DEFAULT_SOURCE)
    selected = select_recordings(DEFAULT_SOURCE, 8)
    assert selected == select_recordings(DEFAULT_SOURCE, 8)
    assert [entry['source']['recording'] for entry in selection['duos']] == selected
    assert len(selected) == 218
    counts = Counter(entry['actionCode'] for entry in selection['duos'])
    assert len(counts) == 40 and max(counts.values()) <= 8
    assert len({(entry['actionCode'], entry['variation']) for entry in selection['duos']}) == len(selected)
    for entry in selection['duos']:
        group = entry['source']['group']
        prefix = group + entry['variation'] + entry['actionCode']
        takes = sorted(path.name for path in DEFAULT_SOURCE.glob(prefix + 'R*'))
        assert entry['source']['recording'] == takes[0]
        groups = sorted(path.name for path in DEFAULT_SOURCE.glob('G*' + entry['variation'] + entry['actionCode'] + 'R*'))
        assert entry['source']['recording'] == groups[0]
    assert next(entry for entry in selection['duos'] if entry['actionCode'] == 'A003')['source']['take'] == 'R016'
    manifest = json.loads(MANIFEST.read_text())
    assert MANIFEST.read_bytes() == RUNTIME_MANIFEST.read_bytes()
    reference = []
    for entry in manifest['duos']:
        assert verified(entry)
        pair = read_pair(DEFAULT_SOURCE, entry['source']['recording'])
        expected = pair[1]['trans'][0].astype(np.float64) - pair[0]['trans'][0].astype(np.float64)
        np.testing.assert_array_equal(entry['start_offset'], expected)
        assert entry['clips']['p1']['frameCount'] == entry['clips']['p2']['frameCount']
        assert entry['clips']['p1']['durationSeconds'] == entry['clips']['p2']['durationSeconds']
        for clip in entry['clips'].values():
            assert glb_info(ROOT / 'public' / clip['path'])['frameCount'] == len(pair[0]['trans'][::4])
        reference.append({
            'id': entry['id'],
            'participants': [{'trans': motion['trans'][::4].tolist(), 'root': motion['root_orient'][::4].tolist()} for motion in pair],
        })

    with tempfile.TemporaryDirectory() as temporary:
        folder = Path(temporary) / 'G001T000A000R000'
        folder.mkdir()
        valid = {'pose_body': np.zeros((2, 21, 3)), 'root_orient': np.zeros((2, 3)), 'trans': np.zeros((2, 3))}
        np.savez(folder / 'P1.npz', **valid)
        try:
            read_pair(Path(temporary), folder.name)
        except FileNotFoundError:
            pass
        else:
            raise AssertionError('Missing P2 was accepted')
        for invalid in [
            {**valid, 'trans': np.full((2, 3), np.nan)},
            {key: value[:1] for key, value in valid.items()},
            {**valid, 'pose_body': np.zeros((2, 20, 3))},
        ]:
            np.savez(folder / 'P2.npz', **invalid)
            try:
                read_pair(Path(temporary), folder.name)
            except ValueError:
                pass
            else:
                raise AssertionError('Invalid/unsynchronized P2 was accepted')
        np.savez(folder / 'P2.npz', **valid)
        read_pair(Path(temporary), folder.name)

    before = {path: path.read_bytes() for path in [selection_path, MANIFEST, RUNTIME_MANIFEST, *MANIFEST.parent.glob('*.glb')]}
    result = subprocess.run(['python3', str(ROOT / 'scripts/convert_interx_duos.py'), '--selection', str(selection_path), '--dry-run'], check=True, capture_output=True, text=True)
    assert 'TOTAL: 218 duos / 436 GLB' in result.stdout
    assert all(path.read_bytes() == value for path, value in before.items())
    if args.reference:
        args.reference.write_text(json.dumps(reference))
    print(f'Selection: 218 deterministic duos, 40 actions; {len(manifest["duos"])} published pairs verified. Missing/invalid/desynchronized data rejected; dry-run writes nothing.')


if __name__ == '__main__':
    main()
