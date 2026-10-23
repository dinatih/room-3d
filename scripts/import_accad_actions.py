"""Import the selected non-combat ACCAD actions; run with Blender --background.

blender --background --python scripts/import_accad_actions.py -- --inspect
blender --background --python scripts/import_accad_actions.py
"""
import json
import sys
import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/home/dinatih/3D Resources/animations/ACCAD/ACCAD')
# One take per performer/action; calibration, locomotion and martial arts excluded.
SELECTION = [
    ('look-around', 'Regarder autour de soi', 'A4', 'standing', 'emotes_gestures'),
    ('crouch', "S'accroupir", 'A7', 'standing', 'poses_idles'),
    ('lie-to-crouch', 'Se relever du sol en position accroupie', 'A10', 'transition', 'interactions'),
    ('lie', 'Rester allongé', 'A9', 'lying', 'poses_idles'),
    ('sway', 'Se balancer sur place', 'A2', 'standing', 'poses_idles'),
    ('swing-arms', 'Balancer les bras debout', 'A3', 'standing', 'emotes_gestures'),
]


def selection():
    items = []
    for action, label, code, support, category in SELECTION:
        for performer, directory, name in [('male1', 'Male1General_c3d', 'H1'), ('male2', 'Male2General_c3d', 'H2'), ('female', 'Female1General_c3d', 'F')]:
            matches = sorted(p for p in (SOURCE / directory).glob('*.npz') if p.stem.removeprefix('General ').startswith(code + ' ') or p.stem.startswith(code + '-'))
            matches = [p for p in matches if 'forward' not in p.stem.lower()]
            if len(matches) > 1:
                matches = [p for p in matches if not any(word in p.stem.lower() for word in [' t2', ' t3'])]
            if len(matches) != 1:
                raise ValueError((action, performer, matches))
            items.append(dict(id=f'accad-{action}-{performer}', label=f'{label} ({name})', source=str(matches[0].relative_to(SOURCE)), support=support, category=category))
    for action, label, source, support, category in [
        ('lie-prone-male1', 'Rester allongé sur le ventre (H1)', 'Male1General_c3d/General A9 -   Lie (forward)_poses.npz', 'lying', 'poses_idles'),
        ('lie-down-forward-male1', "S'allonger vers l'avant (H1)", 'Male1General_c3d/General A8 -  Crourch to Lie (forward)_poses.npz', 'transition', 'interactions'),
        ('wait-female', 'Attendre naturellement (F)', 'Female1Gestures_c3d/D2 - Wait 1_poses.npz', 'standing', 'poses_idles'),
        ('urban-female', 'Gestuelle Urban 1 (F)', 'Female1Gestures_c3d/D1 - Urban 1_poses.npz', 'free', 'emotes_gestures'),
        ('random-gestures-female', 'Gestes variés (F)', 'Female1Gestures_c3d/D5 - Random Stuff 2_poses.npz', 'free', 'emotes_gestures'),
        ('cartwheel-female', 'Faire la roue (F)', 'Female1Gestures_c3d/D6- CartWheel_poses.npz', 'free', 'sports_fitness'),
        ('pickup-box-floor-male2', 'Ramasser une boîte au sol (H2)', 'Male2General_c3d/A5- Pick up box_poses.npz', 'standing', 'interactions'),
        ('lift-box-male2', 'Soulever une boîte (H2)', 'Male2General_c3d/A6- Box lift_poses.npz', 'standing', 'interactions'),
    ]:
        items.append(dict(id='accad-' + action, label=label, source=source, support=support, category=category))
    return items


def main():
    import numpy as np
    sys.path.insert(0, str(ROOT / 'scripts'))
    from reexport_trimmed_daily import convert_trimmed, find_trim_range
    items = selection()
    staging = Path('/tmp/room-accad-import-original')
    staging.mkdir(exist_ok=True)
    for item in items:
        source = SOURCE / item['source']
        with np.load(source) as data:
            fps = float(data['mocap_framerate'])
            start, end = find_trim_range(data['poses'], fps)
            print(item['id'], len(data['poses']), fps, 'trim', start, end, flush=True)
        if '--inspect' in sys.argv:
            continue
        item['path'] = f"animations/npz/accad/{item['id']}.glb"
        item.update(convert_trimmed(item['id'], source, staging / Path(item['path']).name))
        item['tags'] = ['accad', item['support'], item['id'].removeprefix('accad-')]
    if '--inspect' not in sys.argv:
        (ROOT / 'public/animations/npz/_metadata/accad_actions.json').write_text(json.dumps(items, indent=2, ensure_ascii=False) + '\n')
        subprocess.run(['node', str(ROOT / 'scripts/correct-accad-feet.cjs'), '--new-actions', '--write'], env={**os.environ, 'ACCAD_ORIGINAL_DIR': str(staging)}, check=True)
        definitions = [{key: item[key] for key in ['id', 'path', 'category', 'label', 'tags', 'duration']} for item in items]
        manifest = "import type { AnimationDefinition } from './animationRegistry';\n\nexport const ACCAD_ANIMATION_DEFINITIONS: AnimationDefinition[] = " + '[\n' + '\n'.join('  ' + json.dumps(item, ensure_ascii=False) + ',' for item in definitions) + '\n];\n'
        (ROOT / 'src/features/scene/animations/accadManifest.ts').write_text(manifest)


if __name__ == '__main__':
    main()
