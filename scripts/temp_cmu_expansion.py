"""Inspect and import the first additional CMU daily motions with Blender.

blender --background --python scripts/temp_cmu_expansion.py
blender --background --python scripts/temp_cmu_expansion.py -- --convert
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/home/dinatih/3D Resources/animations/CMU/13')
MOTIONS = [
    ('13_07', 'cmu-drink-bottle', 'Déboucher une bouteille et boire'),
    ('13_01', 'cmu-sit-high-stool', "S’asseoir sur un tabouret haut et se relever"),
    ('13_24', 'cmu-sweep-floor-alt', 'Balayer le sol — autre prise'),
]


def main():
    sys.path.insert(0, str(ROOT / 'scripts'))
    results = []
    for trial, identifier, label in MOTIONS:
        source = SOURCE / f'{trial}_stageii.npz'
        with np.load(source) as data:
            poses, trans = data['poses'], data['trans']
            fps = float(data['mocap_frame_rate'])
            print(trial, 'fps', fps, 'shape', poses.shape, 'duration', len(poses) / fps)
            for frame in range(0, len(poses), round(fps)):
                print(frame, 'hips', trans[frame].round(3).tolist(), 'arms',
                      np.linalg.norm(poses[frame, 48:54].reshape(2, 3), axis=1).round(3).tolist())
        if '--convert' in sys.argv:
            from convert_daily_chores import convert
            filename = f'{identifier}.glb'
            info = convert(source, ROOT / 'public/animations/npz/cmu' / filename)
            results.append(dict(id=identifier, label=label, trial=trial, src=str(source),
                                filename=filename, **info))
    if results:
        target = ROOT / 'public/animations/npz/_metadata/cmu_expansion.json'
        target.write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
