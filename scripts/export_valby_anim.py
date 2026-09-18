import bpy, math, os
from mathutils import Matrix, Vector

BONE_MAP_VALBY = {
    'Bip001_Pelvis': 'mixamorig:Hips',
    'Bip001_Spine1': 'mixamorig:Spine',
    'Bip001_Spine2': 'mixamorig:Spine1',
    'Bip001_Spine3': 'mixamorig:Spine2',
    'Bip001_Neck': 'mixamorig:Neck',
    'Bip001_Head': 'mixamorig:Head',
    # Left Arm
    'Bip001_L_Clavicle': 'mixamorig:LeftShoulder',
    'Bip001_L_UpperArm': 'mixamorig:LeftArm',
    'Bip001_L_Forearm': 'mixamorig:LeftForeArm',
    'Bip001_L_Hand': 'mixamorig:LeftHand',
    'Bip001_L_Finger0': 'mixamorig:LeftHandThumb1',
    'Bip001_L_Finger01': 'mixamorig:LeftHandThumb2',
    'Bip001_L_Finger02': 'mixamorig:LeftHandThumb3',
    'Bip001_L_Finger1': 'mixamorig:LeftHandIndex1',
    'Bip001_L_Finger11': 'mixamorig:LeftHandIndex2',
    'Bip001_L_Finger12': 'mixamorig:LeftHandIndex3',
    'Bip001_L_Finger2': 'mixamorig:LeftHandMiddle1',
    'Bip001_L_Finger21': 'mixamorig:LeftHandMiddle2',
    'Bip001_L_Finger22': 'mixamorig:LeftHandMiddle3',
    'Bip001_L_Finger3': 'mixamorig:LeftHandRing1',
    'Bip001_L_Finger31': 'mixamorig:LeftHandRing2',
    'Bip001_L_Finger32': 'mixamorig:LeftHandRing3',
    'Bip001_L_Finger4': 'mixamorig:LeftHandPinky1',
    'Bip001_L_Finger41': 'mixamorig:LeftHandPinky2',
    'Bip001_L_Finger42': 'mixamorig:LeftHandPinky3',
    # Right Arm
    'Bip001_R_Clavicle': 'mixamorig:RightShoulder',
    'Bip001_R_UpperArm': 'mixamorig:RightArm',
    'Bip001_R_Forearm': 'mixamorig:RightForeArm',
    'Bip001_R_Hand': 'mixamorig:RightHand',
    'Bip001_R_Finger0': 'mixamorig:RightHandThumb1',
    'Bip001_R_Finger01': 'mixamorig:RightHandThumb2',
    'Bip001_R_Finger02': 'mixamorig:RightHandThumb3',
    'Bip001_R_Finger1': 'mixamorig:RightHandIndex1',
    'Bip001_R_Finger11': 'mixamorig:RightHandIndex2',
    'Bip001_R_Finger12': 'mixamorig:RightHandIndex3',
    'Bip001_R_Finger2': 'mixamorig:RightHandMiddle1',
    'Bip001_R_Finger21': 'mixamorig:RightHandMiddle2',
    'Bip001_R_Finger22': 'mixamorig:RightHandMiddle3',
    'Bip001_R_Finger3': 'mixamorig:RightHandRing1',
    'Bip001_R_Finger31': 'mixamorig:RightHandRing2',
    'Bip001_R_Finger32': 'mixamorig:RightHandRing3',
    'Bip001_R_Finger4': 'mixamorig:RightHandPinky1',
    'Bip001_R_Finger41': 'mixamorig:RightHandPinky2',
    'Bip001_R_Finger42': 'mixamorig:RightHandPinky3',
    # Legs
    'Bip001_L_Thigh': 'mixamorig:LeftUpLeg',
    'Bip001_L_Calf': 'mixamorig:LeftLeg',
    'Bip001_L_Foot': 'mixamorig:LeftFoot',
    'Bip001_L_Toe0': 'mixamorig:LeftToeBase',
    'Bip001_R_Thigh': 'mixamorig:RightUpLeg',
    'Bip001_R_Calf': 'mixamorig:RightLeg',
    'Bip001_R_Foot': 'mixamorig:RightFoot',
    'Bip001_R_Toe0': 'mixamorig:RightToeBase',
    # Bust / Breasts
    'Bn_Shape_Chest_L': 'breast_left',
    'Bn_Shape_Chest_R': 'breast_right',
    'Bn_Shape_Chest_L_End': 'breast_left_end',
    'Bn_Shape_Chest_R_End': 'breast_right_end',
}

def export_valby_anim():
    root_dir = os.path.abspath(".")
    fbx_path = os.path.join(root_dir, "sources_backup/personnages/valby_nano_body_suit/source/Valby_nano_body_suit2out.fbx")
    ref_glb_path = os.path.join(root_dir, "public/characters/valby/valby.glb")
    out_glb_path = os.path.join(root_dir, "public/animations/emotes_gestures/anim_valby_signature.glb")

    print("\n=======================================================")
    print("=== Exporting Valby Signature Animation ===")
    print("=======================================================")
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # 1. Load Source FBX
    print(f"Loading FBX: {fbx_path}")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    arm_src = bpy.data.objects.get('RL_BoneRoot')
    if not arm_src:
        raise RuntimeError("Armature RL_BoneRoot not found in FBX")
    arm_src.name = 'Source_Arm'

    # Remove all other objects from FBX
    for o in list(bpy.data.objects):
        if o != arm_src:
            bpy.data.objects.remove(o, do_unlink=True)

    # 2. Load Target GLB (Standard Mixamo + breast bones)
    print(f"Loading Reference GLB: {ref_glb_path}")
    bpy.ops.import_scene.gltf(filepath=ref_glb_path)
    arm_tgt = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o != arm_src][0]
    arm_tgt.name = 'Armature'

    # Remove meshes from target import so only target armature remains
    for o in list(bpy.data.objects):
        if o != arm_tgt and o != arm_src:
            bpy.data.objects.remove(o, do_unlink=True)

    # 3. Setup Bone Constraints (WORLD -> WORLD for body, LOCAL -> LOCAL for breasts)
    print("Setting up bone constraints...")
    bpy.context.view_layer.objects.active = arm_tgt
    bpy.ops.object.mode_set(mode='POSE')

    for s_name, t_name in BONE_MAP_VALBY.items():
        pb = arm_tgt.pose.bones.get(t_name)
        if not pb or s_name not in arm_src.pose.bones:
            continue

        is_breast = 'breast' in t_name
        is_hips = (t_name == 'mixamorig:Hips')

        # Rotation constraint
        c_rot = pb.constraints.new(type='COPY_ROTATION')
        c_rot.target = arm_src
        c_rot.subtarget = s_name
        c_rot.target_space = 'LOCAL' if is_breast else 'WORLD'
        c_rot.owner_space = 'LOCAL' if is_breast else 'WORLD'

        # Location constraint for Hips and Breasts
        if is_hips or is_breast:
            c_loc = pb.constraints.new(type='COPY_LOCATION')
            c_loc.target = arm_src
            c_loc.subtarget = s_name
            c_loc.target_space = 'LOCAL' if is_breast else 'WORLD'
            c_loc.owner_space = 'LOCAL' if is_breast else 'WORLD'

    bpy.ops.pose.select_all(action='SELECT')

    # 4. Bake Action
    act_src = arm_src.animation_data.action if arm_src.animation_data else None
    if not act_src:
        act_src = bpy.data.actions.get('RL_BoneRoot|Noesis Frames|Noesis Layer')
    frame_start = int(act_src.frame_range[0])
    frame_end = int(act_src.frame_range[1])
    print(f"Baking frames {frame_start} to {frame_end} ({frame_end - frame_start} frames)...")

    bpy.ops.nla.bake(
        frame_start=frame_start,
        frame_end=frame_end,
        only_selected=True,
        visual_keying=True,
        clear_constraints=True,
        bake_types={'POSE'}
    )

    bpy.ops.object.mode_set(mode='OBJECT')

    if arm_tgt.animation_data and arm_tgt.animation_data.action:
        arm_tgt.animation_data.action.name = 'Armature|mixamo.com|Layer0'
        print("Baked action:", arm_tgt.animation_data.action.name, "range:", arm_tgt.animation_data.action.frame_range)

    # Delete source armature
    bpy.data.objects.remove(arm_src, do_unlink=True)
    for a in list(bpy.data.actions):
        if arm_tgt.animation_data and a != arm_tgt.animation_data.action:
            bpy.data.actions.remove(a)

    # 5. Export lightweight animation GLB
    os.makedirs(os.path.dirname(out_glb_path), exist_ok=True)
    print(f"Exporting animation GLB to {out_glb_path}...")
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
    size_kb = os.path.getsize(out_glb_path) / 1024
    duration_s = (frame_end - frame_start) / 25.0
    print(f"=== Successfully exported Valby signature animation: {size_kb:.1f} KB, duration: {duration_s:.1f}s ===")

if __name__ == '__main__':
    export_valby_anim()
