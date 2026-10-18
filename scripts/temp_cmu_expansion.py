"""Inspect and import the additional CMU daily motions with Blender.

blender --background --python scripts/temp_cmu_expansion.py
blender --background --python scripts/temp_cmu_expansion.py -- --convert
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/home/dinatih/3D Resources/animations/CMU')
MOTIONS = [
    ('13_07', 'cmu-drink-bottle', 'Déboucher une bouteille et boire'),
    ('13_01', 'cmu-sit-high-stool', "S’asseoir sur un tabouret haut et se relever"),
    ('13_24', 'cmu-sweep-floor-alt', 'Balayer le sol — autre prise'),
    ('13_08', 'cmu-drink-bottle-recap', 'Déboucher, boire et reboucher la bouteille'),
    ('13_09', 'cmu-drink-soda', 'Boire un soda'),
    ('13_02', 'cmu-sit-high-stool-02', 'Tabouret haut : s’asseoir et se relever — prise 2'),
    ('13_03', 'cmu-sit-high-stool-03', 'Tabouret haut : s’asseoir et se relever — prise 3'),
    ('13_04', 'cmu-sit-stool-chin-hand', 'Tabouret bas : menton dans la main'),
    ('13_05', 'cmu-sit-stool-fidget', 'Tabouret bas : s’agiter et se relever'),
    ('13_06', 'cmu-sit-stool-elbow-out', 'Tabouret bas : mains au menton, coude écarté, se relever'),
    ('13_21', 'cmu-clean-windows-21', 'Laver les vitres — prise 21'),
    ('13_22', 'cmu-clean-windows-22', 'Laver les vitres — prise 22'),
    ('13_25', 'cmu-sweep-floor-25', 'Balayer le sol — prise 25'),
    ('13_33', 'cmu-climb-ladder-33', 'Monter une échelle — prise 33'),
    ('13_34', 'cmu-climb-ladder-34', 'Monter une échelle — prise 34'),
    ('15_04', 'cmu-everyday-dance-boxing-04', 'Séquence mixte : ménage, gestes, danse et boxe — prise 4'),
    ('15_05', 'cmu-everyday-dance-boxing-05', 'Séquence mixte : ménage, gestes, danse et boxe — prise 5'),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--convert', action='store_true')
    parser.add_argument('--trials', nargs='+', choices=[trial for trial, _, _ in MOTIONS])
    args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
    sys.path.insert(0, str(ROOT / 'scripts'))
    target = ROOT / 'public/animations/npz/_metadata/cmu_expansion.json'
    results = {item['trial']: item for item in json.loads(target.read_text())} if target.exists() else {}
    for trial, identifier, label in MOTIONS:
        if args.trials and trial not in args.trials:
            continue
        source = SOURCE / trial.split('_')[0] / f'{trial}_stageii.npz'
        with np.load(source) as data:
            poses, trans = data['poses'], data['trans']
            fps = float(data['mocap_frame_rate'])
            print(trial, 'fps', fps, 'shape', poses.shape, 'duration', len(poses) / fps)
            if not args.convert:
                for frame in range(0, len(poses), round(fps)):
                    print(frame, 'hips', trans[frame].round(3).tolist(), 'arms',
                          np.linalg.norm(poses[frame, 48:54].reshape(2, 3), axis=1).round(3).tolist())
        if args.convert:
            from convert_daily_chores import convert
            filename = f'{identifier}.glb'
            info = convert(source, ROOT / 'public/animations/npz/cmu' / filename)
            results[trial] = dict(id=identifier, label=label, trial=trial, src=str(source),
                                  filename=filename, **info)
            print('Converted', trial, info, flush=True)
    if args.convert:
        ordered = [results[trial] for trial, _, _ in MOTIONS if trial in results]
        target.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
