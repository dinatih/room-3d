"""Sample Pollen's ONNX policies using its CPU MuJoCo inference script (--no-bam).
Usage: python scripts/import-microduck-motion.py RL_REPO POLICY_DIR OUTPUT_JSON
Requires numpy, scipy, mujoco, onnxruntime. See docs/microduck.md.
"""
import importlib.util
import json
from pathlib import Path
import sys
import mujoco
import numpy as np

repo, policies, output = map(Path, sys.argv[1:])
spec = importlib.util.spec_from_file_location('official_infer', repo / 'scripts/infer_policy.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
model = mujoco.MjModel.from_xml_path(str(repo / 'src/mjlab_microduck/robot/microduck/scene.xml'))
model.opt.timestep = 0.005
joints = [int(model.actuator_trnid[i, 0]) for i in range(model.nu)]
metadata = [dict(name=model.joint(j).name, node=model.body(model.jnt_bodyid[j]).name,
                 axis=model.jnt_axis[j].tolist(), rotation=model.body_quat[model.jnt_bodyid[j]].tolist()) for j in joints]

def sample(kind, seconds):
    data = mujoco.MjData(model)
    policy = module.PolicyInference(model, data, walking_onnx_path=str(policies / 'velstand.onnx'),
        sitstand_onnx_path=str(policies / 'alpha_sitstand.onnx'),
        ground_pick_onnx_path=str(policies / 'alpha_ground_pick.onnx'),
        new_cmd_obs=True, use_projected_gravity=True)
    data.qpos[:7] = [0, 0, 0.125, 1, 0, 0, 0]
    data.qpos[policy.joint_qpos_indices] = policy.default_pose
    policy.set_position_targets(policy.default_pose)
    mujoco.mj_forward(model, data)
    frames = []
    for tick in range(round((3 + seconds) * 50) + 1):
        if tick == 150:
            if kind == 'sit-stand': policy.toggle_sit()
            if kind == 'grab': policy.trigger_ground_pick()
            if kind == 'walk': policy.set_vel_cmd(0.3, 0, 0)
        if kind == 'sit-stand' and tick == 350: policy.toggle_sit()
        policy.update_ground_pick_phase(0.02)
        policy.apply_action(policy.infer())
        for _ in range(4): mujoco.mj_step(model, data)
        if tick >= 150:
            if not np.isfinite(data.qpos).all(): raise ValueError('Invalid simulation pose')
            frames.append(data.qpos.copy())
    return np.array(frames)

clips = {kind: sample(kind, seconds) for kind, seconds in [('idle', 1), ('sit-stand', 7), ('grab', 4), ('walk', 8)]}
walk = clips['walk'][200:]  # Let the velocity command settle for four seconds.
# Rising hip-pitch midline crossings identify full strides, including both feet.
hip = walk[:, 9]
midpoint = (hip.min() + hip.max()) / 2
crossings = np.flatnonzero((hip[:-1] < midpoint) & (hip[1:] >= midpoint))
if len(crossings) < 2: raise ValueError('Walking policy did not produce a gait')
start, end = min(zip(crossings[:-1], crossings[1:]), key=lambda pair: np.linalg.norm(walk[pair[0], 7:] - walk[pair[1], 7:]))
walk = walk[start:end + 1].copy()
speed = np.linalg.norm(walk[-1, :2] - walk[0, :2]) / ((len(walk) - 1) / 50) * 100
# Remove horizontal travel/yaw; RobotPlacements supplies world movement and heading.
for name, frames in clips.items():
    if name == 'walk': frames = walk
    xy = frames[0, :2].copy()
    if name == 'walk':
        frames[:, :2] -= np.linspace(frames[0, :2], frames[-1, :2], len(frames))
        from scipy.spatial.transform import Rotation
        rotations = Rotation.from_quat(frames[:, [4, 5, 6, 3]])
        eulers = rotations.as_euler('xyz')
        eulers[:, 2] = 0
        frames[:, 3:7] = Rotation.from_euler('xyz', eulers).as_quat()[:, [3, 0, 1, 2]]
        frames[-1] = frames[0]
    else:
        frames[:, :2] -= xy
    clips[name] = frames.tolist()
Path(output).write_text(json.dumps(dict(hz=50, speed=speed, joints=metadata, clips=clips)))
print('Exported', {k: len(v) for k, v in clips.items()}, 'walk speed cm/s:', speed)
