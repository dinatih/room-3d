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
    
    # Material definitions
    # Mat name -> { base, normal, emission, alpha, transmission, roughness, metallic, color }
    mat_configs = {
        'PC_010_A0101_Face_Ml': {
            'base': 'PC_010_A0101_Face_Ml_Diffuse.png',
            'normal': 'PC_010_A0101_Face_Ml_Normal.png',
            'roughness': 0.45,
            'metallic': 0.0
        },
        'PC_010_U_CMN_001_Body_PartA_Ml': {
            'base': 'PC_010_U_CMN_001_Body_PartA_Ml_Diffuse.png',
            'normal': 'PC_010_U_CMN_001_Body_PartA_Ml_Normal.png',
            'emission': 'PC_010_U_CMN_001_Body_PartA_e.png',
            'roughness': 0.35,
            'metallic': 0.3
        },
        'PC_010_U_CMN_001_Body_PartB_Ml': {
            'base': 'PC_010_U_CMN_001_Body_PartB_Ml_Diffuse.png',
            'normal': 'PC_010_U_CMN_001_Body_PartB_Ml_Normal.png',
            'emission': 'PC_010_U_CMN_001_Body_PartB_e.png',
            'roughness': 0.35,
            'metallic': 0.3
        },
        'PC_010_U_CMN_001_Body_Tube_MI': {
            'base': 'PC_010_U_CMN_001_Body_Tube_MI_Diffuse.png',
            'roughness': 0.2,
            'metallic': 0.1
        },
        'PC_010_U_CMN_001_Body_Glass_MI': {
            'color': (0.2, 0.6, 0.95, 0.45),
            'roughness': 0.1,
            'transmission': 0.85,
            'blend_mode': 'BLEND'
        },
        'PC_010_U_CMN_001_Helmet_Ml': {
            'base': 'PC_010_U_CMN_001_Helmet_Ml_Diffuse.png',
            'normal': 'PC_010_U_CMN_001_Helmet_Ml_Normal.png',
            'emission': 'PC_010_U_CMN_001_Helmet_e.png',
            'roughness': 0.3,
            'metallic': 0.4
        },
        'PC_010_U_CMN_001_Helmet_Glass_MI': {
            'base': 'PC_010_U_CMN_001_Helmet_Glass_MI_Diffuse.png',
            'color': (0.3, 0.7, 1.0, 0.4),
            'roughness': 0.05,
            'transmission': 0.8,
            'blend_mode': 'BLEND'
        },
        'Tiny_Iris_1_3__Real_Blue__001': {
            'color': (0.15, 0.45, 0.9, 1.0),
            'roughness': 0.1,
            'metallic': 0.0
        },
        'Tiny_Sclera_1_3__Real_Blue__001': {
            'color': (0.93, 0.93, 0.95, 1.0),
            'roughness': 0.2,
            'metallic': 0.0
        },
        'PC_010_A0101_Eyelash_Ml': {
            'color': (0.05, 0.04, 0.04, 1.0),
            'roughness': 0.8,
            'blend_mode': 'HASHED'
        },
        'PC_010_A_EyeBrow_MI': {
            'color': (0.1, 0.08, 0.06, 1.0),
            'roughness': 0.8,
            'blend_mode': 'HASHED'
        },
        'PC_010_A0101_Teeth_Ml': {
            'color': (0.95, 0.94, 0.92, 1.0),
            'roughness': 0.3
        },
        'PC_010_A0101_Tearline_Ml': {
            'color': (0.9, 0.95, 1.0, 0.3),
            'roughness': 0.1,
            'transmission': 0.9,
            'blend_mode': 'BLEND'
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

        if 'color' in cfg:
            bsdf.inputs['Base Color'].default_value = cfg['color']
        if 'roughness' in cfg:
            bsdf.inputs['Roughness'].default_value = cfg['roughness']
        if 'metallic' in cfg:
            bsdf.inputs['Metallic'].default_value = cfg['metallic']
        if 'transmission' in cfg:
            if 'Transmission Weight' in bsdf.inputs:
                bsdf.inputs['Transmission Weight'].default_value = cfg['transmission']
            elif 'Transmission' in bsdf.inputs:
                bsdf.inputs['Transmission'].default_value = cfg['transmission']
        if 'blend_mode' in cfg:
            mat.blend_method = cfg['blend_mode']

        # Base Color Texture
        if 'base' in cfg:
            tex_path = os.path.join(tex_dir, cfg['base'])
            if os.path.exists(tex_path):
                img = bpy.data.images.load(tex_path, check_existing=True)
                tex_node = nodes.new('ShaderNodeTexImage')
                tex_node.image = img
                links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
                print(f"  [Mat {mat_name}] Loaded Diffuse: {cfg['base']}")

        # Normal Map Texture
        if 'normal' in cfg:
            norm_path = os.path.join(tex_dir, cfg['normal'])
            if os.path.exists(norm_path):
                img_n = bpy.data.images.load(norm_path, check_existing=True)
                img_n.colorspace_settings.name = 'Non-Color'
                tex_n = nodes.new('ShaderNodeTexImage')
                tex_n.image = img_n
                norm_node = nodes.new('ShaderNodeNormalMap')
                links.new(tex_n.outputs['Color'], norm_node.inputs['Color'])
                links.new(norm_node.outputs['Normal'], bsdf.inputs['Normal'])
                print(f"  [Mat {mat_name}] Loaded Normal: {cfg['normal']}")

        # Emission Texture
        if 'emission' in cfg:
            e_path = os.path.join(tex_dir, cfg['emission'])
            if os.path.exists(e_path):
                img_e = bpy.data.images.load(e_path, check_existing=True)
                tex_e = nodes.new('ShaderNodeTexImage')
                tex_e.image = img_e
                if 'Emission Color' in bsdf.inputs:
                    links.new(tex_e.outputs['Color'], bsdf.inputs['Emission Color'])
                    bsdf.inputs['Emission Strength'].default_value = 1.5
                elif 'Emission' in bsdf.inputs:
                    links.new(tex_e.outputs['Color'], bsdf.inputs['Emission'])
                print(f"  [Mat {mat_name}] Loaded Emission: {cfg['emission']}")

def render_preview(glb_path, out_png):
    print(f"=== Rendering 3D Preview to {out_png} ===")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'

    bpy.ops.import_scene.gltf(filepath=glb_path)
    meshes = [obj for obj in scene.objects if obj.type in ('MESH', 'CURVE')]

    min_c = Vector((float('inf'), float('inf'), float('inf')))
    max_c = Vector((float('-inf'), float('-inf'), float('-inf')))
    for obj in meshes:
        for v in obj.bound_box:
            w_v = obj.matrix_world @ Vector(v)
            for i in range(3):
                min_c[i] = min(min_c[i], w_v[i])
                max_c[i] = max(max_c[i], w_v[i])

    center = (min_c + max_c) / 2
    size = max_c - min_c
    max_dim = max(size.x, size.y, size.z)

    # Focus camera on upper torso & head for nice character portrait
    cam_target = Vector((center.x, center.y + size.y * 0.15, center.z))
    cam_data = bpy.data.cameras.new(name="Camera")
    cam_obj = bpy.data.objects.new(name="Camera", object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    dist = max(max_dim * 0.9, 80.0)
    cam_obj.location = cam_target + Vector((dist * 0.15, -dist * 0.9, dist * 0.05))
    direction = cam_target - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    # Lighting
    light_data = bpy.data.lights.new(name="LightKey", type='SUN')
    light_data.energy = 4.0
    light_obj = bpy.data.objects.new(name="LightKey", object_data=light_data)
    scene.collection.objects.link(light_obj)
    light_obj.rotation_euler = (math.radians(50), math.radians(25), math.radians(45))

    light_data2 = bpy.data.lights.new(name="LightFill", type='SUN')
    light_data2.energy = 2.5
    light_obj2 = bpy.data.objects.new(name="LightFill", object_data=light_data2)
    scene.collection.objects.link(light_obj2)
    light_obj2.rotation_euler = (math.radians(-20), math.radians(-50), 0)

    scene.render.filepath = out_png
    bpy.ops.render.render(write_still=True)
    print(f"Preview successfully rendered to: {out_png}")

def convert_valby():
    fbx_path = os.path.abspath("sources_backup/personnages/valby_nano_body_suit/source/Valby_nano_body_suit2out.fbx")
    tex_dir = os.path.abspath("sources_backup/personnages/valby_nano_body_suit/textures")
    out_glb = os.path.abspath("public/characters/valby/valby.glb")
    out_blend = os.path.abspath("sources_backup/valby/valby_tpose.blend")
    out_preview = os.path.abspath("public/characters/valby/valby_3d_preview.png")

    print(f"=== 1. Loading FBX: {fbx_path} ===")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)

    # Remove Shadow_Catcher object and its mesh/armature
    sc = bpy.data.objects.get('Shadow_Catcher')
    if sc:
        bpy.data.objects.remove(sc, do_unlink=True)
    plane = bpy.data.objects.get('Plane_001')
    if plane:
        bpy.data.objects.remove(plane, do_unlink=True)

    arm = bpy.data.objects.get('RL_BoneRoot')
    if not arm:
        arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    arm.name = 'Armature'
    arm.data.name = 'Armature'

    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    print(f"Found Armature with {len(arm.data.bones)} bones and {len(meshes)} meshes.")

    # 2. Clear animation data and reset all pose transforms
    print("=== 2. Clearing animation data and resetting pose ===")
    for o in bpy.data.objects:
        if o.animation_data:
            o.animation_data_clear()
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)

    arm.location = (0, 0, 0)
    arm.rotation_euler = (0, 0, 0)

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='SELECT')
    bpy.ops.pose.transforms_clear()
    bpy.ops.object.mode_set(mode='OBJECT')

    # 3. Setup PBR Materials
    setup_materials(tex_dir)

    # 4. Merge secondary vertex groups into main deform bones
    print("=== 4. Merging secondary vertex groups ===")
    vg_merge_rules = [
        # Head / Neck
        ('PC_010_U_CMN_HEAD_001_LOD0_0', 'Bip001_Head'),
        ('Eye_L_003', 'Bip001_Head'),
        ('Eye_R_003', 'Bip001_Head'),
        ('Fx_Screen', 'Bip001_Head'),
        ('Bn_Twist_Bip001_Neck', 'Bip001_Neck'),
        ('Bn_Twist_Bip001_Neck1', 'Bip001_Neck'),
        ('Bn_Twist_Bip001_Neck2', 'Bip001_Neck'),
        # Pelvis
        ('Bn_Shape_Pelvis_L', 'Bip001_Pelvis'),
        ('Bn_Shape_Pelvis_L11', 'Bip001_Pelvis'),
        ('Bn_Shape_Pelvis_R', 'Bip001_Pelvis'),
        ('Bn_Shape_Pelvis_R11', 'Bip001_Pelvis'),
        ('Bn_Shape_CrotchTw_L1', 'Bip001_Pelvis'),
        ('Bn_Shape_CrotchTw_R1', 'Bip001_Pelvis'),
        ('Bip001_Spine', 'Bip001_Spine1'), # Merge Spine into Spine1
        # Spine2
        ('Bn_Shape_Bip001_Spine2_L', 'Bip001_Spine2'),
        ('Bn_Shape_Bip001_Spine2_R', 'Bip001_Spine2'),
        # Arms - Left
        ('Bn_Shape_Armpit_L', 'Bip001_L_UpperArm'),
        ('Bn_Twist_Bip001_L_UpperArm', 'Bip001_L_UpperArm'),
        ('Bn_Twist_Bip001_L_UpperArm1', 'Bip001_L_UpperArm'),
        ('Bn_Twist_Bip001_L_UpperArm2', 'Bip001_L_UpperArm'),
        ('Bn_Twist_Bip001_L_UpperArm3', 'Bip001_L_UpperArm'),
        ('Bn_Sec_UpperArmParts_L11', 'Bip001_L_UpperArm'),
        ('Bn_Shape_Elbow_L', 'Bip001_L_Forearm'),
        ('Bn_Twist_Bip001_L_Forearm', 'Bip001_L_Forearm'),
        ('Bn_Twist_Bip001_L_Forearm1', 'Bip001_L_Forearm'),
        ('Bn_Twist_Bip001_L_Forearm2', 'Bip001_L_Forearm'),
        ('Bn_Twist_Bip001_L_Forearm3', 'Bip001_L_Forearm'),
        ('Bn_Shape_Wrist_L', 'Bip001_L_Hand'),
        # Arms - Right
        ('Bn_Shape_Armpit_R', 'Bip001_R_UpperArm'),
        ('Bn_Twist_Bip001_R_UpperArm', 'Bip001_R_UpperArm'),
        ('Bn_Twist_Bip001_R_UpperArm1', 'Bip001_R_UpperArm'),
        ('Bn_Twist_Bip001_R_UpperArm2', 'Bip001_R_UpperArm'),
        ('Bn_Twist_Bip001_R_UpperArm3', 'Bip001_R_UpperArm'),
        ('Bn_Sec_UpperArmParts_R11', 'Bip001_R_UpperArm'),
        ('Bn_Shape_Elbow_R', 'Bip001_R_Forearm'),
        ('Bn_Twist_Bip001_R_Forearm', 'Bip001_R_Forearm'),
        ('Bn_Twist_Bip001_R_Forearm1', 'Bip001_R_Forearm'),
        ('Bn_Twist_Bip001_R_Forearm2', 'Bip001_R_Forearm'),
        ('Bn_Twist_Bip001_R_Forearm3', 'Bip001_R_Forearm'),
        ('Bn_Shape_Wrist_R', 'Bip001_R_Hand'),
        # Legs - Left
        ('Bn_Shape_Bip001_Thigh_L', 'Bip001_L_Thigh'),
        ('Bn_Shape_ThighTw1_L1', 'Bip001_L_Thigh'),
        ('Bn_Shape_Twist_Bip001_L_Thigh2', 'Bip001_L_Thigh'),
        ('Bn_Shape_Twist_Bip001_L_Thigh3', 'Bip001_L_Thigh'),
        ('Bn_Twist_Bip001_L_Thigh', 'Bip001_L_Thigh'),
        ('Bn_Twist_Bip001_L_Thigh1', 'Bip001_L_Thigh'),
        ('Bn_Shape_Knee_L', 'Bip001_L_Calf'),
        ('Bn_Shape_Knee_L1', 'Bip001_L_Calf'),
        ('Bn_Shape_Knee_L2', 'Bip001_L_Calf'),
        ('Bn_Shape_Knee_L_Down1', 'Bip001_L_Calf'),
        ('Bn_Shape_Knee_L_Down2', 'Bip001_L_Calf'),
        ('Bn_Shape_Knee_L_Up1', 'Bip001_L_Calf'),
        ('Bn_Shape_Knee_L_Up2', 'Bip001_L_Calf'),
        ('Bn_Shape_Bip001_Calf_L', 'Bip001_L_Calf'),
        ('Bn_Shape_Bip001_L_Toe0', 'Bip001_L_Toe0'),
        # Legs - Right
        ('Bn_Shape_Bip001_Thigh_R', 'Bip001_R_Thigh'),
        ('Bn_Shape_ThighTw1_R1', 'Bip001_R_Thigh'),
        ('Bn_Shape_Twist_Bip001_R_Thigh2', 'Bip001_R_Thigh'),
        ('Bn_Shape_Twist_Bip001_R_Thigh3', 'Bip001_R_Thigh'),
        ('Bn_Twist_Bip001_R_Thigh', 'Bip001_R_Thigh'),
        ('Bn_Twist_Bip001_R_Thigh1', 'Bip001_R_Thigh'),
        ('Bn_Shape_Knee_R', 'Bip001_R_Calf'),
        ('Bn_Shape_Knee_R1', 'Bip001_R_Calf'),
        ('Bn_Shape_Knee_R2', 'Bip001_R_Calf'),
        ('Bn_Shape_Knee_R_Down1', 'Bip001_R_Calf'),
        ('Bn_Shape_Knee_R_Down2', 'Bip001_R_Calf'),
        ('Bn_Shape_Knee_R_Up1', 'Bip001_R_Calf'),
        ('Bn_Shape_Knee_R_Up2', 'Bip001_R_Calf'),
        ('Bn_Shape_Bip001_Calf_R', 'Bip001_R_Calf'),
        ('Bn_Shape_Bip001_R_Toe0', 'Bip001_R_Toe0'),
    ]

    for m in meshes:
        for src, dst in vg_merge_rules:
            merge_vg(m, src, dst)

    # 5. Clean Armature Edit Bones
    print("=== 5. Cleaning Armature Bones ===")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    edit_bones = arm.data.edit_bones

    # Unparent Pelvis so it becomes the clean root
    if 'Bip001_Pelvis' in edit_bones:
        edit_bones['Bip001_Pelvis'].parent = None

    # Parent Spine1 directly to Pelvis (since Spine was merged into Spine1)
    if 'Bip001_Spine1' in edit_bones and 'Bip001_Pelvis' in edit_bones:
        edit_bones['Bip001_Spine1'].parent = edit_bones['Bip001_Pelvis']

    # Parent breast bones attached to Bip001_Spine3 (which will become mixamorig:Spine2)
    if 'Bn_Shape_Chest_L' in edit_bones and 'Bip001_Spine3' in edit_bones:
        edit_bones['Bn_Shape_Chest_L'].parent = edit_bones['Bip001_Spine3']
    if 'Bn_Shape_Chest_R' in edit_bones and 'Bip001_Spine3' in edit_bones:
        edit_bones['Bn_Shape_Chest_R'].parent = edit_bones['Bip001_Spine3']
    if 'Bn_Shape_Chest_L_End' in edit_bones and 'Bn_Shape_Chest_L' in edit_bones:
        edit_bones['Bn_Shape_Chest_L_End'].parent = edit_bones['Bn_Shape_Chest_L']
        edit_bones['Bn_Shape_Chest_L'].tail = edit_bones['Bn_Shape_Chest_L_End'].head
        dir_l = (edit_bones['Bn_Shape_Chest_L_End'].head - edit_bones['Bn_Shape_Chest_L'].head).normalized()
        edit_bones['Bn_Shape_Chest_L_End'].tail = edit_bones['Bn_Shape_Chest_L_End'].head + dir_l * 3.0
    if 'Bn_Shape_Chest_R_End' in edit_bones and 'Bn_Shape_Chest_R' in edit_bones:
        edit_bones['Bn_Shape_Chest_R_End'].parent = edit_bones['Bn_Shape_Chest_R']
        edit_bones['Bn_Shape_Chest_R'].tail = edit_bones['Bn_Shape_Chest_R_End'].head
        dir_r = (edit_bones['Bn_Shape_Chest_R_End'].head - edit_bones['Bn_Shape_Chest_R'].head).normalized()
        edit_bones['Bn_Shape_Chest_R_End'].tail = edit_bones['Bn_Shape_Chest_R_End'].head + dir_r * 3.0

    # Rename breast bones in edit mode
    if 'Bn_Shape_Chest_L' in edit_bones:
        edit_bones['Bn_Shape_Chest_L'].name = 'breast_left'
    if 'Bn_Shape_Chest_R' in edit_bones:
        edit_bones['Bn_Shape_Chest_R'].name = 'breast_right'
    if 'Bn_Shape_Chest_L_End' in edit_bones:
        edit_bones['Bn_Shape_Chest_L_End'].name = 'breast_left_end'
    if 'Bn_Shape_Chest_R_End' in edit_bones:
        edit_bones['Bn_Shape_Chest_R_End'].name = 'breast_right_end'

    # Standard bone set to KEEP
    standard_bones = {
        'Bip001_Pelvis', 'Bip001_Spine1', 'Bip001_Spine2', 'Bip001_Spine3',
        'Bip001_Neck', 'Bip001_Head',
        'Bip001_L_Clavicle', 'Bip001_L_UpperArm', 'Bip001_L_Forearm', 'Bip001_L_Hand',
        'Bip001_L_Finger0', 'Bip001_L_Finger01', 'Bip001_L_Finger02',
        'Bip001_L_Finger1', 'Bip001_L_Finger11', 'Bip001_L_Finger12',
        'Bip001_L_Finger2', 'Bip001_L_Finger21', 'Bip001_L_Finger22',
        'Bip001_L_Finger3', 'Bip001_L_Finger31', 'Bip001_L_Finger32',
        'Bip001_L_Finger4', 'Bip001_L_Finger41', 'Bip001_L_Finger42',
        'Bip001_R_Clavicle', 'Bip001_R_UpperArm', 'Bip001_R_Forearm', 'Bip001_R_Hand',
        'Bip001_R_Finger0', 'Bip001_R_Finger01', 'Bip001_R_Finger02',
        'Bip001_R_Finger1', 'Bip001_R_Finger11', 'Bip001_R_Finger12',
        'Bip001_R_Finger2', 'Bip001_R_Finger21', 'Bip001_R_Finger22',
        'Bip001_R_Finger3', 'Bip001_R_Finger31', 'Bip001_R_Finger32',
        'Bip001_R_Finger4', 'Bip001_R_Finger41', 'Bip001_R_Finger42',
        'Bip001_L_Thigh', 'Bip001_L_Calf', 'Bip001_L_Foot', 'Bip001_L_Toe0',
        'Bip001_R_Thigh', 'Bip001_R_Calf', 'Bip001_R_Foot', 'Bip001_R_Toe0',
        'breast_left', 'breast_right', 'breast_left_end', 'breast_right_end'
    }

    bones_to_remove = [b.name for b in edit_bones if b.name not in standard_bones]
    for bname in bones_to_remove:
        if bname in edit_bones:
            edit_bones.remove(edit_bones[bname])

    print(f"Kept {len(edit_bones)} bones. Removed {len(bones_to_remove)} secondary bones.")
    bpy.ops.object.mode_set(mode='OBJECT')

    # Also rename vertex groups on meshes for breast bones
    for m in meshes:
        vg_l = m.vertex_groups.get('Bn_Shape_Chest_L')
        if vg_l:
            vg_l.name = 'breast_left'
        vg_r = m.vertex_groups.get('Bn_Shape_Chest_R')
        if vg_r:
            vg_r.name = 'breast_right'

    # 6. Map bone names to standard Mixamo nomenclature
    print("=== 6. Mapping Bones to Mixamo Standard ===")
    mixamo_map = {
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
    }

    for old_name, new_name in mixamo_map.items():
        b = arm.data.bones.get(old_name)
        if b:
            b.name = new_name

    for m in meshes:
        for old_name, new_name in mixamo_map.items():
            vg = m.vertex_groups.get(old_name)
            if vg:
                vg.name = new_name

    # 7. Height Calibration & Grounding
    print("=== 7. Height Calibration & Grounding ===")
    bpy.context.view_layer.update()
    min_z = 9999.0
    max_z = -9999.0
    for m in meshes:
        for v in m.bound_box:
            world_v = m.matrix_world @ Vector(v)
            if world_v.z < min_z: min_z = world_v.z
            if world_v.z > max_z: max_z = world_v.z

    current_height = max_z - min_z
    print(f"Current mesh height: {current_height:.3f} cm (min_z: {min_z:.3f}, max_z: {max_z:.3f})")

    # If min_z is not zero, offset to ground feet at Z = 0
    if abs(min_z) > 0.01:
        offset_z = -min_z
        for o in bpy.context.scene.objects:
            if not o.parent:
                o.location.z += offset_z
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
        print(f"Applied grounding offset Z: {offset_z:.3f}")

    # Center character horizontally on X/Y relative to Hips
    hips_bone = arm.data.bones.get('mixamorig:Hips')
    if hips_bone:
        hips_w = arm.matrix_world @ hips_bone.head_local
        offset_xy = Vector((-hips_w.x, -hips_w.y, 0))
        if offset_xy.length > 0.01:
            for o in bpy.context.scene.objects:
                if not o.parent:
                    o.location += offset_xy
            bpy.ops.object.select_all(action='SELECT')
            bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
            print(f"Applied centering offset: ({offset_xy.x:.3f}, {offset_xy.y:.3f})")

    # 8. Save .blend
    print(f"=== 8. Saving .blend to {out_blend} ===")
    os.makedirs(os.path.dirname(out_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)

    # 9. Export GLB
    print(f"=== 9. Exporting GLB to {out_glb} ===")
    os.makedirs(os.path.dirname(out_glb), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format='GLB',
        export_animations=False,
        export_skins=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False
    )
    print(f"GLB exported successfully: {out_glb} ({os.path.getsize(out_glb)} bytes)")

    bone_count = len(arm.data.bones)

    # 10. Render 3D Preview
    render_preview(out_glb, out_preview)

    print("\n==========================================")
    print(f"Valby successfully converted!")
    print(f"Height: {current_height:.1f} cm")
    print(f"Bones count: {bone_count}")
    print(f"GLB: {out_glb}")
    print(f"Preview: {out_preview}")
    print("==========================================")

if __name__ == '__main__':
    convert_valby()
