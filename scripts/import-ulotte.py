"""Convert Ulotte's original FBX archive to an animated, textured GLB.

blender -b -noaudio -t 2 --python scripts/import-ulotte.py -- /path/to/dashshund-dog.zip
"""
import json
import math
import sys
import tempfile
import zipfile
from pathlib import Path
from mathutils import Quaternion, Vector

import bpy

archive_path = Path(sys.argv[sys.argv.index('--') + 1])
output = Path(__file__).resolve().parents[1] / 'public/characters/ulotte/ulotte.glb'
with tempfile.TemporaryDirectory(prefix='room-ulotte-') as directory:
    root = Path(directory)
    with zipfile.ZipFile(archive_path) as archive:
        archive.extractall(root)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(root / 'source/Dashshund.fbx'))
    rig = bpy.data.objects['Armature']
    rig.animation_data.action = bpy.data.actions['Armature|Armature|Idle_1']
    bpy.context.scene.frame_set(1)
    for image in bpy.data.images:
        image.filepath = str(root / 'textures' / ('Dash_Specular.png' if image.name == 'Dash_Specular' else image.name))
        image.reload()
    for material in bpy.data.materials:
        nodes = material.node_tree.nodes
        shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
        shader.inputs['Metallic'].default_value = 0
        shader.inputs['Roughness'].default_value = 0.8
        shader.inputs['Alpha'].default_value = 1
        texture = nodes.new('ShaderNodeTexImage')
        texture.image = bpy.data.images['Dach_Diff.png']
        material.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])

    # Shift cyclic animations so frame 7 becomes frame 1 without freeze
    def shift_action(action, offset_frames, end_frame):
        for layer in action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    for fc in cb.fcurves:
                        for kp in fc.keyframe_points:
                            kp.co[0] -= offset_frames
                            kp.handle_left[0] -= offset_frames
                            kp.handle_right[0] -= offset_frames
        action.use_frame_range = True
        action.frame_start = 1
        action.frame_end = end_frame

    # Walk cycle: frames 7..31 in FBX -> 24 frames (1..24)
    shift_action(bpy.data.actions['Armature|Armature|Walk'], 6, 24)
    # Run cycle: frames 7..23 in FBX -> 16 frames (1..16)
    shift_action(bpy.data.actions['Armature|Armature|Run'], 6, 16)

    # Jump: blend frames 22..27 smoothly back to frame 1 to eliminate loop jump/freeze
    jump = bpy.data.actions['Armature|Armature|Jump']
    rig.animation_data.action = jump
    bpy.context.scene.frame_set(1)
    p_stand = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in rig.pose.bones}
    bpy.context.scene.frame_set(21)
    p21 = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in rig.pose.bones}
    blend_steps = 6
    for step in range(1, blend_steps + 1):
        f = 21 + step
        t = step / blend_steps
        alpha = t * t * (3 - 2 * t)
        bpy.context.scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.location = p21[pb.name][0].lerp(p_stand[pb.name][0], alpha)
            pb.rotation_quaternion = p21[pb.name][1].slerp(p_stand[pb.name][1], alpha)
            pb.scale = p21[pb.name][2].lerp(p_stand[pb.name][2], alpha)
            pb.keyframe_insert(data_path="location", frame=f)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
            pb.keyframe_insert(data_path="scale", frame=f)
    jump.use_frame_range = True
    jump.frame_start = 1
    jump.frame_end = 21 + blend_steps

    # Eating: smooth return transition (frames 50..57) back to start pose so it loops seamlessly
    eating = bpy.data.actions['Armature|Armature|Eating']
    rig.animation_data.action = eating
    bpy.context.scene.frame_set(1)
    p_eat1 = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in rig.pose.bones}
    bpy.context.scene.frame_set(49)
    p_eat49 = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in rig.pose.bones}
    eat_blend_steps = 8
    for step in range(1, eat_blend_steps + 1):
        f = 49 + step
        t = step / eat_blend_steps
        alpha = t * t * (3 - 2 * t)
        bpy.context.scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.location = p_eat49[pb.name][0].lerp(p_eat1[pb.name][0], alpha)
            pb.rotation_quaternion = p_eat49[pb.name][1].slerp(p_eat1[pb.name][1], alpha)
            pb.scale = p_eat49[pb.name][2].lerp(p_eat1[pb.name][2], alpha)
            pb.keyframe_insert(data_path="location", frame=f)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
            pb.keyframe_insert(data_path="scale", frame=f)
    eating.use_frame_range = True
    eating.frame_start = 1
    eating.frame_end = 49 + eat_blend_steps

    # Snapshot of sit pose (Idle_2 frame 1)
    rig.animation_data.action = bpy.data.actions['Armature|Armature|Idle_2']
    bpy.context.scene.frame_set(1)
    p_sit = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in rig.pose.bones}

    # Snapshot of lay pose (relaxed sit lowered to ground)
    p_lay = {pb.name: (pb.location.copy(), pb.rotation_quaternion.copy(), pb.scale.copy()) for pb in rig.pose.bones}
    p_lay['BodyHandle'] = (p_sit['BodyHandle'][0] + Vector((0, 0, 0.05)), p_sit['BodyHandle'][1].copy(), p_sit['BodyHandle'][2].copy())
    p_lay['Neck'] = (p_sit['Neck'][0].copy(), p_sit['Neck'][1] @ Quaternion((1, 0, 0), -0.2), p_sit['Neck'][2].copy())
    p_lay['Head'] = (p_sit['Head'][0].copy(), p_sit['Head'][1] @ Quaternion((1, 0, 0), -0.15), p_sit['Head'][2].copy())

    tail_bones = ['Tail1', 'Tail2', 'Tail3', 'Tail4', 'Tail5', 'Tail6', 'Tail7']

    # 1. Sit action: transition from standing to sitting (16 frames)
    act_sit = bpy.data.actions.new(name="sit")
    rig.animation_data.action = act_sit
    for f in range(1, 17):
        t = (f - 1) / 15.0
        alpha = t * t * (3 - 2 * t)
        bpy.context.scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.location = p_stand[pb.name][0].lerp(p_sit[pb.name][0], alpha)
            pb.rotation_quaternion = p_stand[pb.name][1].slerp(p_sit[pb.name][1], alpha)
            pb.scale = p_stand[pb.name][2].lerp(p_sit[pb.name][2], alpha)
            pb.keyframe_insert(data_path="location", frame=f)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
            pb.keyframe_insert(data_path="scale", frame=f)
    act_sit.use_frame_range = True
    act_sit.frame_start = 1
    act_sit.frame_end = 16

    # 2. Lay down action: transition from sit to relaxed lay-down (16 frames)
    act_lay = bpy.data.actions.new(name="lay-down")
    rig.animation_data.action = act_lay
    for f in range(1, 17):
        t = (f - 1) / 15.0
        alpha = t * t * (3 - 2 * t)
        bpy.context.scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.location = p_sit[pb.name][0].lerp(p_lay[pb.name][0], alpha)
            pb.rotation_quaternion = p_sit[pb.name][1].slerp(p_lay[pb.name][1], alpha)
            pb.scale = p_sit[pb.name][2].lerp(p_lay[pb.name][2], alpha)
            pb.keyframe_insert(data_path="location", frame=f)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
            pb.keyframe_insert(data_path="scale", frame=f)
    act_lay.use_frame_range = True
    act_lay.frame_start = 1
    act_lay.frame_end = 16

    # 3. Wag action: standing energetic tail wag with ear twitch (16 frames cyclic loop)
    act_wag = bpy.data.actions.new(name="wag")
    rig.animation_data.action = act_wag
    for f in range(1, 17):
        phase = (f - 1) / 16.0 * 2 * math.pi * 2
        bpy.context.scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.location = p_stand[pb.name][0].copy()
            pb.rotation_quaternion = p_stand[pb.name][1].copy()
            pb.scale = p_stand[pb.name][2].copy()
            if pb.name in tail_bones:
                idx = tail_bones.index(pb.name) + 1
                angle = math.sin(phase - idx * 0.15) * (0.07 * idx)
                pb.rotation_quaternion @= Quaternion((0, 0, 1), angle)
            elif pb.name in ['Ear1.L', 'Ear1.R', 'Ear2.L', 'Ear2.R']:
                pb.rotation_quaternion @= Quaternion((1, 0, 0), math.sin(phase) * 0.03)
            pb.keyframe_insert(data_path="location", frame=f)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
            pb.keyframe_insert(data_path="scale", frame=f)
    act_wag.use_frame_range = True
    act_wag.frame_start = 1
    act_wag.frame_end = 16

    # 4. Bark action: 2 crisp barks with forward thrust, raised muzzle & ear flip (24 frames)
    act_bark = bpy.data.actions.new(name="bark")
    rig.animation_data.action = act_bark
    for f in range(1, 25):
        bark1 = math.exp(-((f - 5) ** 2) / 4.0)
        bark2 = math.exp(-((f - 15) ** 2) / 4.0)
        bark_intensity = max(bark1, bark2 * 0.85)
        bpy.context.scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.location = p_stand[pb.name][0].copy()
            pb.rotation_quaternion = p_stand[pb.name][1].copy()
            pb.scale = p_stand[pb.name][2].copy()
            if pb.name == 'Head':
                pb.rotation_quaternion @= Quaternion((1, 0, 0), bark_intensity * 0.35)
            elif pb.name == 'Neck':
                pb.rotation_quaternion @= Quaternion((1, 0, 0), bark_intensity * 0.15)
            elif pb.name == 'UpperBack':
                pb.rotation_quaternion @= Quaternion((1, 0, 0), bark_intensity * -0.05)
            elif 'Ear' in pb.name:
                pb.rotation_quaternion @= Quaternion((1, 0, 0), bark_intensity * -0.2)
            elif pb.name in tail_bones:
                idx = tail_bones.index(pb.name) + 1
                pb.rotation_quaternion @= Quaternion((1, 0, 0), bark_intensity * 0.1 * idx)
            pb.keyframe_insert(data_path="location", frame=f)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
            pb.keyframe_insert(data_path="scale", frame=f)
    act_bark.use_frame_range = True
    act_bark.frame_start = 1
    act_bark.frame_end = 24

    # 5. Scratch action: seated ear scratch with rapid rear paw beats (24 frames cyclic loop)
    act_scratch = bpy.data.actions.new(name="scratch")
    rig.animation_data.action = act_scratch
    for f in range(1, 25):
        phase = (f - 1) / 24.0 * 2 * math.pi * 3
        bpy.context.scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.location = p_sit[pb.name][0].copy()
            pb.rotation_quaternion = p_sit[pb.name][1].copy()
            pb.scale = p_sit[pb.name][2].copy()
            if pb.name == 'Head':
                pb.rotation_quaternion @= Quaternion((0, 0, 1), 0.3)
                pb.rotation_quaternion @= Quaternion((1, 0, 0), 0.1)
            elif pb.name == 'Neck':
                pb.rotation_quaternion @= Quaternion((0, 0, 1), 0.15)
            elif pb.name == 'BackLeg1.R':
                pb.rotation_quaternion @= Quaternion((1, 0, 0), -0.6)
                pb.rotation_quaternion @= Quaternion((0, 0, 1), 0.3)
            elif pb.name == 'BackLeg2.R':
                scratch_beat = math.sin(phase) * 0.35
                pb.rotation_quaternion @= Quaternion((1, 0, 0), 0.4 + scratch_beat)
            elif pb.name in ['Ear1.R', 'Ear2.R']:
                pb.rotation_quaternion @= Quaternion((0, 1, 0), math.sin(phase) * 0.15)
            pb.keyframe_insert(data_path="location", frame=f)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
            pb.keyframe_insert(data_path="scale", frame=f)
    act_scratch.use_frame_range = True
    act_scratch.frame_start = 1
    act_scratch.frame_end = 24

    # 6. Dig action: terrier ground scraping with alternating front paws (24 frames cyclic loop)
    act_dig = bpy.data.actions.new(name="dig")
    rig.animation_data.action = act_dig
    for f in range(1, 25):
        phase = (f - 1) / 24.0 * 2 * math.pi * 2
        bpy.context.scene.frame_set(f)
        for pb in rig.pose.bones:
            pb.location = p_stand[pb.name][0].copy()
            pb.rotation_quaternion = p_stand[pb.name][1].copy()
            pb.scale = p_stand[pb.name][2].copy()
            if pb.name == 'Head':
                pb.rotation_quaternion @= Quaternion((1, 0, 0), -0.45)
            elif pb.name == 'Neck':
                pb.rotation_quaternion @= Quaternion((1, 0, 0), -0.25)
            elif pb.name == 'UpperBack':
                pb.rotation_quaternion @= Quaternion((1, 0, 0), -0.1)
            elif pb.name in tail_bones:
                idx = tail_bones.index(pb.name) + 1
                pb.rotation_quaternion @= Quaternion((1, 0, 0), 0.08 * idx)
                pb.rotation_quaternion @= Quaternion((0, 0, 1), math.sin(phase) * 0.04 * idx)
            elif pb.name == 'FrontLeg0.L':
                stroke = math.sin(phase)
                pb.rotation_quaternion @= Quaternion((1, 0, 0), stroke * 0.4)
            elif pb.name == 'FrontLeg1.L':
                stroke = math.sin(phase)
                pb.rotation_quaternion @= Quaternion((1, 0, 0), max(0.0, -stroke) * 0.5)
            elif pb.name == 'FrontLeg0.R':
                stroke = math.sin(phase + math.pi)
                pb.rotation_quaternion @= Quaternion((1, 0, 0), stroke * 0.4)
            elif pb.name == 'FrontLeg1.R':
                stroke = math.sin(phase + math.pi)
                pb.rotation_quaternion @= Quaternion((1, 0, 0), max(0.0, -stroke) * 0.5)
            pb.keyframe_insert(data_path="location", frame=f)
            pb.keyframe_insert(data_path="rotation_quaternion", frame=f)
            pb.keyframe_insert(data_path="scale", frame=f)
    act_dig.use_frame_range = True
    act_dig.frame_start = 1
    act_dig.frame_end = 24

    for action in list(bpy.data.actions):
        name = action.name.split('|')[-1]
        if name == 'PoseLib':
            bpy.data.actions.remove(action)
        else:
            action.name = name.lower().replace('_', '-')

    # The FBX has no jaw bone: the Head bone tip supplies the muzzle direction.
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    head = rig.data.edit_bones['Head']
    muzzle = rig.data.edit_bones.new('Muzzle')
    muzzle.head = head.tail
    muzzle.tail = head.tail + (head.tail - head.head).normalized() * 0.1
    muzzle.parent = head
    bpy.ops.object.mode_set(mode='OBJECT')

    # Unparent Dog mesh and apply transforms so its local vertices match world coordinates,
    # preventing double Armature transformations in glTF viewers (F3D / VTK)
    dog = bpy.data.objects['Dog']
    bpy.ops.object.select_all(action='DESELECT')
    dog.select_set(True)
    bpy.context.view_layer.objects.active = dog
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    raw_glb = root / 'raw.glb'
    bpy.ops.export_scene.gltf(filepath=str(raw_glb), export_format='GLB',
                              export_animation_mode='ACTIONS', export_force_sampling=True)

    # Post-process GLB to center on X/Z and ground lowest paws at Y=0 directly at origin
    with open(raw_glb, 'rb') as f:
        glb_bytes = f.read()
    json_len = int.from_bytes(glb_bytes[12:16], 'little')
    json_data = json.loads(glb_bytes[20:20 + json_len].decode('utf-8'))
    bin_chunk = glb_bytes[20 + json_len:]

    root_idx = len(json_data['nodes'])
    json_data['nodes'].append({
        'name': 'UlotteOriginRoot',
        'translation': [-0.001476, -0.2138997, 0.300009],
        'children': list(json_data['scenes'][0]['nodes'])
    })
    json_data['scenes'][0]['nodes'] = [root_idx]

    new_json_bytes = json.dumps(json_data).encode('utf-8')
    pad = (4 - (len(new_json_bytes) % 4)) % 4
    new_json_bytes += b' ' * pad

    total_len = 12 + 8 + len(new_json_bytes) + len(bin_chunk)
    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, 'wb') as f:
        f.write(glb_bytes[:8])
        f.write(total_len.to_bytes(4, 'little'))
        f.write(len(new_json_bytes).to_bytes(4, 'little'))
        f.write(b'JSON')
        f.write(new_json_bytes)
        f.write(bin_chunk)

    print(f'Exported {output}', flush=True)
