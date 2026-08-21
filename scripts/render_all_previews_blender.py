import bpy, sys, os, math, mathutils

def render_model(glb_rel_path, out_rel_path):
    glb_abs = os.path.abspath(os.path.join('public', glb_rel_path))
    out_abs = os.path.abspath(os.path.join('public', out_rel_path))

    if not os.path.exists(glb_abs):
        print(f"[Skip] File not found: {glb_abs}")
        return False

    os.makedirs(os.path.dirname(out_abs), exist_ok=True)

    # Reset scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'

    try:
        bpy.ops.import_scene.gltf(filepath=glb_abs)
    except Exception as e:
        print(f"[Error importing {glb_rel_path}]: {e}")
        return False

    meshes = [obj for obj in scene.objects if obj.type in ('MESH', 'CURVE')]
    if not meshes:
        print(f"[Warn] No meshes in {glb_rel_path}")
        return False

    min_c = mathutils.Vector((float('inf'), float('inf'), float('inf')))
    max_c = mathutils.Vector((float('-inf'), float('-inf'), float('-inf')))

    for obj in meshes:
        for v in obj.bound_box:
            w_v = obj.matrix_world @ mathutils.Vector(v)
            for i in range(3):
                min_c[i] = min(min_c[i], w_v[i])
                max_c[i] = max(max_c[i], w_v[i])

    center = (min_c + max_c) / 2
    size = max_c - min_c
    max_dim = max(size.x, size.y, size.z)
    if max_dim <= 0:
        max_dim = 1.0

    cam_data = bpy.data.cameras.new(name='Camera')
    cam_obj = bpy.data.objects.new(name='Camera', object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    dist = max(max_dim * 1.8, 0.1)
    cam_obj.location = center + mathutils.Vector((dist * 0.7, -dist * 0.9, dist * 0.6))
    direction = center - cam_obj.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    # Lighting
    light_data = bpy.data.lights.new(name='LightKey', type='SUN')
    light_data.energy = 3.5
    light_obj = bpy.data.objects.new(name='LightKey', object_data=light_data)
    scene.collection.objects.link(light_obj)
    light_obj.rotation_euler = (math.radians(45), math.radians(30), math.radians(45))

    light_data2 = bpy.data.lights.new(name='LightFill', type='SUN')
    light_data2.energy = 2.0
    light_obj2 = bpy.data.objects.new(name='LightFill', object_data=light_data2)
    scene.collection.objects.link(light_obj2)
    light_obj2.rotation_euler = (math.radians(-30), math.radians(-45), 0)

    scene.render.filepath = out_abs
    bpy.ops.render.render(write_still=True)
    print(f"Rendered: {out_rel_path}")
    return True

if __name__ == '__main__':
    # 1. Scan public/items for all GLBs
    print("=== Scanning public/items ===")
    for root, dirs, files in os.walk('public/items'):
        for f in files:
            if f.endswith('.glb'):
                full = os.path.join(root, f)
                rel = os.path.relpath(full, 'public')
                dir_name = os.path.dirname(rel)
                base_name = os.path.splitext(os.path.basename(rel))[0]
                out_png = f"{dir_name}/{base_name}_3d_preview.png"
                if not os.path.exists(os.path.join('public', out_png)):
                    render_model(rel, out_png)

    # 2. Characters
    print("=== Rendering Characters ===")
    render_model('characters/lara/lara_native.glb', 'characters/lara/lara_native_3d_preview.png')
    render_model('characters/xbot/Xbot_official.glb', 'characters/xbot/Xbot_official_3d_preview.png')
    render_model('characters/ushiro/shiba_inu_dog_ushiro.glb', 'characters/ushiro/shiba_inu_dog_ushiro_3d_preview.png')
    render_model('items/robin-bird/model.glb', 'items/robin-bird/model_3d_preview.png')
