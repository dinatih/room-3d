import bpy, sys, os, math, mathutils

def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    return scene

def setup_camera_and_lights(scene, center, size, cam_factor=1.6, pitch=0.15, yaw=0.35):
    max_dim = max(size.x, size.y, size.z)
    if max_dim <= 0:
        max_dim = 1.0

    cam_data = bpy.data.cameras.new(name='Camera')
    cam_obj = bpy.data.objects.new(name='Camera', object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    dist = max_dim * cam_factor
    # Position camera in front at an angle
    cam_obj.location = center + mathutils.Vector((
        dist * math.sin(yaw) * math.cos(pitch),
        -dist * math.cos(yaw) * math.cos(pitch),
        dist * math.sin(pitch)
    ))
    direction = center - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    # Three-point studio lighting
    # Key light
    k_data = bpy.data.lights.new(name='KeyLight', type='SUN')
    k_data.energy = 3.5
    k_obj = bpy.data.objects.new(name='KeyLight', object_data=k_data)
    scene.collection.objects.link(k_obj)
    k_obj.rotation_euler = (math.radians(45), math.radians(25), math.radians(45))

    # Fill light
    f_data = bpy.data.lights.new(name='FillLight', type='SUN')
    f_data.energy = 2.0
    f_obj = bpy.data.objects.new(name='FillLight', object_data=f_data)
    scene.collection.objects.link(f_obj)
    f_obj.rotation_euler = (math.radians(30), math.radians(-40), math.radians(-30))

    # Rim light
    r_data = bpy.data.lights.new(name='RimLight', type='SUN')
    r_data.energy = 2.5
    r_obj = bpy.data.objects.new(name='RimLight', object_data=r_data)
    scene.collection.objects.link(r_obj)
    r_obj.rotation_euler = (math.radians(-60), math.radians(180), 0)

# 1. RENDER ROBIN BIRD PERFECTLY
def render_robin():
    print("=== Rendering Robin Bird ===")
    scene = setup_scene()
    glb_path = os.path.abspath('public/characters/robin/model.glb')
    bpy.ops.import_scene.gltf(filepath=glb_path)

    meshes = [o for o in scene.objects if o.type == 'MESH']
    min_c = mathutils.Vector((float('inf'), float('inf'), float('inf')))
    max_c = mathutils.Vector((float('-inf'), float('-inf'), float('-inf')))

    for obj in meshes:
        # Get actual vertex coordinates in world space
        for v in obj.data.vertices:
            w_v = obj.matrix_world @ v.co
            for i in range(3):
                min_c[i] = min(min_c[i], w_v[i])
                max_c[i] = max(max_c[i], w_v[i])

    center = (min_c + max_c) / 2
    size = max_c - min_c
    print(f"Robin Bounds: size={size}, center={center}")

    setup_camera_and_lights(scene, center, size, cam_factor=1.8, pitch=0.2, yaw=0.5)

    out_path = os.path.abspath('public/characters/robin/model_3d_preview.png')
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Robin: {out_path}")

# 2. RENDER LARA VARIANTS WITH CUSTOM TEXTURES & IDLE POSE
def render_lara_variants():
    print("=== Rendering Lara Variants ===")
    
    # Active variants mapping: charId -> { variant, textures, tint }
    VARIANTS = {
        'native': {
            'top': 'characters/lara/textures/8018.png', # classic
            'shorts': 'characters/lara/textures/8019.png',
            'hair': 'characters/lara/textures/8001.png',
            'face': 'characters/lara/textures/8000.png',
            'eyes': 'characters/lara/textures/8003.png',
        },
        'rosanna': {
            'top': 'characters/lara/textures/8018.png', # Bulls 66 / Rosanna
            'shorts': 'characters/lara/textures/8019.png',
            'hair': 'characters/lara/textures/8001.png',
            'face': 'characters/lara/textures/8000.png',
            'eyes': 'characters/lara/textures/8003.png',
        },
        'marissa': {
            'top': 'characters/lara/textures/8019.png', # dark top
            'shorts': 'characters/lara/textures/8019.png',
            'hair': 'characters/lara/textures/8001_marissa.png', # blond hair
            'face': 'characters/lara/textures/8000.png',
            'eyes': 'characters/lara/textures/8003.png',
        },
        'delphina': {
            'top': 'characters/lara/textures/8018.png',
            'shorts': 'characters/lara/textures/8031.png', # camo
            'hair': 'characters/lara/textures/8001.png',
            'face': 'characters/lara/textures/8000.png',
            'eyes': 'characters/lara/textures/8003_blue.png',
        },
        'cha': {
            'top': 'characters/lara/textures/8016_cha.png',
            'shorts': 'characters/lara/textures/8019_cha.png',
            'hair': 'characters/lara/textures/8001.png',
            'face': 'characters/lara/textures/8000.png',
            'eyes': 'characters/lara/textures/8003.png',
        },
        'vivida': {
            'top': 'characters/lara/textures/8018.png',
            'shorts': 'characters/lara/textures/8019.png',
            'hair': 'characters/lara/textures/8001.png',
            'face': 'characters/lara/textures/8000.png',
            'eyes': 'characters/lara/textures/8003_black.png',
        },
        'sabira': {
            'top': 'characters/lara/textures/8018.png',
            'shorts': 'characters/lara/textures/8019.png',
            'hair': 'characters/lara/textures/8001.png',
            'face': 'characters/lara/textures/8000.png',
            'eyes': 'characters/lara/textures/8003_green.png',
        },
        'sandra': {
            'top': 'characters/lara/textures/8018.png',
            'shorts': 'characters/lara/textures/8019.png',
            'hair': 'characters/lara/textures/8001.png',
            'face': 'characters/lara/textures/8000.png',
            'eyes': 'characters/lara/textures/8003_blue.png',
        },
        'rajaa': {
            'top': 'characters/lara/textures/8019_rajaa.png', # military top
            'shorts': 'characters/lara/textures/8031_rajaa.png', # camo pants
            'hair': 'characters/lara/textures/8001.png',
            'face': 'characters/lara/textures/8000.png',
            'eyes': 'characters/lara/textures/8003.png',
        }
    }

    out_dir = os.path.abspath('public/characters/lara/previews')
    os.makedirs(out_dir, exist_ok=True)

    for char_id, conf in VARIANTS.items():
        scene = setup_scene()
        glb_path = os.path.abspath('public/characters/lara/lara_native.glb')
        bpy.ops.import_scene.gltf(filepath=glb_path)

        # Apply idle animation/pose if available
        anim_path = os.path.abspath('public/animations/anim_female_standing_pose.glb')
        if os.path.exists(anim_path):
            try:
                # Import animation
                bpy.ops.import_scene.gltf(filepath=anim_path)
            except Exception as e:
                print(f"Anim import note: {e}")

        # Material swapping
        for mat in bpy.data.materials:
            m_name = mat.name.lower()
            if not mat.use_nodes:
                mat.use_nodes = True
            
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if not bsdf:
                continue

            tex_img = None
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE':
                    tex_img = node
                    break
            if not tex_img:
                tex_img = mat.node_tree.nodes.new('ShaderNodeTexImage')
                mat.node_tree.links.new(tex_img.outputs['Color'], bsdf.inputs['Base Color'])

            # Assign texture based on material/mesh
            target_tex_rel = None
            if 'shirt' in m_name or 'top' in m_name or 'mat_8018' in m_name or '8018' in m_name:
                target_tex_rel = conf.get('top')
            elif 'short' in m_name or 'pant' in m_name or 'mat_8019' in m_name or '8019' in m_name:
                target_tex_rel = conf.get('shorts')
            elif 'hair' in m_name or 'pony' in m_name or 'mat_8001' in m_name or '8001' in m_name:
                target_tex_rel = conf.get('hair')
            elif 'face' in m_name or 'head' in m_name or 'mat_8000' in m_name or '8000' in m_name:
                target_tex_rel = conf.get('face')
            elif 'eye' in m_name or 'mat_8003' in m_name or '8003' in m_name:
                target_tex_rel = conf.get('eyes')

            if target_tex_rel and os.path.exists(os.path.abspath(target_tex_rel)):
                img_path = os.path.abspath(target_tex_rel)
                img = bpy.data.images.load(img_path, check_existing=True)
                tex_img.image = img

        # Compute mesh bounds
        meshes = [o for o in scene.objects if o.type == 'MESH']
        min_c = mathutils.Vector((float('inf'), float('inf'), float('inf')))
        max_c = mathutils.Vector((float('-inf'), float('-inf'), float('-inf')))

        for obj in meshes:
            for v in obj.data.vertices:
                w_v = obj.matrix_world @ v.co
                for i in range(3):
                    min_c[i] = min(min_c[i], w_v[i])
                    max_c[i] = max(max_c[i], w_v[i])

        center = (min_c + max_c) / 2
        size = max_c - min_c
        # Adjust center slightly towards chest/face
        cam_center = center + mathutils.Vector((0, 0, size.z * 0.05))

        setup_camera_and_lights(scene, cam_center, size, cam_factor=1.35, pitch=0.08, yaw=0.25)

        out_path = os.path.join(out_dir, f"{char_id}_3d_preview.png")
        scene.render.filepath = out_path
        bpy.ops.render.render(write_still=True)
        print(f"Rendered {char_id}: {out_path}")

if __name__ == '__main__':
    render_robin()
    render_lara_variants()
