import bpy, sys, os, math, mathutils

def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'

    world = bpy.data.worlds.new('World')
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1.0)
        bg.inputs['Strength'].default_value = 1.5
    scene.world = world
    return scene

def render_robin():
    print("=== Rendering Robin Bird ===")
    scene = setup_scene()
    glb_path = os.path.abspath('public/characters/robin/robin.glb')
    bpy.ops.import_scene.gltf(filepath=glb_path)

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
    max_dim = max(size.x, size.y, size.z)
    print(f"Robin Bounds: size={size}, center={center}, max_dim={max_dim}")

    cam_data = bpy.data.cameras.new(name='Camera')
    cam_obj = bpy.data.objects.new(name='Camera', object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    dist = max_dim * 1.5
    cam_obj.location = center + mathutils.Vector((dist * 0.7, -dist * 0.9, dist * 0.5))
    direction = center - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    # Lighting
    k_data = bpy.data.lights.new(name='KeyLight', type='SUN')
    k_data.energy = 4.0
    k_obj = bpy.data.objects.new(name='KeyLight', object_data=k_data)
    scene.collection.objects.link(k_obj)
    k_obj.rotation_euler = (math.radians(45), math.radians(25), math.radians(45))

    out_path = os.path.abspath('public/characters/robin/robin_3d_preview.png')
    scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    print(f"Rendered Robin: {out_path}")

def render_lara_variants():
    print("=== Rendering Lara Variants ===")
    
    VARIANTS = {
        'native': {
            'shirt': 'public/characters/lara/textures/8018.png',
            'shorts': 'public/characters/lara/textures/8019.png',
            'hair': 'public/characters/lara/textures/8001.png',
            'face': 'public/characters/lara/textures/8000.png',
            'eyes': 'public/characters/lara/textures/8003.png',
        },
        'rosanna': {
            'shirt': 'public/characters/lara/textures/8018.png',
            'shorts': 'public/characters/lara/textures/8019.png',
            'hair': 'public/characters/lara/textures/8001.png',
            'face': 'public/characters/lara/textures/8000.png',
            'eyes': 'public/characters/lara/textures/8003.png',
        },
        'marissa': {
            'shirt': 'public/characters/lara/textures/8019.png', # dark crop top
            'shorts': 'public/characters/lara/textures/8019.png',
            'hair': 'public/characters/lara/textures/8001_marissa.png', # blonde hair
            'face': 'public/characters/lara/textures/8000.png',
            'eyes': 'public/characters/lara/textures/8003.png',
        },
        'delphina': {
            'shirt': 'public/characters/lara/textures/8018.png',
            'shorts': 'public/characters/lara/textures/8031.png', # camo
            'hair': 'public/characters/lara/textures/8001.png',
            'face': 'public/characters/lara/textures/8000.png',
            'eyes': 'public/characters/lara/textures/8003_blue.png',
        },
        'cha': {
            'shirt': 'public/characters/lara/textures/8016_cha.png',
            'shorts': 'public/characters/lara/textures/8019_cha.png',
            'hair': 'public/characters/lara/textures/8001.png',
            'face': 'public/characters/lara/textures/8000.png',
            'eyes': 'public/characters/lara/textures/8003.png',
        },
        'vivida': {
            'shirt': 'public/characters/lara/textures/8018.png',
            'shorts': 'public/characters/lara/textures/8019.png',
            'hair': 'public/characters/lara/textures/8001.png',
            'face': 'public/characters/lara/textures/8000.png',
            'eyes': 'public/characters/lara/textures/8003_black.png',
        },
        'sabira': {
            'shirt': 'public/characters/lara/textures/8018.png',
            'shorts': 'public/characters/lara/textures/8019.png',
            'hair': 'public/characters/lara/textures/8001.png',
            'face': 'public/characters/lara/textures/8000.png',
            'eyes': 'public/characters/lara/textures/8003_green.png',
        },
        'sandra': {
            'shirt': 'public/characters/lara/textures/8018.png',
            'shorts': 'public/characters/lara/textures/8019.png',
            'hair': 'public/characters/lara/textures/8001.png',
            'face': 'public/characters/lara/textures/8000.png',
            'eyes': 'public/characters/lara/textures/8003_blue.png',
        },
        'rajaa': {
            'shirt': 'public/characters/lara/textures/8019_rajaa.png', # military top
            'shorts': 'public/characters/lara/textures/8031_rajaa.png', # military camo
            'hair': 'public/characters/lara/textures/8001.png',
            'face': 'public/characters/lara/textures/8000.png',
            'eyes': 'public/characters/lara/textures/8003.png',
        }
    }

    out_dir = os.path.abspath('public/characters/lara/previews')
    os.makedirs(out_dir, exist_ok=True)

    for char_id, conf in VARIANTS.items():
        scene = setup_scene()
        glb_path = os.path.abspath('public/characters/lara/lara_native.glb')
        bpy.ops.import_scene.gltf(filepath=glb_path)

        for o in scene.objects:
            if 'icosphere' in o.name.lower():
                o.hide_render = True

        # Pose arms down from T-pose in Pose Mode
        arm = [o for o in scene.objects if o.type == 'ARMATURE'][0]
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode='POSE')

        if 'arm_left_shoulder_2' in arm.pose.bones:
            b = arm.pose.bones['arm_left_shoulder_2']
            b.rotation_mode = 'XYZ'
            b.rotation_euler = (0, math.radians(-70), 0)

        if 'arm_right_shoulder_2' in arm.pose.bones:
            b = arm.pose.bones['arm_right_shoulder_2']
            b.rotation_mode = 'XYZ'
            b.rotation_euler = (0, math.radians(70), 0)

        bpy.ops.object.mode_set(mode='OBJECT')

        def set_mesh_tex(mesh_name, tex_rel):
            obj = scene.objects.get(mesh_name)
            if not obj or not obj.data.materials:
                return
            mat = obj.data.materials[0]
            if not mat.use_nodes:
                mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get('Principled BSDF')
            if bsdf:
                bsdf.inputs['Roughness'].default_value = 0.6
                bsdf.inputs['Specular IOR Level'].default_value = 0.2
                tex_node = None
                for n in mat.node_tree.nodes:
                    if n.type == 'TEX_IMAGE':
                        tex_node = n
                        break
                if not tex_node:
                    tex_node = mat.node_tree.nodes.new('ShaderNodeTexImage')
                    mat.node_tree.links.new(tex_node.outputs['Color'], bsdf.inputs['Base Color'])
                tex_abs = os.path.abspath(tex_rel)
                if os.path.exists(tex_abs):
                    tex_node.image = bpy.data.images.load(tex_abs, check_existing=True)

        set_mesh_tex('shirt', conf['shirt'])
        set_mesh_tex('shorts', conf['shorts'])
        set_mesh_tex('hair_classic', conf['hair'])
        set_mesh_tex('hair_base', conf['hair'])
        set_mesh_tex('braid', conf['hair'])
        set_mesh_tex('face', conf['face'])
        set_mesh_tex('body', conf['face'])
        set_mesh_tex('arms', conf['face'])
        set_mesh_tex('fingers', conf['face'])
        set_mesh_tex('eyes', conf['eyes'])

        meshes = [o for o in scene.objects if o.type == 'MESH' and not o.hide_render]
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

        cam_data = bpy.data.cameras.new(name='Camera')
        cam_obj = bpy.data.objects.new(name='Camera', object_data=cam_data)
        scene.collection.objects.link(cam_obj)
        scene.camera = cam_obj

        # Position camera nicely framed from head to toe
        cam_target = mathutils.Vector((center.x, center.y, center.z + 0.05))
        dist = 2.4
        cam_obj.location = cam_target + mathutils.Vector((0.4, -dist, 0.2))
        direction = cam_target - cam_obj.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        cam_obj.rotation_euler = rot_quat.to_euler()

        # Three point lighting
        k_data = bpy.data.lights.new(name='Sun', type='SUN')
        k_data.energy = 3.5
        k_obj = bpy.data.objects.new(name='Sun', object_data=k_data)
        scene.collection.objects.link(k_obj)
        k_obj.rotation_euler = (math.radians(50), math.radians(20), math.radians(30))

        f_data = bpy.data.lights.new(name='Fill', type='SUN')
        f_data.energy = 2.0
        f_obj = bpy.data.objects.new(name='Fill', object_data=f_data)
        scene.collection.objects.link(f_obj)
        f_obj.rotation_euler = (math.radians(-30), math.radians(-40), 0)

        out_path = os.path.join(out_dir, f"{char_id}_3d_preview.png")
        scene.render.filepath = out_path
        bpy.ops.render.render(write_still=True)
        print(f"Rendered {char_id}: {out_path}")

if __name__ == '__main__':
    render_robin()
    render_lara_variants()
