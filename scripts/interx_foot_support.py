"""Remove persistent heel-support dorsiflexion from standing SMPL-X motion."""
import numpy as np
from functools import lru_cache

FOOT_SUPPORT_METHOD = 'heel-support-envelope-v1'


@lru_cache
def load_model(path):
    with np.load(path, allow_pickle=False) as data:
        return {key: data[key] for key in ['v_template', 'shapedirs', 'J_regressor', 'kintree_table', 'weights']}


def rotations(vectors):
    angles = np.linalg.norm(vectors, axis=-1)
    axes = np.divide(vectors, angles[..., None], out=np.zeros_like(vectors), where=angles[..., None] != 0)
    cross = np.zeros((*angles.shape, 3, 3))
    cross[..., 0, 1], cross[..., 0, 2] = -axes[..., 2], axes[..., 1]
    cross[..., 1, 0], cross[..., 1, 2] = axes[..., 2], -axes[..., 0]
    cross[..., 2, 0], cross[..., 2, 1] = -axes[..., 1], axes[..., 0]
    return np.eye(3) + np.sin(angles)[..., None, None] * cross + (1 - np.cos(angles))[..., None, None] * (cross @ cross)


def quaternion(matrix):
    a, b, c = matrix[0]; d, e, f = matrix[1]; g, h, i = matrix[2]
    symmetric = np.array([[a-e-i, b+d, c+g, h-f], [b+d, e-a-i, f+h, c-g],
                          [c+g, f+h, i-a-e, d-b], [h-f, c-g, d-b, a+e+i]])
    q = np.linalg.eigh(symmetric)[1][:, -1]
    if q[3] < 0:
        q = -q
    return q


def quaternion_matrix(q):
    x, y, z, w = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
                     [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
                     [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])


def axis_angle(matrix):
    q = quaternion(matrix)
    length = np.linalg.norm(q[:3])
    return q[:3] * (2 * np.arctan2(length, q[3]) / length) if length else np.zeros(3)


def correct_foot_support(motion, model):
    beta = motion['betas'].reshape(-1)
    shaped = model['v_template'] + np.einsum('vck,k->vc', model['shapedirs'][:, :, :len(beta)], beta)
    rest = model['J_regressor'] @ shaped
    local = rotations(np.concatenate((motion['root_orient'][:, None], motion['pose_body'].reshape(-1, 21, 3)), axis=1).astype(float))
    world = np.empty_like(local); joints = np.empty((*local.shape[:2], 3))
    world[:, 0] = local[:, 0]; joints[:, 0] = rest[0] + motion['trans']
    parents = model['kintree_table'][0].astype(np.int64)
    for joint in range(1, 22):
        parent = parents[joint]
        world[:, joint] = world[:, parent] @ local[:, joint]
        joints[:, joint] = joints[:, parent] + np.einsum('fij,j->fi', world[:, parent], rest[joint] - rest[parent])
    feet = []
    dominant = model['weights'].argmax(axis=1)
    for ankle, toe in [(7, 10), (8, 11)]:
        vertices = shaped[(dominant == ankle) | (dominant == toe)]
        forward = rest[toe] - rest[ankle]; forward[1] = 0; forward /= np.linalg.norm(forward)
        sole_y = vertices[:, 1].min()
        heel = vertices[np.argmin(vertices @ forward)].copy(); heel[1] = sole_y
        tip = vertices[np.argmax(vertices @ forward)].copy(); tip[1] = sole_y
        heel = joints[:, ankle] + np.einsum('fij,j->fi', world[:, ankle], heel - rest[ankle])
        tip = joints[:, toe] + np.einsum('fij,j->fi', world[:, toe], tip - rest[toe])
        direction = np.einsum('fij,j->fi', world[:, ankle], forward)
        pitch = np.arctan2(direction[:, 1], np.linalg.norm(direction[:, [0, 2]], axis=1))
        feet.append((ankle, heel, tip, direction, pitch, rest[ankle, 1] - sole_y))
    # Standing sequences have at least one supporting foot. Fit their shared
    # floor to the lower sole envelope, rather than one noisy minimum sample.
    floor = np.median(np.minimum.reduce([point[:, 1] for _, heel, tip, *_ in feet for point in [heel, tip]]))
    body = motion['pose_body'].reshape(-1, 21, 3).copy()
    report = []
    for ankle, heel, tip, direction, pitch, sole_height in feet:
        if sole_height <= 0 or not np.isfinite(heel).all():
            raise ValueError('Invalid SMPL-X sole geometry')
        weight = np.clip(1 - np.maximum(heel[:, 1] - floor, 0) / sole_height, 0, 1)
        correction = np.zeros(len(pitch))
        bounds = np.flatnonzero(np.diff(np.r_[False, weight > 0, False]))
        for start, end in bounds.reshape(-1, 2):
            signal = pitch[start:end]
            minima = np.flatnonzero((signal[1:-1] <= signal[:-2]) & (signal[1:-1] < signal[2:])) + 1
            anchors = np.unique(np.r_[signal.argmin(), minima])
            # The lower envelope removes a sustained positive bias, while
            # retaining heel-strike peaks between neutral support minima.
            bias = np.interp(np.arange(len(signal)), anchors, np.maximum(signal[anchors], 0))
            correction[start:end] = np.minimum(np.maximum(signal, 0), bias * weight[start:end])
        active = np.flatnonzero(correction)
        axes = np.cross(np.array([0., 1., 0.]), direction[active]); axes[:, 1] = 0
        axes /= np.linalg.norm(axes, axis=1)[:, None]
        corrected = world[active, parents[ankle]].transpose(0, 2, 1) @ rotations(axes * correction[active, None]) @ world[active, ankle]
        for frame, matrix in zip(active, corrected):
            body[frame, ankle - 1] = axis_angle(matrix)
        report.append({'ankle': ankle, 'pitch': np.degrees(pitch), 'correction': np.degrees(correction), 'support': weight, 'floor': float(floor)})
    return {**motion, 'pose_body': body.reshape(motion['pose_body'].shape)}, report
