import bpy
import os
import math
from mathutils import Vector

# EXPORT PIPELINE V3 FOR SANDBOX (THE REAL SOURCES)

OUT_DIR = "/home/dinatih/Projects/room-3d/public/media/sandbox"
os.makedirs(OUT_DIR, exist_ok=True)

def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def export_character(fbx_path, name, height_cm):
    clean_scene()
    print(f"--- Exporting Character: {name} ---")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    arm.name = "Armature"
    
    # Standing on Z
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    bpy.context.view_layer.update()
    z_min = min((m.matrix_world @ Vector(c)).z for m in meshes for c in m.bound_box)
    z_max = max((m.matrix_world @ Vector(c)).z for m in meshes for c in m.bound_box)
    scale = height_cm / (z_max - z_min)
    
    bpy.ops.transform.resize(value=(scale, scale, scale))
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    z_min = min((o.matrix_world @ Vector(c)).z for o in bpy.data.objects if o.type == 'MESH' for c in o.bound_box)
    arm.location.z -= z_min
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    for b in arm.data.bones:
        b.name = "mixamorig_" + b.name.replace("mixamorig:", "").replace("mixamorig_", "").replace(" ", "_")
        
    out_path = os.path.join(OUT_DIR, f"{name}.glb")
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', export_apply=True, export_yup=True, export_rest_position_armature=True)

def export_animation(fbx_path, name):
    clean_scene()
    print(f"--- Exporting Animation: {name} ---")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    
    # Fix names for consistency
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    for b in arm.data.bones:
        b.name = "mixamorig_" + b.name.replace("mixamorig:", "").replace("mixamorig_", "").replace(" ", "_")
        
    out_path = os.path.join(OUT_DIR, f"anim_{name}.glb")
    # MUST export_yup=True so the animation vertical axis matches the Y-up models
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', export_animations=True, export_yup=True)

# --- MAIN ---
export_character("/home/dinatih/Projects/room-3d/sources_backup/X Bot.fbx", "x_bot", 180)
export_character("/home/dinatih/Projects/room-3d/sources_backup/Y Bot.fbx", "y_bot", 170)

# True Sources
ANIM_SRC = "/home/dinatih/Projects/room-3d/sources_backup/animations"
for f in os.listdir(ANIM_SRC):
    if f.endswith(".fbx"):
        name = f.replace(".fbx", "").replace(" ", "_").replace(",", "").replace("-", "_").lower()
        export_animation(os.path.join(ANIM_SRC, f), name)
