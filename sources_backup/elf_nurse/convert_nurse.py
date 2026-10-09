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
    print("=== Setting up PBR Materials ===")
    mat_configs = {
        'Elf_Halloween_Armor_02': {
            'base': 'Elf_Halloween_Armor_02_Diffuse.png',
            'normal': 'Elf_Halloween_Armor_02_Normal.png',
            'roughness': 0.4,
            'metallic': 0.1
        },
        'Elf_Halloween_Hair_02_HQ': {
            'base': 'Elf_Halloween_Hair_02_HQ_Diffuse.png',
            'roughness': 0.6,
            'alpha': True,
            'blend_method': 'HASHED'
        },
        'Elf_Halloween_Hair_head': {
            'base': 'Elf_Halloween_Hair_head_Diffuse.png',
            'normal': 'Elf_Halloween_Hair_head_Normal.png',
            'roughness': 0.5
        }
    }

    for mat_name, cfg in mat_configs.items():
        mat = bpy.data.materials.get(mat_name)
        if not mat:
            mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        nodes.clear()

        out_node = nodes.new('ShaderNodeOutputMaterial')
        bsdf = nodes.new('ShaderNodeBsdfPrincipled')
        links.new(bsdf.outputs['BSDF'], out_node.inputs['Surface'])

        if 'roughness' in cfg:
            bsdf.inputs['Roughness'].default_value = cfg['roughness']
        if 'metallic' in cfg:
            bsdf.inputs['Metallic'].default_value = cfg['metallic']

        if cfg.get('base'):
            tex_p = os.path.join(tex_dir, cfg['base'])
            if os.path.exists(tex_p):
                img = bpy.data.images.load(tex_p, check_existing=True)
                t_node = nodes.new('ShaderNodeTexImage')
                t_node.image = img
                links.new(t_node.outputs['Color'], bsdf.inputs['Base Color'])
                if cfg.get('alpha'):
                    links.new(t_node.outputs['Alpha'], bsdf.inputs['Alpha'])
                    mat.blend_method = cfg.get('blend_method', 'HASHED')

        if cfg.get('normal'):
            norm_p = os.path.join(tex_dir, cfg['normal'])
            if os.path.exists(norm_p):
                img_n = bpy.data.images.load(norm_p, check_existing=True)
                img_n.colorspace_settings.name = 'Non-Color'
                t_norm = nodes.new('ShaderNodeTexImage')
                t_norm.image = img_n
                norm_node = nodes.new('ShaderNodeNormalMap')
                links.new(t_norm.outputs['Color'], norm_node.inputs['Color'])
                links.new(norm_node.outputs['Normal'], bsdf.inputs['Normal'])

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

def build_character():
    fbx_path = os.path.abspath("sources_backup/elf_nurse/raw/source/Elf_Halloween nurse.fbx")
    tex_dir = os.path.abspath("sources_backup/elf_nurse/raw/textures")
    out_glb = os.path.abspath("public/characters/nurse/nurse.glb")
    out_blend = os.path.abspath("sources_backup/elf_nurse/nurse_tpose.blend")
    out_preview = os.path.abspath("public/characters/nurse/nurse_3d_preview.png")

    print(f"=== 1. Loading FBX: {fbx_path} ===")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)

    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']

    # Clear animation data
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

    # Apply all parent transforms so arm and meshes are at meter scale (unit 1.0)
    for o in bpy.data.objects:
        o.select_set(True)
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    arm.name = 'Armature'
    arm.data.name = 'Armature'
    for m in meshes:
        m.parent = arm
        for mod in m.modifiers:
            if mod.type == 'ARMATURE':
                mod.object = arm

    # Merge secondary vertex groups
    print("=== 2. Merging secondary vertex groups ===")
    for m in meshes:
        # Face and hair to head
        face_vgs = [
            'bone_face_l_eye_0', 'bone_face_r_eye_0', 'bone_face_r_mouth_0', 'bone_face_jaw_0',
            'bone_face_l_mouth_0', 'bone_face_r_eyeblow_0', 'bone_face_l_eyeblow_0',
            'bone_face_u_eyelid_0', 'bone_face_d_eyelid_0', 'bone_hair_0', 'bone_hair1_0',
            'bone_face_l_eye_end_0', 'bone_face_r_eye_end_0', 'bone_face_r_mouth_end_0',
            'bone_face_jaw_end_0', 'bone_face_l_mouth_end_0', 'bone_face_r_eyeblow_end_0',
            'bone_face_l_eyeblow_end_0', 'bone_face_u_eyelid_end_0', 'bone_face_d_eyelid_end_0',
            'bone_hair1_end_0'
        ]
        for vg in face_vgs:
            merge_vg(m, vg, 'bip01_head_0')

        # Chest extras (cape)
        chest_vgs = [
            'caperoot_0', 'bonecaper_0', 'bonecaper_1', 'bonecaper_2', 'bonecaper_3', 'bonecaper_04_end_0',
            'bonecapel_0', 'bonecapel_1', 'bonecapel_2', 'bonecapel_3', 'bonecapel_04_end_0'
        ]
        for vg in chest_vgs:
            merge_vg(m, vg, 'bip01_spine1_0')

        # Armor & weapons
        merge_vg(m, 'bone_armor_l_shoulder_0', 'bip01_l_clavicle_0')
        merge_vg(m, 'bone_armor_r_shoulder_0', 'bip01_r_clavicle_0')
        merge_vg(m, 'bone_weaponl_0', 'bip01_l_hand_0')
        merge_vg(m, 'bone_weaponr_0', 'bip01_r_hand_0')
        merge_vg(m, 'bone_armor_l_thigh_0', 'bip01_l_thigh_0')
        merge_vg(m, 'bone_armor_r_thigh_0', 'bip01_r_thigh_0')

        # Skirt to pelvis
        skirt_vgs = [vg.name for vg in m.vertex_groups if 'skirt' in vg.name]
        for vg in skirt_vgs:
            merge_vg(m, vg, 'bip01_pelvis_0')

    # Edit bones cleaning and restructuring
    print("=== 3. Restructuring Edit Bones to Mixamo 52 bones ===")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones

    # Unparent bip01_pelvis_0 so it is the absolute root
    if 'bip01_pelvis_0' in eb:
        eb['bip01_pelvis_0'].parent = None

    # Connect spine chain:
    # bip01_pelvis_0 -> bip01_spine_0 -> bip01_spine1_0
    # Let's insert mixamorig:Spine1 between spine and spine1, or rename bip01_spine_0 -> Spine, bip01_spine1_0 -> Spine2, and add Spine1
    p_spine = eb['bip01_spine_0']
    p_spine2 = eb['bip01_spine1_0']

    # Create Spine1 halfway between Spine head and Spine2 head
    eb_spine1 = eb.new('mixamorig:Spine1')
    eb_spine1.head = (p_spine.head + p_spine2.head) * 0.5
    eb_spine1.tail = p_spine2.head
    eb_spine1.parent = p_spine
    p_spine2.parent = eb_spine1

    # Connect neck and clavicles to Spine2
    eb['bip01_neck_0'].parent = p_spine2
    eb['bip01_head_0'].parent = eb['bip01_neck_0']
    eb['bip01_l_clavicle_0'].parent = p_spine2
    eb['bip01_r_clavicle_0'].parent = p_spine2

    # Connect breast bones to Spine2
    if 'bone_boob_l_0' in eb:
        eb['bone_boob_l_0'].parent = p_spine2
        eb['bone_boob_l_0'].use_deform = True
    if 'bone_boob_l_end_0' in eb:
        eb['bone_boob_l_end_0'].parent = eb['bone_boob_l_0']
        eb['bone_boob_l_end_0'].use_deform = False

    if 'bone_boob_r_0' in eb:
        eb['bone_boob_r_0'].parent = p_spine2
        eb['bone_boob_r_0'].use_deform = True
    if 'bone_boob_r_end_0' in eb:
        eb['bone_boob_r_end_0'].parent = eb['bone_boob_r_0']
        eb['bone_boob_r_end_0'].use_deform = False

    # Arms
    eb['bip01_l_upperarm_0'].parent = eb['bip01_l_clavicle_0']
    eb['bip01_l_forearm_0'].parent = eb['bip01_l_upperarm_0']
    eb['bip01_l_hand_0'].parent = eb['bip01_l_forearm_0']
    eb['bip01_r_upperarm_0'].parent = eb['bip01_r_clavicle_0']
    eb['bip01_r_forearm_0'].parent = eb['bip01_r_upperarm_0']
    eb['bip01_r_hand_0'].parent = eb['bip01_r_forearm_0']

    # Legs
    eb['bip01_l_thigh_0'].parent = eb['bip01_pelvis_0']
    eb['bip01_l_calf_0'].parent = eb['bip01_l_thigh_0']
    eb['bip01_l_foot_0'].parent = eb['bip01_l_calf_0']

    eb['bip01_r_thigh_0'].parent = eb['bip01_pelvis_0']
    eb['bip01_r_calf_0'].parent = eb['bip01_r_thigh_0']
    eb['bip01_r_foot_0'].parent = eb['bip01_r_calf_0']

    # Create Toe bones
    l_toe = eb.new('mixamorig:LeftToeBase')
    l_toe.head = eb['bip01_l_foot_0'].tail
    l_toe.tail = l_toe.head + Vector((0.0, 0.08, 0.0))
    l_toe.parent = eb['bip01_l_foot_0']

    r_toe = eb.new('mixamorig:RightToeBase')
    r_toe.head = eb['bip01_r_foot_0'].tail
    r_toe.tail = r_toe.head + Vector((0.0, 0.08, 0.0))
    r_toe.parent = eb['bip01_r_foot_0']

    # Fingers:
    # Left Thumb
    eb['bip01_l_finger0_0'].parent = eb['bip01_l_hand_0']
    eb['bip01_l_finger01_0'].parent = eb['bip01_l_finger0_0']
    l_thumb3 = eb.new('mixamorig:LeftHandThumb3')
    l_thumb3.head = eb['bip01_l_finger01_0'].tail
    l_thumb3.tail = l_thumb3.head + (eb['bip01_l_finger01_0'].tail - eb['bip01_l_finger01_0'].head) * 0.5
    l_thumb3.parent = eb['bip01_l_finger01_0']

    # Right Thumb
    eb['bip01_r_finger0_0'].parent = eb['bip01_r_hand_0']
    eb['bip01_r_finger01_0'].parent = eb['bip01_r_finger0_0']
    r_thumb3 = eb.new('mixamorig:RightHandThumb3')
    r_thumb3.head = eb['bip01_r_finger01_0'].tail
    r_thumb3.tail = r_thumb3.head + (eb['bip01_r_finger01_0'].tail - eb['bip01_r_finger01_0'].head) * 0.5
    r_thumb3.parent = eb['bip01_r_finger01_0']

    # Left Index
    eb['bip01_l_finger1_0'].parent = eb['bip01_l_hand_0']
    eb['bip01_l_finger11_0'].parent = eb['bip01_l_finger1_0']
    l_index3 = eb.new('mixamorig:LeftHandIndex3')
    l_index3.head = eb['bip01_l_finger11_0'].tail
    l_index3.tail = l_index3.head + (eb['bip01_l_finger11_0'].tail - eb['bip01_l_finger11_0'].head) * 0.5
    l_index3.parent = eb['bip01_l_finger11_0']

    # Right Index
    eb['bip01_r_finger1_0'].parent = eb['bip01_r_hand_0']
    eb['bip01_r_finger11_0'].parent = eb['bip01_r_finger1_0']
    r_index3 = eb.new('mixamorig:RightHandIndex3')
    r_index3.head = eb['bip01_r_finger11_0'].tail
    r_index3.tail = r_index3.head + (eb['bip01_r_finger11_0'].tail - eb['bip01_r_finger11_0'].head) * 0.5
    r_index3.parent = eb['bip01_r_finger11_0']

    # Helper to create auxiliary fingers (Middle, Ring, Pinky) along the hand direction
    for side, sign in [('Left', 1.0), ('Right', -1.0)]:
        hand_b = eb[f'bip01_{side[0].lower()}_hand_0']
        idx1 = eb[f'bip01_{side[0].lower()}_finger1_0']
        f_dir = (idx1.tail - idx1.head)
        f_len = f_dir.length
        if f_len < 0.001:
            f_dir = Vector((sign * 0.05, 0.0, 0.0))
            f_len = 0.05
        unit_dir = f_dir.normalized()

        for f_name, offset_y in [('Middle', -0.01), ('Ring', -0.02), ('Pinky', -0.03)]:
            prev_b = hand_b
            for seg in range(1, 4):
                bone_name = f'mixamorig:{side}Hand{f_name}{seg}'
                new_b = eb.new(bone_name)
                start_h = idx1.head + Vector((0.0, offset_y, 0.0)) + unit_dir * (seg - 1) * (f_len * 0.35)
                new_b.head = start_h
                new_b.tail = start_h + unit_dir * (f_len * 0.33)
                new_b.parent = prev_b
                prev_b = new_b

    # Define standard bones + breast bones to retain
    bone_rename_map = {
        'bip01_pelvis_0': 'mixamorig:Hips',
        'bip01_spine_0': 'mixamorig:Spine',
        'bip01_spine1_0': 'mixamorig:Spine2',
        'bone_boob_l_0': 'breast_left',
        'bone_boob_l_end_0': 'breast_left_end',
        'bone_boob_r_0': 'breast_right',
        'bone_boob_r_end_0': 'breast_right_end',
        'bip01_neck_0': 'mixamorig:Neck',
        'bip01_head_0': 'mixamorig:Head',
        'bip01_l_clavicle_0': 'mixamorig:LeftShoulder',
        'bip01_l_upperarm_0': 'mixamorig:LeftArm',
        'bip01_l_forearm_0': 'mixamorig:LeftForeArm',
        'bip01_l_hand_0': 'mixamorig:LeftHand',
        'bip01_l_finger0_0': 'mixamorig:LeftHandThumb1',
        'bip01_l_finger01_0': 'mixamorig:LeftHandThumb2',
        'bip01_l_finger1_0': 'mixamorig:LeftHandIndex1',
        'bip01_l_finger11_0': 'mixamorig:LeftHandIndex2',
        'bip01_r_clavicle_0': 'mixamorig:RightShoulder',
        'bip01_r_upperarm_0': 'mixamorig:RightArm',
        'bip01_r_forearm_0': 'mixamorig:RightForeArm',
        'bip01_r_hand_0': 'mixamorig:RightHand',
        'bip01_r_finger0_0': 'mixamorig:RightHandThumb1',
        'bip01_r_finger01_0': 'mixamorig:RightHandThumb2',
        'bip01_r_finger1_0': 'mixamorig:RightHandIndex1',
        'bip01_r_finger11_0': 'mixamorig:RightHandIndex2',
        'bip01_l_thigh_0': 'mixamorig:LeftUpLeg',
        'bip01_l_calf_0': 'mixamorig:LeftLeg',
        'bip01_l_foot_0': 'mixamorig:LeftFoot',
        'bip01_r_thigh_0': 'mixamorig:RightUpLeg',
        'bip01_r_calf_0': 'mixamorig:RightLeg',
        'bip01_r_foot_0': 'mixamorig:RightFoot',
    }

    # Rename existing bones
    for old_name, new_name in bone_rename_map.items():
        if old_name in eb:
            eb[old_name].name = new_name

    # Remove any extra bones not in standard set
    standard_52_names = {
        'mixamorig:Hips', 'mixamorig:Spine', 'mixamorig:Spine1', 'mixamorig:Spine2',
        'mixamorig:Neck', 'mixamorig:Head',
        'mixamorig:LeftShoulder', 'mixamorig:LeftArm', 'mixamorig:LeftForeArm', 'mixamorig:LeftHand',
        'mixamorig:LeftHandThumb1', 'mixamorig:LeftHandThumb2', 'mixamorig:LeftHandThumb3',
        'mixamorig:LeftHandIndex1', 'mixamorig:LeftHandIndex2', 'mixamorig:LeftHandIndex3',
        'mixamorig:LeftHandMiddle1', 'mixamorig:LeftHandMiddle2', 'mixamorig:LeftHandMiddle3',
        'mixamorig:LeftHandRing1', 'mixamorig:LeftHandRing2', 'mixamorig:LeftHandRing3',
        'mixamorig:LeftHandPinky1', 'mixamorig:LeftHandPinky2', 'mixamorig:LeftHandPinky3',
        'mixamorig:RightShoulder', 'mixamorig:RightArm', 'mixamorig:RightForeArm', 'mixamorig:RightHand',
        'mixamorig:RightHandThumb1', 'mixamorig:RightHandThumb2', 'mixamorig:RightHandThumb3',
        'mixamorig:RightHandIndex1', 'mixamorig:RightHandIndex2', 'mixamorig:RightHandIndex3',
        'mixamorig:RightHandMiddle1', 'mixamorig:RightHandMiddle2', 'mixamorig:RightHandMiddle3',
        'mixamorig:RightHandRing1', 'mixamorig:RightHandRing2', 'mixamorig:RightHandRing3',
        'mixamorig:RightHandPinky1', 'mixamorig:RightHandPinky2', 'mixamorig:RightHandPinky3',
        'mixamorig:LeftUpLeg', 'mixamorig:LeftLeg', 'mixamorig:LeftFoot', 'mixamorig:LeftToeBase',
        'mixamorig:RightUpLeg', 'mixamorig:RightLeg', 'mixamorig:RightFoot', 'mixamorig:RightToeBase',
        'breast_left', 'breast_left_end', 'breast_right', 'breast_right_end'
    }

    for b in list(eb):
        if b.name not in standard_52_names:
            eb.remove(b)

    print(f"Remaining Edit bones count: {len(eb)}")
    bpy.ops.object.mode_set(mode='OBJECT')

    # Rename vertex groups on meshes to match new bone names
    for m in meshes:
        for old_name, new_name in bone_rename_map.items():
            vg = m.vertex_groups.get(old_name)
            if vg:
                vg.name = new_name

    # Align height to exactly 1.72 m (172 cm) and ground feet at Z = 0
    print("=== 4. Aligning height and grounding feet ===")
    min_z = 9999.0
    max_z = -9999.0
    for m in meshes:
        for v in m.bound_box:
            world_v = m.matrix_world @ Vector(v)
            if world_v.z < min_z: min_z = world_v.z
            if world_v.z > max_z: max_z = world_v.z

    current_h = max_z - min_z
    target_h = 1.72
    scale_factor = target_h / current_h
    print(f"Height before: {current_h:.3f}m -> scale factor: {scale_factor:.4f}")

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.transform.resize(value=(scale_factor, scale_factor, scale_factor))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # Offset Z so feet are on ground (Z = 0) and centered at X=0, Y=0
    min_z = 9999.0
    for m in meshes:
        for v in m.bound_box:
            world_v = m.matrix_world @ Vector(v)
            if world_v.z < min_z: min_z = world_v.z

    hips_b = arm.data.bones.get('mixamorig:Hips')
    hips_w = arm.matrix_world @ hips_b.head_local
    offset = Vector((-hips_w.x, -hips_w.y, -min_z))

    for o in bpy.context.scene.objects:
        if not o.parent:
            o.location += offset
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)

    # Setup materials
    setup_materials(tex_dir)

    # Save .blend
    os.makedirs(os.path.dirname(out_blend), exist_ok=True)
    os.makedirs(os.path.dirname(out_glb), exist_ok=True)
    os.makedirs(os.path.dirname(out_preview), exist_ok=True)

    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print(f"Saved blend file to: {out_blend}")

    # Export character GLB
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=False,
        export_rest_position_armature=True
    )
    print(f"Successfully exported GLB: {out_glb} ({os.path.getsize(out_glb)/1024:.1f} KB)")

    # Render Preview Thumbnail
    render_preview(out_preview)

def export_nurse_animation():
    print("\n" + "="*50)
    print("=== EXPORTING NURSE NATIVE ANIMATION GLB ===")
    print("="*50)

    fbx_path = os.path.abspath("sources_backup/elf_nurse/raw/source/Elf_Halloween nurse.fbx")
    ref_glb_path = os.path.abspath("public/characters/nurse/nurse.glb")
    out_glb_path = os.path.abspath("public/animations/others/anim_nurse_intro.glb")

    bpy.ops.wm.read_factory_settings(use_empty=True)

    # 1. Load Source FBX
    print(f"Loading source FBX: {fbx_path}")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    arm_src = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    arm_src.name = 'Source_Arm'

    # Remove non-armature objects
    for o in list(bpy.data.objects):
        if o != arm_src:
            bpy.data.objects.remove(o, do_unlink=True)

    # Center character at frame 1
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    pb_hips_src = arm_src.pose.bones.get('bip01_pelvis_0')
    hips_w = arm_src.matrix_world @ pb_hips_src.head
    print(f"Frame 1 Source Hips world position: {hips_w}")
    arm_src.location.x -= hips_w.x
    arm_src.location.y -= hips_w.y
    bpy.context.view_layer.update()

    # 2. Load Target GLB (nurse.glb with standard Mixamo 52 bones)
    print(f"Loading target GLB: {ref_glb_path}")
    bpy.ops.import_scene.gltf(filepath=ref_glb_path)
    arm_tgt = [o for o in bpy.data.objects if o.type == 'ARMATURE' and o != arm_src][0]
    arm_tgt.name = 'Armature'

    # Remove target meshes
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

    # Bone mapping from FBX to standard Mixamo 52 bones
    bone_map = {
        'bip01_pelvis_0': 'mixamorig:Hips',
        'bip01_spine_0': 'mixamorig:Spine',
        'bip01_spine1_0': 'mixamorig:Spine1',
        'bone_boob_l_0': 'breast_left',
        'bone_boob_r_0': 'breast_right',
        'bip01_neck_0': 'mixamorig:Neck',
        'bip01_head_0': 'mixamorig:Head',
        'bip01_l_clavicle_0': 'mixamorig:LeftShoulder',
        'bip01_l_upperarm_0': 'mixamorig:LeftArm',
        'bip01_l_forearm_0': 'mixamorig:LeftForeArm',
        'bip01_l_hand_0': 'mixamorig:LeftHand',
        'bip01_l_finger0_0': 'mixamorig:LeftHandThumb1',
        'bip01_l_finger01_0': 'mixamorig:LeftHandThumb2',
        'bip01_l_finger1_0': 'mixamorig:LeftHandIndex1',
        'bip01_l_finger11_0': 'mixamorig:LeftHandIndex2',
        'bip01_r_clavicle_0': 'mixamorig:RightShoulder',
        'bip01_r_upperarm_0': 'mixamorig:RightArm',
        'bip01_r_forearm_0': 'mixamorig:RightForeArm',
        'bip01_r_hand_0': 'mixamorig:RightHand',
        'bip01_r_finger0_0': 'mixamorig:RightHandThumb1',
        'bip01_r_finger01_0': 'mixamorig:RightHandThumb2',
        'bip01_r_finger1_0': 'mixamorig:RightHandIndex1',
        'bip01_r_finger11_0': 'mixamorig:RightHandIndex2',
        'bip01_l_thigh_0': 'mixamorig:LeftUpLeg',
        'bip01_l_calf_0': 'mixamorig:LeftLeg',
        'bip01_l_foot_0': 'mixamorig:LeftFoot',
        'bip01_r_thigh_0': 'mixamorig:RightUpLeg',
        'bip01_r_calf_0': 'mixamorig:RightLeg',
        'bip01_r_foot_0': 'mixamorig:RightFoot',
    }

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

    # Also have Spine2 copy Spine1 rotation
    pb_spine2 = arm_tgt.pose.bones.get('mixamorig:Spine2')
    if pb_spine2 and 'bip01_spine1_0' in arm_src.pose.bones:
        c_rot2 = pb_spine2.constraints.new(type='COPY_ROTATION')
        c_rot2.target = arm_src
        c_rot2.subtarget = 'bip01_spine1_0'
        c_rot2.target_space = 'WORLD'
        c_rot2.owner_space = 'WORLD'

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
    print(f"=== Successfully exported nurse anim: {size_kb:.1f} KB ===")

if __name__ == '__main__':
    build_character()
    export_nurse_animation()
