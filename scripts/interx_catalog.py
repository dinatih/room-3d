"""Shared Inter-X indexing, validation and reporting (no Blender dependency)."""
import hashlib
import json
import math
import re
import struct
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path('/home/dinatih/3D Resources/animations/Inter-X_Dataset-motions/motions')
MANIFEST = ROOT / 'src/features/scene/animations/interx_manifest.json'
PUBLISHED = {entry['source']['recording']: entry for entry in json.loads(MANIFEST.read_text())['duos']} if MANIFEST.exists() else {}
SOURCE_FPS = 120
TARGET_FPS = 30
CONVERSION = {
    'revision': 1, 'sourceFps': SOURCE_FPS, 'targetFps': TARGET_FPS,
    'upAxis': 'Y', 'rootMotionMode': 'relative-to-first-frame',
    'translationUnit': 'meters',
}
RECORDING = re.compile(r'^(G\d{3})(T\d{3})(A\d{3})(R\d{3})$')
# Indexed by the original action code. Session T is not a semantic style label.
ACTION_LABELS = [
    ('hug', 'Câlin'), ('handshake', 'Poignée de main'), ('wave', 'Signe de la main'),
    ('grab', 'Saisir'), ('hit', 'Frapper'), ('kick', 'Coup de pied'),
    ('posing', 'Prendre la pose'), ('push', 'Pousser'), ('pull', 'Tirer'),
    ('sit-on-leg', 'S’asseoir sur la jambe'), ('slap', 'Gifler'),
    ('pat-on-back', 'Tapoter le dos'), ('point-finger', 'Pointer du doigt'),
    ('walk-towards', 'Marcher vers l’autre'), ('knock-over', 'Renverser'),
    ('step-on-foot', 'Marcher sur le pied'), ('high-five', 'High-five'),
    ('chase', 'Poursuivre'), ('whisper', 'Chuchoter à l’oreille'),
    ('support-with-hand', 'Soutenir avec la main'),
    ('rock-paper-scissors', 'Pierre-feuille-ciseaux'), ('dance', 'Danser'),
    ('link-arms', 'Bras dessus dessous'), ('shoulder-to-shoulder', 'Épaule contre épaule'),
    ('bend', 'Se pencher'), ('carry-back', 'Porter sur le dos'),
    ('massage-shoulder', 'Masser les épaules'), ('massage-leg', 'Masser les jambes'),
    ('arm-wrestling', 'Bras de fer'), ('chat', 'Discuter'),
    ('pat-on-cheek', 'Caresser la joue'), ('thumb-up', 'Pouce levé'),
    ('touch-head', 'Toucher la tête'), ('imitate', 'Imiter'),
    ('kiss-on-cheek', 'Baiser sur la joue'), ('help-up', 'Aider à se relever'),
    ('cover-mouth', 'Couvrir la bouche'), ('look-back', 'Regarder derrière soi'),
    ('block', 'Bloquer'), ('fly-kiss', 'Envoyer un baiser'),
]
COMBAT = {3, 4, 5, 7, 8, 10, 14, 15, 38}
AFFECTION = {0, 22, 23, 30, 32, 34, 39}
HELP = {11, 19, 25, 26, 27, 35}
PLAY = {6, 20, 21, 28, 33}


def actions():
    result = []
    for index, (key, label) in enumerate(ACTION_LABELS):
        category = 'combat' if index in COMBAT else 'dances' if index == 21 else 'poses_idles' if index == 6 else 'interactions'
        theme = 'combat' if index in COMBAT else 'affection' if index in AFFECTION else 'help-relaxation' if index in HELP else 'play-dance' if index in PLAY else 'social'
        icon = '🥊' if index in COMBAT else '🫂' if index in AFFECTION else '🤲' if index in HELP else '💃' if index == 21 else '🤝'
        result.append({'code': f'A{index:03}', 'key': key, 'label': label, 'category': category,
                       'icon': icon, 'isCombat': index in COMBAT, 'tags': [key, theme]})
    return result


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n')
    temporary.replace(path)


def publish_manifest(value):
    atomic_json(MANIFEST, value)


def read_pair(source, recording, include_hands=False):
    match = RECORDING.fullmatch(recording)
    if not match or int(match[3][1:]) >= len(ACTION_LABELS):
        raise ValueError(f'Invalid recording: {recording}')
    result = []
    for person in ('P1', 'P2'):
        path = source / PUBLISHED.get(recording, {}).get('source', {}).get(person.lower(), f'{recording}/{person}.npz')
        with np.load(path, allow_pickle=False) as data:
            keys = ('pose_body', 'root_orient', 'trans', 'pose_lhand', 'pose_rhand') if include_hands else ('pose_body', 'root_orient', 'trans')
            arrays = {key: data[key].copy() for key in keys}
        count = len(arrays['trans'])
        expected = {'pose_body': (count, 21, 3), 'root_orient': (count, 3), 'trans': (count, 3)}
        if include_hands:
            expected.update({'pose_lhand': (count, 15, 3), 'pose_rhand': (count, 15, 3)})
        if count == 0:
            raise ValueError(f'Empty motion: {path}')
        for key, shape in expected.items():
            if arrays[key].shape != shape or not np.isfinite(arrays[key]).all():
                raise ValueError(f'Invalid {key}: {path}, expected {shape}, got {arrays[key].shape}')
        result.append(arrays)
    if len(result[0]['trans']) != len(result[1]['trans']):
        raise ValueError(f'Unsynchronized participants: {recording}')
    return result


def glb_document(path):
    binary = Path(path).read_bytes()
    if binary[:4] != b'glTF' or struct.unpack_from('<I', binary, 4)[0] != 2:
        raise ValueError(f'Invalid GLB: {path}')
    length = struct.unpack_from('<I', binary, 12)[0]
    return binary, json.loads(binary[20:20 + length])


def glb_info(path):
    binary, gltf = glb_document(path)
    if len(gltf.get('animations', [])) != 1:
        raise ValueError(f"Expected one animation: {path}: {[item['name'] for item in gltf.get('animations', [])]}")
    animation = gltf['animations'][0]
    hips = next(index for index, node in enumerate(gltf['nodes']) if node.get('name', '').replace(':', '') == 'mixamorigHips')
    channel = next(channel for channel in animation['channels'] if channel['target']['node'] == hips and channel['target']['path'] == 'translation')
    accessor = gltf['accessors'][animation['samplers'][channel['sampler']]['input']]
    return {'frameCount': accessor['count'], 'durationSeconds': accessor['max'][0],
            'sizeBytes': len(binary), 'sha256': hashlib.sha256(binary).hexdigest()}


def estimate_model(hand_motion=None):
    samples = []
    calibration_paths = [ROOT / 'public' / clip['path'] for entry in json.loads(MANIFEST.read_text())['duos']
                         if hand_motion is None or entry.get('handMotion') == hand_motion
                         for clip in entry['clips'].values()] if MANIFEST.exists() else sorted(MANIFEST.parent.glob('*.glb'))
    for path in calibration_paths:
        binary, gltf = glb_document(path)
        # Calibrate against the motion clip; the old pilot files also carry an
        # unused template action, whose fixed overhead is included in their size.
        animation = gltf['animations'][0]
        count = max(gltf['accessors'][sampler['input']]['count'] for sampler in animation['samplers'])
        samples.append({'frameCount': count, 'sizeBytes': len(binary)})
    if not samples:
        raise ValueError('No exported clips available to estimate disk size')
    x = np.array([[1, sample['frameCount']] for sample in samples])
    if np.linalg.matrix_rank(x) < 2:
        raise ValueError('At least two different clip lengths are required for disk estimation')
    base, per_frame = np.linalg.lstsq(x, [sample['sizeBytes'] for sample in samples], rcond=None)[0]
    if base < 0 or per_frame < 0:
        raise ValueError('Invalid disk-size calibration')
    return {'baseBytes': float(base), 'bytesPerFrame': float(per_frame)}


def entry_for(source, recording, model):
    group, variation, action, take = RECORDING.fullmatch(recording).groups()
    pair = read_pair(source, recording)
    count = len(pair[0]['trans'])
    samples = math.ceil(count / (SOURCE_FPS // TARGET_FPS))
    action_def = actions()[int(action[1:])]
    source_files = {person: PUBLISHED.get(recording, {}).get('source', {}).get(person, f'{recording}/{person.upper()}.npz') for person in ('p1', 'p2')}
    return {
        'id': f'interx-{recording.lower()}', 'actionCode': action, 'variation': variation,
        'source': {'recording': recording, 'group': group, 'take': take, **source_files,
                   'frameCount': count, 'sha256': {person: hashlib.sha256((source / path).read_bytes()).hexdigest() for person, path in source_files.items()}},
        'clips': {person: {'path': f'animations/npz/interx/{recording.lower()}-{person}.glb'} for person in ('p1', 'p2')},
        'rootMotion': {'mode': 'relative-to-first-frame', 'translationUnit': 'meters', 'upAxis': 'Y'},
        'start_offset': (pair[1]['trans'][0].astype(np.float64) - pair[0]['trans'][0].astype(np.float64)).tolist(),
        'tags': PUBLISHED.get(recording, {}).get('tags', ['inter-x', 'duo', *action_def['tags']]),
        'expectedFrameCount': samples, 'expectedDurationSeconds': (samples - 1) / TARGET_FPS,
        'estimatedBytes': round(2 * (model['baseBytes'] + model['bytesPerFrame'] * samples)),
    }


def report(selection, entries=None):
    entries = selection['duos'] if entries is None else entries
    for action in selection['actions']:
        selected = [entry for entry in entries if entry['actionCode'] == action['code']]
        print(f"{action['code']} {action['label']}: {len(selected)} duos / {2 * len(selected)} GLB / ~{sum(entry['estimatedBytes'] for entry in selected) / 1e6:.2f} Mo")
        for entry in selected:
            print(f"  {entry['source']['recording']} {entry['expectedDurationSeconds']:.3f}s offset(m)={entry['start_offset']}")
    print(f"TOTAL: {len(entries)} duos / {2 * len(entries)} GLB / ~{sum(entry['estimatedBytes'] for entry in entries) / 1e6:.2f} Mo (estimation)")
