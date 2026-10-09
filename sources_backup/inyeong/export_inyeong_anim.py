import bpy, math, os
from mathutils import Matrix, Vector

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    fbx_path = os.path.abspath("sources_backup/inyeong/raw/source/Nitro.fbx")
    ref_glb_path = os.path.abspath("public/characters/inyeong/nitro_anim_inyeong.glb")
    out_glb_path = os.path.abspath("public/animations/others/anim_inyeong_nitro_intro.glb")

    print("=== 1. Load Nitro FBX ===")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    arm_nitro = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    arm_nitro.name = 'Nitro_Arm'

    # Rotate -90° Z so forward faces -Y (standard Blender forward / +Z Three.js)
    R_z = Matrix.Rotation(-math.pi / 2, 4, 'Z')
    arm_nitro.matrix_world = R_z @ arm_nitro.matrix_world

    # Center Nitro's base position at frame 1:
    # At frame 1, Nitro's pelvis is at (-0.0309, -0.6540)
    # We shift arm_nitro so the character's base is at (0, 0)
    arm_nitro.location += Vector((0.0309, 0.6540, 0.0))
    bpy.context.view_layer.update()

    print("=== 2. Load Target Mixamo Rig ===")
    bpy.ops.import_scene.gltf(filepath=ref_glb_path)
    arm_tgt = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o != arm_nitro][0]
    arm_tgt.name = 'Armature'

    # Remove all non-armature objects (meshes, empties, icospheres)
    for o in list(bpy.data.objects):
        if o != arm_tgt and o != arm_nitro:
            bpy.data.objects.remove(o, do_unlink=True)

    bone_map = {
        'Pelvis': 'mixamorig:Hips',
        'Spine1': 'mixamorig:Spine',
        'Spine2': 'mixamorig:Spine1',
        'Spine3': 'mixamorig:Spine2',
        'Neck': 'mixamorig:Neck',
        'Head': 'mixamorig:Head',
        'LeftClavicle': 'mixamorig:LeftShoulder',
        'LeftShoulder': 'mixamorig:LeftArm',
        'LeftElbow': 'mixamorig:LeftForeArm',
        'LeftWrist': 'mixamorig:LeftHand',
        'LeftHandThumb1': 'mixamorig:LeftHandThumb1',
        'LeftHandThumb2': 'mixamorig:LeftHandThumb2',
        'LeftHandThumb3': 'mixamorig:LeftHandThumb3',
        'LeftHandIndex1': 'mixamorig:LeftHandIndex1',
        'LeftHandIndex2': 'mixamorig:LeftHandIndex2',
        'LeftHandIndex3': 'mixamorig:LeftHandIndex3',
        'LeftHandMiddle1': 'mixamorig:LeftHandMiddle1',
        'LeftHandMiddle2': 'mixamorig:LeftHandMiddle2',
        'LeftHandMiddle3': 'mixamorig:LeftHandMiddle3',
        'LeftHandRing1': 'mixamorig:LeftHandRing1',
        'LeftHandRing2': 'mixamorig:LeftHandRing2',
        'LeftHandRing3': 'mixamorig:LeftHandRing3',
        'LeftHandPinky1': 'mixamorig:LeftHandPinky1',
        'LeftHandPinky2': 'mixamorig:LeftHandPinky2',
        'LeftHandPinky3': 'mixamorig:LeftHandPinky3',
        'RightClavicle': 'mixamorig:RightShoulder',
        'RightShoulder': 'mixamorig:RightArm',
        'RightElbow': 'mixamorig:RightForeArm',
        'RightWrist': 'mixamorig:RightHand',
        'RightHandThumb1': 'mixamorig:RightHandThumb1',
        'RightHandThumb2': 'mixamorig:RightHandThumb2',
        'RightHandThumb3': 'mixamorig:RightHandThumb3',
        'RightHandIndex1': 'mixamorig:RightHandIndex1',
        'RightHandIndex2': 'mixamorig:RightHandIndex2',
        'RightHandIndex3': 'mixamorig:RightHandIndex3',
        'RightHandMiddle1': 'mixamorig:RightHandMiddle1',
        'RightHandMiddle2': 'mixamorig:RightHandMiddle2',
        'RightHandMiddle3': 'mixamorig:RightHandMiddle3',
        'RightHandRing1': 'mixamorig:RightHandRing1',
        'RightHandRing2': 'mixamorig:RightHandRing2',
        'RightHandRing3': 'mixamorig:RightHandRing3',
        'RightHandPinky1': 'mixamorig:RightHandPinky1',
        'RightHandPinky2': 'mixamorig:RightHandPinky2',
        'RightHandPinky3': 'mixamorig:RightHandPinky3',
        'LeftThigh': 'mixamorig:LeftUpLeg',
        'LeftKnee': 'mixamorig:LeftLeg',
        'LeftFoot': 'mixamorig:LeftFoot',
        'LeftToe': 'mixamorig:LeftToeBase',
        'RightThigh': 'mixamorig:RightUpLeg',
        'RightKnee': 'mixamorig:RightLeg',
        'RightFoot': 'mixamorig:RightFoot',
        'RightToe': 'mixamorig:RightToeBase',
    }

    print("=== 3. Add Constraints to Target Bones ===")
    bpy.context.view_layer.objects.active = arm_tgt
    bpy.ops.object.mode_set(mode='POSE')

    for src_name, tgt_name in bone_map.items():
        pb = arm_tgt.pose.bones.get(tgt_name)
        if not pb:
            continue

        # Copy rotation in world space
        c_rot = pb.constraints.new(type='COPY_ROTATION')
        c_rot.target = arm_nitro
        c_rot.subtarget = src_name
        c_rot.target_space = 'WORLD'
        c_rot.owner_space = 'WORLD'

        # For hips, also copy location in world space
        if tgt_name == 'mixamorig:Hips':
            c_loc = pb.constraints.new(type='COPY_LOCATION')
            c_loc.target = arm_nitro
            c_loc.subtarget = src_name
            c_loc.target_space = 'WORLD'
            c_loc.owner_space = 'WORLD'

    bpy.ops.pose.select_all(action='SELECT')

    print("=== 4. Bake Action (frames 1 to 359) ===")
    bpy.ops.nla.bake(
        frame_start=1,
        frame_end=359,
        only_selected=True,
        visual_keying=True,
        clear_constraints=True,
        bake_types={'POSE'}
    )

    bpy.ops.object.mode_set(mode='OBJECT')

    # Rename baked action
    if arm_tgt.animation_data and arm_tgt.animation_data.action:
        arm_tgt.animation_data.action.name = 'Armature|mixamo.com|Layer0'
        print("Baked action name:", arm_tgt.animation_data.action.name, "range:", arm_tgt.animation_data.action.frame_range)

    # Delete Nitro armature and clean unused actions
    bpy.data.objects.remove(arm_nitro, do_unlink=True)
    for a in list(bpy.data.actions):
        if a != arm_tgt.animation_data.action:
            bpy.data.actions.remove(a)

    print(f"=== 5. Exporting GLB to {out_glb_path} ===")
    os.makedirs(os.path.dirname(out_glb_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_glb_path,
        export_format='GLB',
        use_selection=False,
        export_animations=True,
        export_skins=True,
        export_materials='NONE',
        export_cameras=False,
        export_lights=False,
        export_yup=True
    )
    print("=== Export complete! ===")

if __name__ == '__main__':
    main()
