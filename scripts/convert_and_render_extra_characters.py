import bpy
import os
import re
import math
import mathutils

CHARACTERS_TO_CONVERT = [
    {
        "id": "alex",
        "fbx": "Alex.fbx",
        "name": "Alex",
        "scale_mult": 1.0,
    },
    {
        "id": "david",
        "fbx": "David.fbx",
        "name": "David",
        "scale_mult": 1.0,
    },
    {
        "id": "mannequin",
        "fbx": "Mannequin.fbx",
        "name": "Mannequin",
        "scale_mult": 1.0,
    },
    {
        "id": "michelle",
        "fbx": "Michelle.fbx",
        "name": "Michelle",
        "scale_mult": 1.0,
    },
    {
        "id": "lola",
        "fbx": "Lola B Styperek.fbx",
        "name": "Lola",
        "scale_mult": 1.0,
    },
    {
        "id": "jennifer",
        "fbx": "Jennifer.fbx",
        "name": "Jennifer",
        "scale_mult": 1.0,
    },
    {
        "id": "arissa",
        "fbx": "Arissa.fbx",
        "name": "Arissa",
        "scale_mult": 1.0,
    },
    {
        "id": "astra",
        "fbx": "Astra.fbx",
        "name": "Astra",
        "scale_mult": 1.0,
    },
    {
        "id": "dummy",
        "fbx": "Dummy.fbx",
        "name": "Dummy",
        "scale_mult": 1.0,
    },
    {
        "id": "jody",
        "fbx": "Jody.fbx",
        "name": "Jody",
        "scale_mult": 1.0,
    },
    {
        "id": "kachujin",
        "fbx": "Kachujin G Rosales.fbx",
        "name": "Kachujin",
        "scale_mult": 1.0,
    },
    {
        "id": "medea",
        "fbx": "Medea By M. Arrebola.fbx",
        "name": "Medea",
        "scale_mult": 10.0, # Medea is 0.17m in FBX
    },
    {
        "id": "megan",
        "fbx": "Megan.fbx",
        "name": "Megan",
        "scale_mult": 1.0,
    },
    {
        "id": "olivia",
        "fbx": "Olivia.fbx",
        "name": "Olivia",
        "scale_mult": 1.0,
    },
    {
        "id": "sophie",
        "fbx": "Sophie.fbx",
        "name": "Sophie",
        "scale_mult": 1.0,
    },
]

BASE_FBX_DIR = "/home/dinatih/Projects/room-3d/sources_backup/personnages"
PUBLIC_CHAR_DIR = "/home/dinatih/Projects/room-3d/public/characters"

def process_character(char_info):
    char_id = char_info["id"]
    fbx_file = char_info["fbx"]
    scale_mult = char_info.get("scale_mult", 1.0)
    
    fbx_path = os.path.join(BASE_FBX_DIR, fbx_file)
    out_dir = os.path.join(PUBLIC_CHAR_DIR, char_id)
    out_glb = os.path.join(out_dir, f"{char_id}.glb")
    out_png = os.path.join(out_dir, f"{char_id}_3d_preview.png")
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"\n==========================================")
    print(f"Processing {char_id} from {fbx_file}...")
    print(f"==========================================")
    
    # 1. Reset scene & import FBX
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    armatures = [o for o in bpy.data.objects if o.type == "ARMATURE"]
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    
    if armatures:
        arm = armatures[0]
        bpy.context.view_layer.objects.active = arm
        bpy.ops.object.mode_set(mode="OBJECT")
        
        # Normalize bone names: replace mixamorig\d*: with mixamorig:
        for b in arm.data.bones:
            m = re.match(r"^mixamorig\d*:(.+)$", b.name)
            if m:
                b.name = f"mixamorig:{m.group(1)}"
        
        # Normalize vertex group names on meshes
        for m in meshes:
            for vg in m.vertex_groups:
                match = re.match(r"^mixamorig\d*:(.+)$", vg.name)
                if match:
                    vg.name = f"mixamorig:{match.group(1)}"
    
    # Apply scale multiplier if needed (e.g. Medea)
    if abs(scale_mult - 1.0) > 0.001:
        for o in bpy.data.objects:
            if o.parent is None:
                o.scale *= scale_mult
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    else:
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    
    # Ground at Z=0
    bbox_corners = [m.matrix_world @ mathutils.Vector(c) for m in meshes for c in m.bound_box] if meshes else []
    min_z = min(v.z for v in bbox_corners) if bbox_corners else 0
    max_z = max(v.z for v in bbox_corners) if bbox_corners else 0
    calculated_height = (max_z - min_z) * 100.0 # in cm
    print(f"[{char_id}] Calculated height: {calculated_height:.1f} cm (min_z: {min_z:.3f}, max_z: {max_z:.3f})")
    
    if abs(min_z) > 0.001:
        for o in bpy.data.objects:
            if o.parent is None:
                o.location.z -= min_z
        bpy.ops.object.select_all(action="SELECT")
        bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    
    # Clear animations so rest pose is exported
    for act in list(bpy.data.actions):
        bpy.data.actions.remove(act)
    for obj in bpy.data.objects:
        obj.animation_data_clear()
        
    # Export GLB
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format="GLB",
        export_animations=False,
        export_skins=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False
    )
    print(f"[{char_id}] Exported GLB: {out_glb} ({os.path.getsize(out_glb)} bytes)")
    
    # Render Preview PNG
    render_preview(out_glb, out_png)
    return calculated_height

def render_preview(glb_path, out_png):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"

    bpy.ops.import_scene.gltf(filepath=glb_path)
    meshes = [obj for obj in scene.objects if obj.type in ("MESH", "CURVE")]

    min_c = mathutils.Vector((float("inf"), float("inf"), float("inf")))
    max_c = mathutils.Vector((float("-inf"), float("-inf"), float("-inf")))

    for obj in meshes:
        for v in obj.bound_box:
            w_v = obj.matrix_world @ mathutils.Vector(v)
            for i in range(3):
                min_c[i] = min(min_c[i], w_v[i])
                max_c[i] = max(max_c[i], w_v[i])

    center = (min_c + max_c) / 2
    size = max_c - min_c
    max_dim = max(size.x, size.y, size.z)

    cam_data = bpy.data.cameras.new(name="Camera")
    cam_obj = bpy.data.objects.new(name="Camera", object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    dist = max(max_dim * 1.3, 0.1)
    cam_obj.location = center + mathutils.Vector((dist * 0.25, -dist * 1.1, dist * 0.1))
    direction = center - cam_obj.location
    rot_quat = direction.to_track_quat("-Z", "Y")
    cam_obj.rotation_euler = rot_quat.to_euler()

    light_data = bpy.data.lights.new(name="LightKey", type="SUN")
    light_data.energy = 3.5
    light_obj = bpy.data.objects.new(name="LightKey", object_data=light_data)
    scene.collection.objects.link(light_obj)
    light_obj.rotation_euler = (math.radians(45), math.radians(30), math.radians(45))

    light_data2 = bpy.data.lights.new(name="LightFill", type="SUN")
    light_data2.energy = 2.0
    light_obj2 = bpy.data.objects.new(name="LightFill", object_data=light_data2)
    scene.collection.objects.link(light_obj2)
    light_obj2.rotation_euler = (math.radians(-30), math.radians(-45), 0)

    scene.render.filepath = out_png
    bpy.ops.render.render(write_still=True)
    print(f"Rendered preview: {out_png} ({os.path.getsize(out_png)} bytes)")

if __name__ == "__main__":
    heights = {}
    for char in CHARACTERS_TO_CONVERT:
        h = process_character(char)
        heights[char["id"]] = round(h, 1)
    print("\n\nAll characters processed successfully!")
    print("Heights:", heights)
