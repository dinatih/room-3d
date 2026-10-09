import bpy, math, os
import io_scene_fbx.import_fbx as ifbx
from mathutils import Matrix, Vector

# Monkey patch Blender FBX importer for Gloria2.fbx root node issue
orig_link_hierarchy = ifbx.FbxImportHelperNode.link_hierarchy
def patched_link_hierarchy(self, fbx_tmpl, settings, scene):
    if self.is_armature and self.meshes:
        for mesh in list(self.meshes):
            if self not in mesh.armature_setup:
                if mesh.armature_setup:
                    mesh.armature_setup[self] = next(iter(mesh.armature_setup.values()))
                else:
                    mesh.armature_setup[self] = (Matrix(), Matrix())
    return orig_link_hierarchy(self, fbx_tmpl, settings, scene)
ifbx.FbxImportHelperNode.link_hierarchy = patched_link_hierarchy

# Common bone maps
BONE_MAP_HAYLEY = {
    'pelvis': 'mixamorig:Hips',
    'spine': 'mixamorig:Spine',
    'spine1': 'mixamorig:Spine1',
    'spine2': 'mixamorig:Spine2',
    'neck': 'mixamorig:Neck',
    'head': 'mixamorig:Head',
    'lScapula': 'mixamorig:LeftShoulder',
    'lShoulder': 'mixamorig:LeftArm',
    'lForearm': 'mixamorig:LeftForeArm',
    'lHand': 'mixamorig:LeftHand',
    'lThumb1': 'mixamorig:LeftHandThumb1',
    'lThumb2': 'mixamorig:LeftHandThumb2',
    'lThumb3': 'mixamorig:LeftHandThumb3',
    'lIndex1': 'mixamorig:LeftHandIndex1',
    'lIndex2': 'mixamorig:LeftHandIndex2',
    'lIndex3': 'mixamorig:LeftHandIndex3',
    'lMid1': 'mixamorig:LeftHandMiddle1',
    'lMid2': 'mixamorig:LeftHandMiddle2',
    'lMid3': 'mixamorig:LeftHandMiddle3',
    'lRing1': 'mixamorig:LeftHandRing1',
    'lRing2': 'mixamorig:LeftHandRing2',
    'lRing3': 'mixamorig:LeftHandRing3',
    'lPinky1': 'mixamorig:LeftHandPinky1',
    'lPinky2': 'mixamorig:LeftHandPinky2',
    'lPinky3': 'mixamorig:LeftHandPinky3',
    'rScapula': 'mixamorig:RightShoulder',
    'rShoulder': 'mixamorig:RightArm',
    'rForearm': 'mixamorig:RightForeArm',
    'rHand': 'mixamorig:RightHand',
    'rThumb1': 'mixamorig:RightHandThumb1',
    'rThumb2': 'mixamorig:RightHandThumb2',
    'rThumb3': 'mixamorig:RightHandThumb3',
    'rIndex1': 'mixamorig:RightHandIndex1',
    'rIndex2': 'mixamorig:RightHandIndex2',
    'rIndex3': 'mixamorig:RightHandIndex3',
    'rMid1': 'mixamorig:RightHandMiddle1',
    'rMid2': 'mixamorig:RightHandMiddle2',
    'rMid3': 'mixamorig:RightHandMiddle3',
    'rRing1': 'mixamorig:RightHandRing1',
    'rRing2': 'mixamorig:RightHandRing2',
    'rRing3': 'mixamorig:RightHandRing3',
    'rPinky1': 'mixamorig:RightHandPinky1',
    'rPinky2': 'mixamorig:RightHandPinky2',
    'rPinky3': 'mixamorig:RightHandPinky3',
    'lThigh': 'mixamorig:LeftUpLeg',
    'lKnee': 'mixamorig:LeftLeg',
    'lFoot': 'mixamorig:LeftFoot',
    'lToe': 'mixamorig:LeftToeBase',
    'rThigh': 'mixamorig:RightUpLeg',
    'rKnee': 'mixamorig:RightLeg',
    'rFoot': 'mixamorig:RightFoot',
    'rToe': 'mixamorig:RightToeBase',
}

BONE_MAP_GLORIA = dict(BONE_MAP_HAYLEY)
BONE_MAP_GLORIA['lMetatarsal'] = 'mixamorig:LeftToeBase'
BONE_MAP_GLORIA['rMetatarsar'] = 'mixamorig:RightToeBase'
del BONE_MAP_GLORIA['lToe']
del BONE_MAP_GLORIA['rToe']

BONE_MAP_ZOE = {
    'CC_Base_Hip': 'mixamorig:Hips',
    'CC_Base_Waist': 'mixamorig:Spine',
    'CC_Base_Spine01': 'mixamorig:Spine1',
    'CC_Base_Spine02': 'mixamorig:Spine2',
    'CC_Base_NeckTwist01': 'mixamorig:Neck',
    'CC_Base_Head': 'mixamorig:Head',
    'CC_Base_L_Clavicle': 'mixamorig:LeftShoulder',
    'CC_Base_L_Upperarm': 'mixamorig:LeftArm',
    'CC_Base_L_Forearm': 'mixamorig:LeftForeArm',
    'CC_Base_L_Hand': 'mixamorig:LeftHand',
    'CC_Base_L_Thumb1': 'mixamorig:LeftHandThumb1',
    'CC_Base_L_Thumb2': 'mixamorig:LeftHandThumb2',
    'CC_Base_L_Thumb3': 'mixamorig:LeftHandThumb3',
    'CC_Base_L_Index1': 'mixamorig:LeftHandIndex1',
    'CC_Base_L_Index2': 'mixamorig:LeftHandIndex2',
    'CC_Base_L_Index3': 'mixamorig:LeftHandIndex3',
    'CC_Base_L_Mid1': 'mixamorig:LeftHandMiddle1',
    'CC_Base_L_Mid2': 'mixamorig:LeftHandMiddle2',
    'CC_Base_L_Mid3': 'mixamorig:LeftHandMiddle3',
    'CC_Base_L_Ring1': 'mixamorig:LeftHandRing1',
    'CC_Base_L_Ring2': 'mixamorig:LeftHandRing2',
    'CC_Base_L_Ring3': 'mixamorig:LeftHandRing3',
    'CC_Base_L_Pinky1': 'mixamorig:LeftHandPinky1',
    'CC_Base_L_Pinky2': 'mixamorig:LeftHandPinky2',
    'CC_Base_L_Pinky3': 'mixamorig:LeftHandPinky3',
    'CC_Base_R_Clavicle': 'mixamorig:RightShoulder',
    'CC_Base_R_Upperarm': 'mixamorig:RightArm',
    'CC_Base_R_Forearm': 'mixamorig:RightForeArm',
    'CC_Base_R_Hand': 'mixamorig:RightHand',
    'CC_Base_R_Thumb1': 'mixamorig:RightHandThumb1',
    'CC_Base_R_Thumb2': 'mixamorig:RightHandThumb2',
    'CC_Base_R_Thumb3': 'mixamorig:RightHandThumb3',
    'CC_Base_R_Index1': 'mixamorig:RightHandIndex1',
    'CC_Base_R_Index2': 'mixamorig:RightHandIndex2',
    'CC_Base_R_Index3': 'mixamorig:RightHandIndex3',
    'CC_Base_R_Mid1': 'mixamorig:RightHandMiddle1',
    'CC_Base_R_Mid2': 'mixamorig:RightHandMiddle2',
    'CC_Base_R_Mid3': 'mixamorig:RightHandMiddle3',
    'CC_Base_R_Ring1': 'mixamorig:RightHandRing1',
    'CC_Base_R_Ring2': 'mixamorig:RightHandRing2',
    'CC_Base_R_Ring3': 'mixamorig:RightHandRing3',
    'CC_Base_R_Pinky1': 'mixamorig:RightHandPinky1',
    'CC_Base_R_Pinky2': 'mixamorig:RightHandPinky2',
    'CC_Base_R_Pinky3': 'mixamorig:RightHandPinky3',
    'CC_Base_L_Thigh': 'mixamorig:LeftUpLeg',
    'CC_Base_L_Calf': 'mixamorig:LeftLeg',
    'CC_Base_L_Foot': 'mixamorig:LeftFoot',
    'CC_Base_L_ToeBase': 'mixamorig:LeftToeBase',
    'CC_Base_R_Thigh': 'mixamorig:RightUpLeg',
    'CC_Base_R_Calf': 'mixamorig:RightLeg',
    'CC_Base_R_Foot': 'mixamorig:RightFoot',
    'CC_Base_R_ToeBase': 'mixamorig:RightToeBase',
}

BONE_MAP_SOPHIA = {
    'root_hips': 'mixamorig:Hips',
    'spine_lower': 'mixamorig:Spine',
    'spine_middle': 'mixamorig:Spine1',
    'spine_upper': 'mixamorig:Spine2',
    'head_neck_lower': 'mixamorig:Neck',
    'head_face': 'mixamorig:Head',
    'arm_left_shoulder_1': 'mixamorig:LeftShoulder',
    'arm_left_shoulder_2': 'mixamorig:LeftArm',
    'arm_left_elbow': 'mixamorig:LeftForeArm',
    'arm_left_wrist': 'mixamorig:LeftHand',
    'arm_left_finger_1a': 'mixamorig:LeftHandThumb1',
    'arm_left_finger_1b': 'mixamorig:LeftHandThumb2',
    'arm_left_finger_1c': 'mixamorig:LeftHandThumb3',
    'arm_left_finger_2a': 'mixamorig:LeftHandIndex1',
    'arm_left_finger_2b': 'mixamorig:LeftHandIndex2',
    'arm_left_finger_2c': 'mixamorig:LeftHandIndex3',
    'arm_left_finger_3a': 'mixamorig:LeftHandMiddle1',
    'arm_left_finger_3b': 'mixamorig:LeftHandMiddle2',
    'arm_left_finger_3c': 'mixamorig:LeftHandMiddle3',
    'arm_left_finger_4a': 'mixamorig:LeftHandRing1',
    'arm_left_finger_4b': 'mixamorig:LeftHandRing2',
    'arm_left_finger_4c': 'mixamorig:LeftHandRing3',
    'arm_left_finger_5a': 'mixamorig:LeftHandPinky1',
    'arm_left_finger_5b': 'mixamorig:LeftHandPinky2',
    'arm_left_finger_5c': 'mixamorig:LeftHandPinky3',
    'arm_right_shoulder_1': 'mixamorig:RightShoulder',
    'arm_right_shoulder_2': 'mixamorig:RightArm',
    'arm_right_elbow': 'mixamorig:RightForeArm',
    'arm_right_wrist': 'mixamorig:RightHand',
    'arm_right_finger_1a': 'mixamorig:RightHandThumb1',
    'arm_right_finger_1b': 'mixamorig:RightHandThumb2',
    'arm_right_finger_1c': 'mixamorig:RightHandThumb3',
    'arm_right_finger_2a': 'mixamorig:RightHandIndex1',
    'arm_right_finger_2b': 'mixamorig:RightHandIndex2',
    'arm_right_finger_2c': 'mixamorig:RightHandIndex3',
    'arm_right_finger_3a': 'mixamorig:RightHandMiddle1',
    'arm_right_finger_3b': 'mixamorig:RightHandMiddle2',
    'arm_right_finger_3c': 'mixamorig:RightHandMiddle3',
    'arm_right_finger_4a': 'mixamorig:RightHandRing1',
    'arm_right_finger_4b': 'mixamorig:RightHandRing2',
    'arm_right_finger_4c': 'mixamorig:RightHandRing3',
    'arm_right_finger_5a': 'mixamorig:RightHandPinky1',
    'arm_right_finger_5b': 'mixamorig:RightHandPinky2',
    'arm_right_finger_5c': 'mixamorig:RightHandPinky3',
    'leg_left_thigh': 'mixamorig:LeftUpLeg',
    'leg_left_knee': 'mixamorig:LeftLeg',
    'leg_left_ankle': 'mixamorig:LeftFoot',
    'leg_left_toes': 'mixamorig:LeftToeBase',
    'leg_right_thigh': 'mixamorig:RightUpLeg',
    'leg_right_knee': 'mixamorig:RightLeg',
    'leg_right_ankle': 'mixamorig:RightFoot',
    'leg_right_toes': 'mixamorig:RightToeBase',
}

def export_character_anim(
    name,
    fbx_path,
    ref_glb_path,
    out_glb_path,
    arm_src_name,
    hips_src_name,
    bone_map,
    pre_scale=1.0,
    z_shift=0.0
):
    print(f"\n=======================================================")
    print(f"=== Exporting Native Animation for: {name} ===")
    print(f"=======================================================")
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # 1. Load Source FBX
    print(f"Loading FBX: {fbx_path}")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    arm_src = bpy.data.objects.get(arm_src_name)
    if not arm_src:
        raise RuntimeError(f"Armature {arm_src_name} not found in {fbx_path}")
    arm_src.name = 'Source_Arm'

    # Clean all other objects from FBX import immediately
    for o in list(bpy.data.objects):
        if o != arm_src:
            bpy.data.objects.remove(o, do_unlink=True)

    if pre_scale != 1.0:
        arm_src.scale *= pre_scale
        bpy.context.view_layer.update()

    # Center character's base at frame 1
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    pb_hips_src = arm_src.pose.bones.get(hips_src_name)
    if not pb_hips_src:
        raise RuntimeError(f"Hips bone {hips_src_name} not found in {arm_src_name}")
    hips_w = arm_src.matrix_world @ pb_hips_src.head
    print(f"Frame 1 Source Hips world position: {hips_w}")

    arm_src.location.x -= hips_w.x
    arm_src.location.y -= hips_w.y
    arm_src.location.z += z_shift
    bpy.context.view_layer.update()

    # 2. Load Target GLB (Standard Mixamo 52 bones)
    print(f"Loading Reference GLB: {ref_glb_path}")
    bpy.ops.import_scene.gltf(filepath=ref_glb_path)
    arm_tgt = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o != arm_src][0]
    arm_tgt.name = 'Armature'

    # Remove all non-armature objects (meshes, empties)
    for o in list(bpy.data.objects):
        if o != arm_tgt and o != arm_src:
            bpy.data.objects.remove(o, do_unlink=True)

    # Match height scale between src and tgt
    tgt_hips_b = arm_tgt.data.bones['mixamorig:Hips']
    tgt_hips_z = (arm_tgt.matrix_world @ tgt_hips_b.head_local).z
    curr_hips_z = (arm_src.matrix_world @ pb_hips_src.head).z
    if curr_hips_z > 0:
        ratio = tgt_hips_z / curr_hips_z
        print(f"Target Hips Z: {tgt_hips_z:.4f}, Source Hips Z: {curr_hips_z:.4f} -> Scaling source by: {ratio:.4f}")
        arm_src.scale *= ratio
        bpy.context.view_layer.update()

    # 3. Add Constraints to Target Bones
    print("Setting up bone constraints (WORLD -> WORLD)...")
    bpy.context.view_layer.objects.active = arm_tgt
    bpy.ops.object.mode_set(mode='POSE')

    for s_name, t_name in bone_map.items():
        pb = arm_tgt.pose.bones.get(t_name)
        if not pb or s_name not in arm_src.pose.bones:
            continue
        c_rot = pb.constraints.new(type='COPY_ROTATION')
        c_rot.target = arm_src
        c_rot.subtarget = s_name
        c_rot.target_space = 'WORLD'
        c_rot.owner_space = 'WORLD'

        if t_name == 'mixamorig:Hips':
            c_loc = pb.constraints.new(type='COPY_LOCATION')
            c_loc.target = arm_src
            c_loc.subtarget = s_name
            c_loc.target_space = 'WORLD'
            c_loc.owner_space = 'WORLD'

    bpy.ops.pose.select_all(action='SELECT')

    # 4. Bake Action
    act_src = arm_src.animation_data.action
    frame_start = int(act_src.frame_range[0])
    frame_end = int(act_src.frame_range[1])
    print(f"Baking frames {frame_start} to {frame_end}...")

    bpy.ops.nla.bake(
        frame_start=frame_start,
        frame_end=frame_end,
        only_selected=True,
        visual_keying=True,
        clear_constraints=True,
        bake_types={'POSE'}
    )

    bpy.ops.object.mode_set(mode='OBJECT')

    # Standard action name
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
    print(f"=== Successfully exported {name} anim: {size_kb:.1f} KB ===")

def main():
    root_dir = os.path.abspath(".")

    # 1. Hayley (231 frames, ~7.7s)
    if not os.path.exists(os.path.join(root_dir, "public/animations/others/anim_hayley_intro.glb")):
        export_character_anim(
            name="Hayley",
            fbx_path=os.path.join(root_dir, "sources_backup/hayley/raw/source/Hayley2.fbx"),
            ref_glb_path=os.path.join(root_dir, "public/characters/hayley/hayley.glb"),
            out_glb_path=os.path.join(root_dir, "public/animations/others/anim_hayley_intro.glb"),
            arm_src_name="Armature",
            hips_src_name="pelvis",
            bone_map=BONE_MAP_HAYLEY,
            pre_scale=0.1
        )

    # 2. Gloria (398 frames, ~13.3s)
    if not os.path.exists(os.path.join(root_dir, "public/animations/others/anim_gloria_intro.glb")):
        export_character_anim(
            name="Gloria",
            fbx_path=os.path.join(root_dir, "sources_backup/gloria/raw/source/Gloria2.fbx"),
            ref_glb_path=os.path.join(root_dir, "public/characters/gloria/gloria.glb"),
            out_glb_path=os.path.join(root_dir, "public/animations/others/anim_gloria_intro.glb"),
            arm_src_name="root",
            hips_src_name="pelvis",
            bone_map=BONE_MAP_GLORIA,
            pre_scale=1.0
        )

    # 3. Zoe (1082 frames, ~36.1s)
    export_character_anim(
        name="Zoe",
        fbx_path=os.path.join(root_dir, "sources_backup/zoe/raw/source/Zoe Nude-Table.fbx"),
        ref_glb_path=os.path.join(root_dir, "public/characters/zoe/zoe.glb"),
        out_glb_path=os.path.join(root_dir, "public/animations/others/anim_zoe_intro.glb"),
        arm_src_name="Zoe_Nude",
        hips_src_name="CC_Base_Hip",
        bone_map=BONE_MAP_ZOE,
        pre_scale=1.0,
        z_shift=-0.8586
    )

    # 4. Sophia (2001 frames, ~66.7s)
    export_character_anim(
        name="Sophia",
        fbx_path=os.path.join(root_dir, "sources_backup/sophia/raw/source/Sophia Doll VictoryDance.Fbx"),
        ref_glb_path=os.path.join(root_dir, "public/characters/sophia/sophia.glb"),
        out_glb_path=os.path.join(root_dir, "public/animations/others/anim_sophia_victory_dance.glb"),
        arm_src_name="Armature",
        hips_src_name="root_hips",
        bone_map=BONE_MAP_SOPHIA,
        pre_scale=1.0
    )

if __name__ == '__main__':
    main()
