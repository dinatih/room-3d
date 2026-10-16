"""Reconstruct published Inter-X pairs with gendered SMPL-X models and NumPy.

Full axis-angle hands, neutral face/expression. Outputs measurements and joint
trajectories in /tmp; model files and reconstructed meshes stay outside the app.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from interx_catalog import DEFAULT_SOURCE, MANIFEST, RECORDING


def rotations(vectors):
    angles = np.linalg.norm(vectors, axis=-1)
    axes = np.divide(vectors, angles[..., None], out=np.zeros_like(vectors), where=angles[..., None] != 0)
    cross = np.zeros((*angles.shape, 3, 3))
    cross[..., 0, 1], cross[..., 0, 2] = -axes[..., 2], axes[..., 1]
    cross[..., 1, 0], cross[..., 1, 2] = axes[..., 2], -axes[..., 0]
    cross[..., 2, 0], cross[..., 2, 1] = -axes[..., 1], axes[..., 0]
    return np.eye(3) + np.sin(angles)[..., None, None] * cross + (1 - np.cos(angles))[..., None, None] * (cross @ cross)


def reconstruct(model, motion, measure_all_soles=True):
    beta = motion['betas'].reshape(-1)
    shaped = model['v_template'] + np.einsum('vck,k->vc', model['shapedirs'][:, :, :len(beta)], beta)
    rest = model['J_regressor'] @ shaped
    parents = model['kintree_table'][0].astype(np.int64)
    if any(not 0 <= parents[joint] < joint for joint in range(1, 55)):
        raise ValueError('Invalid SMPL-X joint hierarchy')
    count = len(motion['trans'])
    pose = np.concatenate((motion['root_orient'][:, None], motion['pose_body'],
                           np.zeros((count, 3, 3)), motion['pose_lhand'], motion['pose_rhand']), axis=1)
    matrices = rotations(pose.astype(np.float64))
    world = np.empty_like(matrices)
    joints = np.empty((count, 55, 3))
    world[:, 0], joints[:, 0] = matrices[:, 0], rest[0]
    for joint in range(1, 55):
        parent = parents[joint]
        world[:, joint] = world[:, parent] @ matrices[:, joint]
        joints[:, joint] = joints[:, parent] + np.einsum('fij,j->fi', world[:, parent], rest[joint] - rest[parent])
    # Canonical SMPL-X ankles and toes. Skin their vertices to measure the soles.
    feet = np.flatnonzero(np.any(model['weights'][:, [7, 8, 10, 11]] > 0, axis=1))
    weights = model['weights'][feet]
    pose_directions = model['posedirs'][feet].reshape(-1, 486)
    sole_y = []
    for frame in range(count if measure_all_soles else 1):
        posed = shaped[feet] + (pose_directions @ (matrices[frame, 1:] - np.eye(3)).reshape(-1)).reshape(-1, 3)
        blended = np.einsum('vj,jab->vab', weights, world[frame])
        offsets = joints[frame] - np.einsum('jab,jb->ja', world[frame], rest)
        vertices = np.einsum('vab,vb->va', blended, posed) + weights @ offsets + motion['trans'][frame]
        sole_y.append(float(vertices[:, 1].min()))
    joints += motion['trans'][:, None]
    if not np.isfinite(joints).all() or not np.isfinite(sole_y).all():
        raise ValueError('Non-finite reconstructed motion')
    return shaped, rest, joints, np.array(sole_y)


def find_height_pairs(source, models, hashes, action_codes, output):
    first_takes = {}
    for folder in sorted(source.iterdir()):
        if not folder.is_dir():
            continue
        match = RECORDING.fullmatch(folder.name)
        if not match:
            raise ValueError(f'Invalid recording folder: {folder}')
        group, session, action, take = match.groups()
        if action in action_codes:
            first_takes.setdefault((group, session, action), folder.name)
    heights, candidates = {}, {action: [] for action in action_codes}
    for (group, session, action), recording in sorted(first_takes.items()):
        people = []
        for person in ('P1', 'P2'):
            with np.load(source / recording / f'{person}.npz', allow_pickle=False) as data:
                gender = str(data['gender'].item())
                beta = data['betas'].reshape(-1).astype(np.float64)
                frames = len(data['trans'])
            if not np.isfinite(beta).all() or frames < 1:
                raise ValueError(f'Invalid morphology: {recording}/{person}')
            key = (gender, tuple(beta))
            if key not in heights:
                model = models[gender]
                shaped = model['v_template'] + np.einsum('vck,k->vc', model['shapedirs'][:, :, :len(beta)], beta)
                heights[key] = float(np.ptp(shaped[:, 1]) * 100)
            people.append({'participant': person, 'gender': gender, 'heightCm': heights[key], 'frames': frames})
        if people[0]['frames'] != people[1]['frames']:
            raise ValueError(f'Participants out of sync: {recording}')
        candidates[action].append({'recording': recording, 'group': group, 'variation': session,
                                   'participants': people, 'heightDifferenceCm': abs(people[0]['heightCm'] - people[1]['heightCm'])})
    for action, pairs in candidates.items():
        if not pairs:
            raise ValueError(f'No candidates for {action}')
        pairs.sort(key=lambda item: (item['heightDifferenceCm'], item['recording']))
        by_group = {}
        for pair in pairs:
            by_group.setdefault(pair['group'], pair)
        print(f'{action}: {len(pairs)} first takes, {len(by_group)} groups, {len({item["variation"] for item in pairs})} T variations', flush=True)
        # Display one representative per group; retain all takes in the JSON ranking.
        for pair in by_group.values():
            a, b = (item['heightCm'] for item in pair['participants'])
            print(f"  {pair['recording']}: P1 {a:.2f} cm, P2 {b:.2f} cm, gap {pair['heightDifferenceCm']:.2f} cm", flush=True)
    output.write_text(json.dumps({'models': hashes, 'takePolicy': 'first-available-per-G-T-A',
                                 'ranking': 'ascending-height-difference', 'actions': candidates}, indent=2) + '\n')
    print(f'Full ranking: {output}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--models', type=Path, default=Path('/home/dinatih/3D Resources/animations'))
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--report', type=Path, default=Path('/tmp/interx-smplx-report.json'))
    parser.add_argument('--reference', type=Path, default=Path('/tmp/interx-smplx-reference.json'))
    parser.add_argument('--find-similar-heights', nargs='+', choices=[f'A{index:03d}' for index in range(40)])
    parser.add_argument('--ranking-report', type=Path, default=Path('/tmp/interx-height-candidates.json'))
    parser.add_argument('--placement-selection', type=Path, help='Measure first-frame source soles for a selection, without publishing it')
    args = parser.parse_args()
    models, hashes = {}, {}
    for gender in ('female', 'male', 'neutral'):
        path = args.models / f'SMPLX_{gender.upper()}.npz'
        with np.load(path, allow_pickle=False) as data:
            models[gender] = {key: data[key].astype(np.float64) for key in
                             ('v_template', 'shapedirs', 'posedirs', 'J_regressor', 'weights', 'kintree_table')}
        model = models[gender]
        if model['v_template'].shape != (10475, 3) or model['J_regressor'].shape != (55, 10475) or model['posedirs'].shape != (10475, 3, 486):
            raise ValueError(f'Unexpected SMPL-X topology: {path}')
        if not all(np.isfinite(array).all() for array in model.values()):
            raise ValueError(f'Non-finite model: {path}')
        np.testing.assert_allclose(model['weights'].sum(axis=1), 1, atol=1e-6)
        # Independent invariants: zero pose reproduces the shaped rest joints
        # and unposed soles; root translation moves them by exactly that vector.
        zero = {'betas': np.zeros((1, 10)), 'trans': np.zeros((1, 3)),
                'root_orient': np.zeros((1, 3)), 'pose_body': np.zeros((1, 21, 3)),
                'pose_lhand': np.zeros((1, 15, 3)), 'pose_rhand': np.zeros((1, 15, 3))}
        shaped, rest, joints, soles = reconstruct(model, zero)
        np.testing.assert_allclose(joints[0], rest, atol=1e-12)
        foot_mask = np.any(model['weights'][:, [7, 8, 10, 11]] > 0, axis=1)
        np.testing.assert_allclose(soles[0], shaped[foot_mask, 1].min(), atol=1e-6)
        shifted = {**zero, 'trans': np.array([[1., 2., 3.]])}
        _, _, moved_joints, moved_soles = reconstruct(model, shifted)
        np.testing.assert_allclose(moved_joints - joints, np.broadcast_to(shifted['trans'][:, None], joints.shape), atol=1e-12)
        np.testing.assert_allclose(moved_soles - soles, [2.], atol=1e-12)
        hashes[gender] = {'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
    if args.find_similar_heights:
        find_height_pairs(args.source, models, hashes, args.find_similar_heights, args.ranking_report)
        return
    if args.placement_selection:
        result = {}
        for duo in json.loads(args.placement_selection.read_text())['duos']:
            soles, wrists, starts = [], [], []
            contacts = duo['actionCode'] in {'A009', 'A025', 'A026', 'A027', 'A028', 'A035'}
            for person in ('p1', 'p2'):
                with np.load(args.source / duo['source'][person], allow_pickle=False) as data:
                    motion = {key: data[key].copy() for key in data.files}
                for key in ('trans', 'root_orient', 'pose_body', 'pose_lhand', 'pose_rhand'):
                    motion[key] = motion[key][::4] if contacts else motion[key][:1]
                starts.append(motion['trans'][0].astype(np.float64))
                _, _, joints, feet = reconstruct(models[str(motion['gender'].item())], motion, measure_all_soles=False)
                soles.append(float(feet[0]))
                wrists.append(joints[:, [20, 21]])
            floor = min(soles)
            result[duo['id']] = {'sourceInitialSolesMeters': soles, 'sourceReferencePlaneMeters': floor,
                                 'initialSoleHeightMeters': [value - floor for value in soles]}
            if contacts:
                origin = np.array([starts[0][0], floor, starts[0][2]])
                result[duo['id']]['wristTargetsMeters'] = {
                    person: (positions - origin - (start - starts[0])).tolist()
                    for person, positions, start in zip(('p1', 'p2'), wrists, starts)}
        selection = json.loads(args.placement_selection.read_text())
        args.report.write_text(json.dumps({'models': hashes,
                                          'sourceSha256': {entry['id']: entry['source']['sha256'] for entry in selection['duos']},
                                          'duos': result}, indent=2) + '\n')
        return
    report, reference = [], []
    for duo in json.loads(MANIFEST.read_text())['duos']:
        people, trajectories = [], []
        for person in ('p1', 'p2'):
            with np.load(args.source / duo['source'][person], allow_pickle=False) as data:
                motion = {key: data[key] for key in data.files}
            gender = str(motion['gender'].item())
            print(f"Reconstructing {duo['id']} {person} ({gender})", flush=True)
            shaped, rest, joints, feet = reconstruct(models[gender], motion)
            people.append({'participant': person, 'gender': gender,
                           'shapedTemplateHeightCm': float(np.ptp(shaped[:, 1]) * 100),
                           'restPelvisCm': (rest[0] * 100).tolist(),
                           'initialTransYCm': float(motion['trans'][0, 1] * 100),
                           'initialPelvisYCm': float(joints[0, 0, 1] * 100),
                           'initialSoleYCm': float(feet[0] * 100),
                           'soleRangeCm': [float(feet.min() * 100), float(feet.max() * 100)]})
            trajectories.append({'hips': joints[::4, 0].tolist(), 'wrists': joints[::4, [20, 21]].tolist(), 'soleY': feet[::4].tolist()})
        a, b = (np.asarray(item['wrists']) for item in trajectories)
        distances = np.linalg.norm(a[:, :, None] - b[:, None], axis=-1)
        closest = np.unravel_index(np.argmin(distances), distances.shape)
        item = {'id': duo['id'], 'participants': people,
                'initialPelvisDeltaYCm': people[1]['initialPelvisYCm'] - people[0]['initialPelvisYCm'],
                'closestWrists': {'frame30fps': int(closest[0]), 'p1Side': ['left', 'right'][closest[1]],
                                  'p2Side': ['left', 'right'][closest[2]], 'distanceCm': float(distances[closest] * 100)}}
        report.append(item)
        reference.append({'id': duo['id'], 'participants': trajectories})
        print(json.dumps(item, ensure_ascii=False, indent=2), flush=True)
    args.report.write_text(json.dumps({'models': hashes,
                                     'assumptions': {'units': 'meters', 'upAxis': 'Y', 'handPose': 'full-axis-angle', 'faceAndExpression': 'neutral',
                                                     'heightMeasurement': 'shaped template vertical extent, before animation'},
                                     'duos': report}, indent=2) + '\n')
    args.reference.write_text(json.dumps(reference) + '\n')


if __name__ == '__main__':
    main()
