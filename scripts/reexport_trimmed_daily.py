"""Re-export all 28 daily and studio animations trimming calibration phases (T-pose and static freezes).

Usage:
  blender --background --python scripts/reexport_trimmed_daily.py
"""

import math
import struct
import json
import re
from pathlib import Path
import bpy
import numpy as np
from mathutils import Quaternion, Vector

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / 'public/animations/mixamo/anim_salsa_dancing.glb'
OUTPUT_DIR = ROOT / 'public/animations/npz/daily'
REGISTRY_PATH = ROOT / 'src/features/scene/animations/animationRegistry.ts'

BONE_NAMES = [
    'mixamorig:Hips', 'mixamorig:LeftUpLeg', 'mixamorig:RightUpLeg', 'mixamorig:Spine',
    'mixamorig:LeftLeg', 'mixamorig:RightLeg', 'mixamorig:Spine1', 'mixamorig:LeftFoot',
    'mixamorig:RightFoot', 'mixamorig:Spine2', 'mixamorig:LeftToeBase', 'mixamorig:RightToeBase',
    'mixamorig:Neck', 'mixamorig:LeftShoulder', 'mixamorig:RightShoulder', 'mixamorig:Head',
    'mixamorig:LeftArm', 'mixamorig:RightArm', 'mixamorig:LeftForeArm', 'mixamorig:RightForeArm',
    'mixamorig:LeftHand', 'mixamorig:RightHand',
]

MIXAMO_TRANSLATION_SCALE = 1.17
ROOT_CANCEL = Quaternion((1, 0, 0), -math.pi / 2)


def rodrigues_to_quat(rotation):
    angle = float(np.linalg.norm(rotation))
    if angle < 1e-8:
        return Quaternion((1, 0, 0, 0))
    axis = rotation / angle
    sine = math.sin(angle / 2)
    return Quaternion((math.cos(angle / 2), *(float(x * sine) for x in axis)))


def find_trim_range(poses, fps):
    diffs = np.linalg.norm(np.diff(poses, axis=0), axis=1) # (N-1,)
    w = max(2, int(round(fps * 0.15))) # 150ms window
    smooth_v = np.convolve(diffs, np.ones(w)/w, mode='same')
    
    # Arm norms
    arm_norms = np.linalg.norm(poses[:, 16*3:17*3], axis=1) + np.linalg.norm(poses[:, 17*3:18*3], axis=1)
    
    n = len(diffs)
    mid_v = np.median(smooth_v[int(n*0.2):int(n*0.8)])
    thresh = max(0.010, mid_v * 0.30)
    
    # 1. Start frame: scan forward up to 3.5s
    start_frame = 0
    max_search_start = min(n, int(3.5 * fps))
    is_tpose_start = (arm_norms[0] < 0.65)
    
    for i in range(max_search_start):
        if is_tpose_start:
            if arm_norms[i] > 0.85 and smooth_v[i] > thresh:
                start_frame = i
                break
        else:
            if smooth_v[i] > thresh:
                start_frame = i
                break
                
    # 2. End frame: scan backward up to 3.5s
    end_frame = len(poses) - 1
    max_search_end = max(start_frame + int(fps * 0.5), len(poses) - int(3.5 * fps))
    for i in range(len(smooth_v) - 1, max_search_end, -1):
        if smooth_v[i] > thresh:
            end_frame = i + 1
            break
            
    return start_frame, end_frame


def convert_trimmed(npz_path: Path, output_path: Path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(TEMPLATE))
    armatures = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    if not armatures:
        raise RuntimeError("No armature found in template")
    armature = armatures[0]
    armature.animation_data_clear()
    armature.animation_data_create()
    armature.animation_data.action = bpy.data.actions.new(name='ArmatureAction')
    scene = bpy.context.scene
    scene.render.fps = 30
    for bone in armature.pose.bones:
        bone.rotation_mode = 'QUATERNION'

    with np.load(npz_path) as data:
        raw_poses = data['poses']
        raw_trans = data['trans']
        if 'mocap_frame_rate' in data:
            fps = float(data['mocap_frame_rate'])
        elif 'mocap_framerate' in data:
            fps = float(data['mocap_framerate'])
        elif 'fps' in data:
            fps = float(data['fps'])
        else:
            fps = 120.0

    start_frame, end_frame = find_trim_range(raw_poses, fps)
    poses = raw_poses[start_frame:end_frame]
    translations = raw_trans[start_frame:end_frame]

    target_fps = 30.0
    duration_sec = len(poses) / fps
    num_frames = max(1, int(round(duration_sec * target_fps)))

    bases = [armature.data.bones[name].matrix_local.to_3x3() for name in BONE_NAMES]
    hips = armature.pose.bones[BONE_NAMES[0]]

    # Center character at origin facing forward at trimmed frame 0
    q0 = ROOT_CANCEL @ rodrigues_to_quat(poses[0, :3])
    initial_yaw = q0.to_euler().y
    YAW_CANCEL = Quaternion((0, 1, 0), -initial_yaw)

    start_trans_x = float(translations[0][0])
    start_trans_z = -float(translations[0][1])

    for frame in range(1, num_frames + 1):
        t_sec = (frame - 1) / target_fps
        source_frame = min(len(poses) - 1, int(round(t_sec * fps)))
        pose = poses[source_frame]
        translation = translations[source_frame]

        for index, name in enumerate(BONE_NAMES):
            rotation = rodrigues_to_quat(pose[index * 3:(index + 1) * 3])
            if index == 0:
                rotation = YAW_CANCEL @ ROOT_CANCEL @ rotation
            basis = bases[index]
            bone = armature.pose.bones[name]
            bone.rotation_quaternion = (basis.inverted() @ rotation.to_matrix() @ basis).to_quaternion()
            bone.keyframe_insert(data_path='rotation_quaternion', frame=frame)

        # Centered world hips
        raw_x = float(translation[0]) - start_trans_x
        raw_y = float(translation[2])
        raw_z = -float(translation[1]) - start_trans_z

        rot_trans = YAW_CANCEL.to_matrix() @ Vector((raw_x, 0, raw_z))
        world_hips = Vector((rot_trans.x, raw_y, rot_trans.z))

        hips.location = world_hips * (100 * MIXAMO_TRANSLATION_SCALE) - hips.bone.head
        hips.keyframe_insert(data_path='location', frame=frame)

    scene.frame_start = 1
    scene.frame_end = num_frames
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output_path), export_format='GLB', export_animations=True)

    data = output_path.read_bytes()
    json_length, = struct.unpack_from('<I', data, 12)
    gltf = json.loads(data[20:20 + json_length])
    inputs = {s['input'] for a in gltf['animations'] for s in a['samplers']}
    duration = round(max(gltf['accessors'][i]['max'][0] for i in inputs), 1)
    
    cut_start_s = round(start_frame / fps, 2)
    cut_end_s = round((len(raw_poses) - end_frame) / fps, 2)
    return {
        'frames': num_frames,
        'duration': duration,
        'size_kb': round(len(data) / 1024),
        'cut_start_s': cut_start_s,
        'cut_end_s': cut_end_s,
    }


def main():
    meta_daily = json.loads((OUTPUT_DIR / "daily_meta.json").read_text())
    meta_studio = json.loads((OUTPUT_DIR / "studio_meta.json").read_text())
    all_items = meta_daily + meta_studio

    print(f"Starting trimmed re-export of {len(all_items)} animations...")
    registry_text = REGISTRY_PATH.read_text(encoding='utf-8')
    updated_items = []

    for idx, item in enumerate(all_items, 1):
        src_path = Path(item['src'])
        dst_path = OUTPUT_DIR / item['filename']
        print(f"[{idx}/{len(all_items)}] Re-exporting {item['id']}...")
        res = convert_trimmed(src_path, dst_path)
        print(f"   Trimmed: cut start {res['cut_start_s']}s, cut end {res['cut_end_s']}s -> {res['frames']}f / {res['duration']}s ({res['size_kb']}KB)")
        updated_items.append({**item, **res})

        # Update duration in animationRegistry.ts
        pattern = re.compile(rf"(id:\s*'{re.escape(item['id'])}'[\s\S]*?duration:\s*)([\d.]+)", re.MULTILINE)
        registry_text = pattern.sub(rf"\g<1>{res['duration']}", registry_text)

    REGISTRY_PATH.write_text(registry_text, encoding='utf-8')
    (OUTPUT_DIR / "all_trimmed_meta.json").write_text(json.dumps(updated_items, indent=2, ensure_ascii=False))
    print("\nAll done! Animations trimmed and registry updated.")


if __name__ == '__main__':
    main()
