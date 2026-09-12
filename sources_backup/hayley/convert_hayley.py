import bpy, math, os
from mathutils import Matrix, Vector

def merge_vg(mesh, src_name, dst_name):
    src_vg = mesh.vertex_groups.get(src_name)
    if not src_vg:
        return
    dst_vg = mesh.vertex_groups.get(dst_name)
    if not dst_vg:
        dst_vg = mesh.vertex_groups.new(name=dst_name)
    for v in mesh.data.vertices:
        for g in v.groups:
            if g.group == src_vg.index and g.weight > 0:
                cur_w = 0.0
                for dg in v.groups:
                    if dg.group == dst_vg.index:
                        cur_w = dg.weight
                        break
                dst_vg.add([v.index], min(1.0, cur_w + g.weight), 'REPLACE')
    mesh.vertex_groups.remove(src_vg)

def setup_materials(tex_dir):
    print("=== Setting up PBR Materials with PNG Textures ===")
    mat_tex_map = {
        'MI_Body_NPC001': {'base': 'T_NPC001_D.png', 'normal': 'T_NPC001_N.png'},
        'MI_Body_NPC001.001': {'base': 'T_NPC001_D.png', 'normal': 'T_NPC001_N.png'},
        'MI_Earring_NPC001': {'base': 'T_Earring_NPC001_D.png'},
        'MI_EyeBall_NPC__L': {'base': 'eye_01_D_L.png'},
        'MI_EyeBall_NPC__R': {'base': 'eye_01_D_R.png'},
        'MI_EyeLash_NPC001': {'base': 'T_Eyelash_F_3_Mask.png', 'alpha': True},
        'MI_Face_NPC001': {'base': 'T_Face_NPC001_D.png', 'normal': 'T_Face_NPC001_N.png'},
        'MI_Glasses_NPC001': {'base': 'T_Glasses_NPC001_D.png'},
        'MI_Glasses_NPC001_Light_Icon': {'base': 'T_GlassRainbow_D.png'},
        'MI_Gloves_NPC001': {'base': 'T_Gloves_NPC001_D.png'},
        'MI_Hair_NPC001_LOD0_Color_Highlight': {'base': 'T_Hair_NPC001_D.png', 'alpha': True},
        'MI_Hair_NPC001_Scalp_Color_Highlight': {'base': 'T_Hair_NPC001_Shell_D.png', 'alpha': True},
        'MI_Hat_NPC001': {'base': 'T_Hat_NPC001_D.png'},
        'MI_LowerBody_NPC001': {'base': 'T_LowerBody_NPC001_D.png', 'normal': 'T_NPC001_N.png'},
        'MI_Shoes_NPC001': {'base': 'T_Shoes_NPC001_D.png'},
        'MI_Teeth_NPC001': {'base': 'T_teeth_color_map_001_D.png'},
        'MI_UpperBody_NPC001': {'base': 'T_UpperBody_NPC001_D.png', 'normal': 'T_NPC001_N.png'},
    }

    for mat_name, tex_info in mat_tex_map.items():
        mat = bpy.data.materials.get(mat_name)
        if not mat:
            continue
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links

        # Find or create Principled BSDF
        bsdf = None
        for n in nodes:
            if n.type == 'BSDF_PRINCIPLED':
                bsdf = n
                break
        if not bsdf:
            bsdf = nodes.new('ShaderNodeBsdfPrincipled')
            output = nodes.get('Material Output') or nodes.new('ShaderNodeOutputMaterial')
            links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

        # Base Color
        base_tex_name = tex_info.get('base')
        if base_tex_name:
            base_tex_path = os.path.join(tex_dir, base_tex_name)
            if os.path.exists(base_tex_path):
                img = bpy.data.images.load(base_tex_path, check_existing=True)
                tex_node = nodes.new('ShaderNodeTexImage')
                tex_node.image = img
                links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
                if tex_info.get('alpha'):
                    links.new(tex_node.outputs['Alpha'], bsdf.inputs['Alpha'])
                    mat.blend_method = 'HASHED'

        # Normal Map
        norm_tex_name = tex_info.get('normal')
        if norm_tex_name:
            norm_tex_path = os.path.join(tex_dir, norm_tex_name)
            if os.path.exists(norm_tex_path):
                img_n = bpy.data.images.load(norm_tex_path, check_existing=True)
                img_n.colorspace_settings.name = 'Non-Color'
                tex_norm = nodes.new('ShaderNodeTexImage')
                tex_norm.image = img_n
                norm_node = nodes.new('ShaderNodeNormalMap')
                links.new(tex_norm.outputs['Color'], norm_node.inputs['Color'])
                links.new(norm_node.outputs['Normal'], bsdf.inputs['Normal'])

def convert_hayley():
    fbx_path = os.path.abspath("sources_backup/hayley/raw/source/Hayley2.fbx")
    tex_dir = os.path.abspath("sources_backup/hayley/raw/textures")
    out_glb = os.path.abspath("public/characters/hayley/hayley.glb")
    out_blend = os.path.abspath("sources_backup/hayley/hayley_tpose.blend")
    out_preview = os.path.abspath("public/characters/hayley/hayley_3d_preview.png")

    print(f"=== 1. Loading FBX: {fbx_path} ===")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)

    # Remove dummy skeleton box if present
    sk = bpy.data.objects.get('skeleton')
    if sk:
        bpy.data.objects.remove(sk, do_unlink=True)

    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']

    # 2. Clear animation data and reset all pose transforms
    print("=== 2. Clearing animation data and resetting pose ===")
    for o in bpy.data.objects:
        if o.animation_data:
            o.animation_data_clear()
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.transforms_clear()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 3. Merge secondary vertex groups into main deform bones
    print("=== 3. Merging secondary vertex groups into main deform bones ===")
    for m in meshes:
        vgs_to_head = [
            'cAdamsApple', 'cChin', 'cFacialRoot', 'cForehead', 'cJaw', 'cJawline',
            'cLipLower', 'cLipUpper', 'cNose', 'cNoseBridge', 'cNoseLower', 'cNoseTip',
            'cSkull', 'cTeethLower', 'cTeethUpper', 'cTongue1', 'cTongue2', 'cTongue3',
            'cUnderChin', 'fronthair1', 'fronthair2', 'fronthair3', 'hair1', 'hair2',
            'hair3', 'hair4', 'hair5', 'hair6', 'hair7', 'lCheekInner', 'lCheekLower',
            'lCheekOuter', 'lChinSide', 'lEar', 'lEarring1', 'lEarring2', 'lEye',
            'lEyeCornerInner', 'lEyeCornerOuter', 'lEyelidLowerA', 'lEyelidLowerB',
            'lEyelidUpperA', 'lEyelidUpperB', 'lEyelidUpperFurrow', 'lEyesackLower',
            'lEyesackUpper', 'lForeheadIn', 'lForeheadMid', 'lForeheadOut', 'lHair1',
            'lHair2', 'lHair3', 'lHair4', 'lHair5', 'lJawline', 'lLipCorner',
            'lLipLower', 'lLipLowerOuter', 'lLipUpper', 'lLipUpperOuter', 'lMasseter',
            'lNasolabialBulge', 'lNasolabialFurrow', 'lNostril', 'lTemple', 'lUnderChin',
            'rCheekInner', 'rCheekLower', 'rCheekOuter', 'rChinSide', 'rEar',
            'rEarring1', 'rEarring2', 'rEye', 'rEyeCornerInner', 'rEyeCornerOuter',
            'rEyelidLowerA', 'rEyelidLowerB', 'rEyelidUpperA', 'rEyelidUpperB',
            'rEyelidUpperFurrow', 'rEyesackLower', 'rEyesackUpper', 'rForeheadIn',
            'rForeheadMid', 'rForeheadOut', 'rHair1', 'rHair2', 'rHair3', 'rHair4',
            'rHair5', 'rJawline', 'rLipCorner', 'rLipLower', 'rLipLowerOuter',
            'rLipUpper', 'rLipUpperOuter', 'rMasseter', 'rNasolabialBulge',
            'rNasolabialFurrow', 'rNostril', 'rTemple', 'rUnderChin', 'glasses_joint'
        ]
        for vg in vgs_to_head:
            merge_vg(m, vg, 'head')

        # Neck
        merge_vg(m, 'neck1', 'neck')

        # Torso / Spine2 (chest)
        vgs_to_chest = [
            'Breast01_l', 'Breast01_r', 'Breast02_l', 'Breast02_r', 'Breast03_l', 'Breast03_r',
            'badge_01', 'badge_02', 'lSpine_04_latissimus', 'rSpine_04_latissimus',
            'jnt_clothBc1_l', 'jnt_clothBc1_r', 'jnt_clothBc2_l', 'jnt_clothBc2_r', 'jnt_clothBc3_l', 'jnt_clothBc3_r',
            'jnt_clothFn1_l', 'jnt_clothFn1_r', 'jnt_clothFn2_l', 'jnt_clothFn2_r', 'jnt_clothFn3_l', 'jnt_clothFn3_r',
            'jnt_clothSd1_l', 'jnt_clothSd1_r', 'jnt_clothSd2_l', 'jnt_clothSd2_r', 'jnt_clothSd3_l', 'jnt_clothSd3_r',
            'chest'
        ]
        for vg in vgs_to_chest:
            merge_vg(m, vg, 'spine2')

        # Pelvis / Hips (skirt)
        vgs_to_pelvis = [
            'jnt_skirt_grp',
            'jnt_skirtFn1_m', 'jnt_skirtFn2_m', 'jnt_skirtFn3_m',
            'jnt_skirtFn1_l', 'jnt_skirtFn2_l', 'jnt_skirtFn3_l',
            'jnt_skirtFn1_r', 'jnt_skirtFn2_r', 'jnt_skirtFn3_r',
            'jnt_skirtSd1_l', 'jnt_skirtSd2_l', 'jnt_skirtSd3_l',
            'jnt_skirtSd1_r', 'jnt_skirtSd2_r', 'jnt_skirtSd3_r',
            'jnt_skirtBc1_l', 'jnt_skirtBc2_l', 'jnt_skirtBc3_l',
            'jnt_skirtBc1_m1', 'jnt_skirtBc2_m', 'jnt_skirtBc3_m',
            'jnt_skirtBc1_r', 'jnt_skirtBc2_r', 'jnt_skirtBc3_r',
            'root', 'prop01', 'prop02'
        ]
        for vg in vgs_to_pelvis:
            merge_vg(m, vg, 'pelvis')

        # Clavicles / Shoulders
        for vg in ['lClavicle_out', 'lClavicle_scap', 'lClavicle_pec']:
            merge_vg(m, vg, 'lScapula')
        for vg in ['rClavicle_out', 'rClavicle_rec', 'rClavicle_scap']:
            merge_vg(m, vg, 'rScapula')

        # Upper arms
        vgs_to_lshoulder = [
            'lShoulderTwist1', 'lShoulderTwist1Split', 'lShoulderTwist2',
            'lUpperarm_bicep', 'lUpperarm_tricep', 'lUpperarm_in', 'lUpperarm_inSplit',
            'lUpperarm_out', 'lUpperarm_fwd', 'lUpperarm_bck'
        ]
        for vg in vgs_to_lshoulder:
            merge_vg(m, vg, 'lShoulder')

        vgs_to_rshoulder = [
            'rShoulderTwist1', 'rShoulderTwist1Split', 'rShoulderTwist2',
            'rUpperarm_bicep', 'rUpperarm_tricep', 'rUpperarm_in', 'rUpperarm_inSplit',
            'rUpperarm_out', 'rUpperarm_fwd', 'rUpperarm_bck'
        ]
        for vg in vgs_to_rshoulder:
            merge_vg(m, vg, 'rShoulder')

        # Forearms
        vgs_to_lforearm = [
            'lForearmTwist1', 'lForearmTwist2', 'lLowerarm_fwd', 'lLowerarm_out',
            'lLlowerarm_bck', 'lLowerarm_in', 'lWrist_inner', 'lWrist_outer'
        ]
        for vg in vgs_to_lforearm:
            merge_vg(m, vg, 'lForearm')

        vgs_to_rforearm = [
            'rForearmTwist1', 'rForearmTwist2', 'rLowerarm_fwd', 'rLowerarm_out',
            'rLowerarm_bck', 'rLowerarm_in', 'rWrist_inner', 'rWrist_outer'
        ]
        for vg in vgs_to_rforearm:
            merge_vg(m, vg, 'rForearm')

        # Legs - Thighs
        vgs_to_lthigh = [
            'lThighTwist1', 'lThighTwist2', 'lThigh_out', 'lThigh_in',
            'lThigh_bckLwr', 'lThigh_bck', 'lThigh_fwd', 'lThigh_fwdLwr'
        ]
        for vg in vgs_to_lthigh:
            merge_vg(m, vg, 'lThigh')

        vgs_to_rthigh = [
            'rThighTwist1', 'rThighTwist2', 'rThigh_out', 'rThigh_in',
            'rThigh_bckLwr', 'rThigh_bck', 'rThigh_fwd', 'rThigh_fwdLwr'
        ]
        for vg in vgs_to_rthigh:
            merge_vg(m, vg, 'rThigh')

        # Legs - Calves / Knees
        for vg in ['lKneeTwist1', 'lKneeTwist2', 'lCalf_knee', 'lCalf_kneeBack']:
            merge_vg(m, vg, 'lKnee')
        for vg in ['rKneeTwist1', 'rKneeTwist2', 'rCalf_knee', 'rCalf_kneeBack']:
            merge_vg(m, vg, 'rKnee')

        # Feet
        for vg in ['lAnkle_fwd', 'lAnkle_bck', 'lMetatarsal']:
            merge_vg(m, vg, 'lFoot')
        for vg in ['rAnkle_fwd', 'rAnkle_bck', 'rMetatarsar']:
            merge_vg(m, vg, 'rFoot')

    # 4. Clean Armature Edit Bones
    print("=== 4. Cleaning Armature bones to exact Mixamo set ===")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    edit_bones = arm.data.edit_bones

    # Unparent pelvis so it is root
    if 'pelvis' in edit_bones:
        edit_bones['pelvis'].parent = None

    # Connect spine2 to neck, and neck to head
    if 'neck' in edit_bones and 'spine2' in edit_bones:
        edit_bones['neck'].parent = edit_bones['spine2']
    if 'head' in edit_bones and 'neck' in edit_bones:
        edit_bones['head'].parent = edit_bones['neck']

    # Clavicles to spine2
    if 'lScapula' in edit_bones and 'spine2' in edit_bones:
        edit_bones['lScapula'].parent = edit_bones['spine2']
    if 'rScapula' in edit_bones and 'spine2' in edit_bones:
        edit_bones['rScapula'].parent = edit_bones['spine2']

    # Shoulder (Arm) -> Forearm -> Hand
    if 'lShoulder' in edit_bones and 'lScapula' in edit_bones:
        edit_bones['lShoulder'].parent = edit_bones['lScapula']
    if 'lForearm' in edit_bones and 'lShoulder' in edit_bones:
        edit_bones['lForearm'].parent = edit_bones['lShoulder']
    if 'lHand' in edit_bones and 'lForearm' in edit_bones:
        edit_bones['lHand'].parent = edit_bones['lForearm']

    if 'rShoulder' in edit_bones and 'rScapula' in edit_bones:
        edit_bones['rShoulder'].parent = edit_bones['rScapula']
    if 'rForearm' in edit_bones and 'rShoulder' in edit_bones:
        edit_bones['rForearm'].parent = edit_bones['rShoulder']
    if 'rHand' in edit_bones and 'rForearm' in edit_bones:
        edit_bones['rHand'].parent = edit_bones['rForearm']

    # Legs: Thigh -> Knee -> Foot -> Toe
    if 'lKnee' in edit_bones and 'lThigh' in edit_bones:
        edit_bones['lKnee'].parent = edit_bones['lThigh']
    if 'lFoot' in edit_bones and 'lKnee' in edit_bones:
        edit_bones['lFoot'].parent = edit_bones['lKnee']
    if 'lToe' in edit_bones and 'lFoot' in edit_bones:
        edit_bones['lToe'].parent = edit_bones['lFoot']

    if 'rKnee' in edit_bones and 'rThigh' in edit_bones:
        edit_bones['rKnee'].parent = edit_bones['rThigh']
    if 'rFoot' in edit_bones and 'rKnee' in edit_bones:
        edit_bones['rFoot'].parent = edit_bones['rKnee']
    if 'rToe' in edit_bones and 'rFoot' in edit_bones:
        edit_bones['rToe'].parent = edit_bones['rFoot']

    # Finger parents to Hand
    for f in ['lThumb1', 'lIndex1', 'lMid1', 'lRing1', 'lPinky1']:
        if f in edit_bones and 'lHand' in edit_bones:
            edit_bones[f].parent = edit_bones['lHand']
    for f in ['rThumb1', 'rIndex1', 'rMid1', 'rRing1', 'rPinky1']:
        if f in edit_bones and 'rHand' in edit_bones:
            edit_bones[f].parent = edit_bones['rHand']

    # Define standard 52 bones to KEEP
    standard_bones = {
        'pelvis', 'spine', 'spine1', 'spine2', 'neck', 'head',
        'lScapula', 'lShoulder', 'lForearm', 'lHand',
        'lThumb1', 'lThumb2', 'lThumb3',
        'lIndex1', 'lIndex2', 'lIndex3',
        'lMid1', 'lMid2', 'lMid3',
        'lRing1', 'lRing2', 'lRing3',
        'lPinky1', 'lPinky2', 'lPinky3',
        'rScapula', 'rShoulder', 'rForearm', 'rHand',
        'rThumb1', 'rThumb2', 'rThumb3',
        'rIndex1', 'rIndex2', 'rIndex3',
        'rMid1', 'rMid2', 'rMid3',
        'rRing1', 'rRing2', 'rRing3',
        'rPinky1', 'rPinky2', 'rPinky3',
        'lThigh', 'lKnee', 'lFoot', 'lToe',
        'rThigh', 'rKnee', 'rFoot', 'rToe'
    }

    bones_to_remove = [b.name for b in edit_bones if b.name not in standard_bones]
    for bname in bones_to_remove:
        if bname in edit_bones:
            edit_bones.remove(edit_bones[bname])

    print(f"Kept {len(edit_bones)} standard bones. Removed {len(bones_to_remove)} secondary/dummy bones.")
    bpy.ops.object.mode_set(mode='OBJECT')

    # 5. Map bone names to standard Mixamo naming
    print("=== 5. Mapping bones to standard Mixamo names ===")
    bone_map = {
        'pelvis': 'mixamorig:Hips',
        'spine': 'mixamorig:Spine',
        'spine1': 'mixamorig:Spine1',
        'spine2': 'mixamorig:Spine2',
        'neck': 'mixamorig:Neck',
        'head': 'mixamorig:Head',
        # Left Arm
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
        # Right Arm
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
        # Legs
        'lThigh': 'mixamorig:LeftUpLeg',
        'lKnee': 'mixamorig:LeftLeg',
        'lFoot': 'mixamorig:LeftFoot',
        'lToe': 'mixamorig:LeftToeBase',
        'rThigh': 'mixamorig:RightUpLeg',
        'rKnee': 'mixamorig:RightLeg',
        'rFoot': 'mixamorig:RightFoot',
        'rToe': 'mixamorig:RightToeBase',
    }

    for old_name, new_name in bone_map.items():
        b = arm.data.bones.get(old_name)
        if b:
            b.name = new_name

    for m in meshes:
        for old_name, new_name in bone_map.items():
            vg = m.vertex_groups.get(old_name)
            if vg:
                vg.name = new_name

    # 6. Align arms into perfect horizontal T-pose
    print("=== 6. Aligning arms to strictly collinear horizontal T-Pose ===")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')

    def align_arm_chain(pb_arm, pb_forearm, pb_wrist, pb_mid, target_dir):
        bpy.context.view_layer.update()
        v1 = (pb_forearm.head - pb_arm.head).normalized()
        q1 = v1.rotation_difference(target_dir)
        T1 = Matrix.Translation(pb_arm.head)
        rot_mat1 = T1 @ q1.to_matrix().to_4x4() @ T1.inverted()
        pb_arm.matrix = rot_mat1 @ pb_arm.matrix
        bpy.context.view_layer.update()

        v2 = (pb_wrist.head - pb_forearm.head).normalized()
        q2 = v2.rotation_difference(target_dir)
        T2 = Matrix.Translation(pb_forearm.head)
        rot_mat2 = T2 @ q2.to_matrix().to_4x4() @ T2.inverted()
        pb_forearm.matrix = rot_mat2 @ pb_forearm.matrix
        bpy.context.view_layer.update()

        v3 = (pb_mid.head - pb_wrist.head).normalized()
        q3 = v3.rotation_difference(target_dir)
        T3 = Matrix.Translation(pb_wrist.head)
        rot_mat3 = T3 @ q3.to_matrix().to_4x4() @ T3.inverted()
        pb_wrist.matrix = rot_mat3 @ pb_wrist.matrix
        bpy.context.view_layer.update()

    align_arm_chain(
        arm.pose.bones['mixamorig:LeftArm'],
        arm.pose.bones['mixamorig:LeftForeArm'],
        arm.pose.bones['mixamorig:LeftHand'],
        arm.pose.bones['mixamorig:LeftHandMiddle1'],
        Vector((1.0, 0.0, 0.0))
    )
    align_arm_chain(
        arm.pose.bones['mixamorig:RightArm'],
        arm.pose.bones['mixamorig:RightForeArm'],
        arm.pose.bones['mixamorig:RightHand'],
        arm.pose.bones['mixamorig:RightHandMiddle1'],
        Vector((-1.0, 0.0, 0.0))
    )

    # Bake pose into mesh vertex coordinates and set rest pose
    print("=== 7. Baking T-Pose to meshes and rest pose ===")
    bpy.ops.object.mode_set(mode='OBJECT')
    for m in meshes:
        bpy.context.view_layer.objects.active = m
        for mod in list(m.modifiers):
            if mod.type == 'ARMATURE':
                bpy.ops.object.modifier_apply(modifier=mod.name)
                new_mod = m.modifiers.new(name='Armature', type='ARMATURE')
                new_mod.object = arm

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.armature_apply()
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones
    if 'mixamorig:LeftHand' in eb and 'mixamorig:LeftHandMiddle1' in eb:
        eb['mixamorig:LeftHand'].tail = eb['mixamorig:LeftHandMiddle1'].head
    if 'mixamorig:RightHand' in eb and 'mixamorig:RightHandMiddle1' in eb:
        eb['mixamorig:RightHand'].tail = eb['mixamorig:RightHandMiddle1'].head
    bpy.ops.object.mode_set(mode='OBJECT')

    # 8. Height calibration to 1.68m (168 cm) and Grounding
    print("=== 8. Calibrating height to 1.68m and grounding ===")
    min_z = 9999.0
    max_z = -9999.0
    for m in meshes:
        for v in m.bound_box:
            world_v = m.matrix_world @ Vector(v)
            if world_v.z < min_z: min_z = world_v.z
            if world_v.z > max_z: max_z = world_v.z

    current_height = max_z - min_z
    print(f"Current mesh height: {current_height:.3f} (min_z: {min_z:.3f}, max_z: {max_z:.3f})")

    target_h = 1.68
    scale_factor = target_h / current_height

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.transform.resize(value=(scale_factor, scale_factor, scale_factor))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    min_z = 9999.0
    for m in meshes:
        for v in m.bound_box:
            world_v = m.matrix_world @ Vector(v)
            if world_v.z < min_z: min_z = world_v.z

    hips_bone = arm.data.bones.get('mixamorig:Hips')
    hips_world = arm.matrix_world @ hips_bone.head_local if hips_bone else Vector((0, 0, 0))
    offset = Vector((-hips_world.x, -hips_world.y, -min_z))

    for o in bpy.context.scene.objects:
        if not o.parent:
            o.location += offset

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    print("\n=== FINAL REST POSE BONE HEADS ===")
    for bname in ['mixamorig:Hips', 'mixamorig:LeftShoulder', 'mixamorig:LeftArm', 'mixamorig:LeftForeArm', 'mixamorig:LeftHand', 'mixamorig:RightShoulder', 'mixamorig:RightArm', 'mixamorig:RightForeArm', 'mixamorig:RightHand', 'mixamorig:LeftFoot', 'mixamorig:RightFoot']:
        b = arm.data.bones.get(bname)
        if b:
            h = arm.matrix_world @ b.head_local
            print(f"{bname:25}: ({h.x:7.4f}, {h.y:7.4f}, {h.z:7.4f})")

    # 9. Setup PBR materials and textures
    setup_materials(tex_dir)

    # 10. Save .blend
    print(f"=== 10. Saving .blend to {out_blend} ===")
    os.makedirs(os.path.dirname(out_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)

    # 11. Export GLB
    print(f"=== 11. Exporting GLB to {out_glb} ===")
    os.makedirs(os.path.dirname(out_glb), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_rest_position_armature=True
    )
    print(f"Successfully exported GLB: {out_glb} ({os.path.getsize(out_glb)} bytes)")

    # 12. Render Preview Thumbnail
    print("=== 12. Rendering preview thumbnail ===")
    render_preview(out_preview)

def render_preview(out_path):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'MATCAP'
    scene.display.shading.color_type = 'TEXTURE'
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = out_path

    cam_data = bpy.data.cameras.new("PreviewCam")
    cam_obj = bpy.data.objects.new("PreviewCam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    cam_obj.location = (0.0, -2.4, 1.1)
    cam_obj.rotation_euler = (math.radians(82), 0, 0)

    bpy.ops.render.render(write_still=True)
    print(f"Rendered preview to {out_path}")

if __name__ == "__main__":
    convert_hayley()
