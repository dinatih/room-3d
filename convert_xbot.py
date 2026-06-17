import bpy
import os
import math
import re
from mathutils import Vector

SOURCE_FBX = "/home/dinatih/Projects/room-3d/sources_backup/X Bot.fbx"
FINAL_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/x_bot.glb"

def log(m): print(f"[xbot-fix] {m}", flush=True)

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=SOURCE_FBX)
    
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    arm.name = "mixamo_armature"
    
    # 1) Scale to 180cm in Object Mode
    bpy.ops.object.select_all(action='DESELECT')
    arm.select_set(True)
    for c in arm.children: c.select_set(True)
    
    # Standard Mixamo FBX is in meters (1.8m). We want 180 units (cm).
    bpy.ops.transform.resize(value=(100, 100, 100))
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    # 2) Grounding
    bpy.context.view_layer.update()
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    min_z = min((o.matrix_world @ Vector(c)).z for o in meshes for c in o.bound_box)
    arm.location.z -= min_z
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # 3) Standardize Bone Names (UNDERSCORE)
    # This MUST match retargetMixamoClip output
    for b in arm.data.bones:
        new_name = b.name.replace("mixamorig:", "").replace("mixamorig_", "").replace(" ", "_")
        b.name = "mixamorig_" + new_name
    
    log(f"Exporting to {FINAL_GLB}...")
    bpy.ops.export_scene.gltf(
        filepath=FINAL_GLB,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_rest_position_armature=True,
        export_def_bones=True
    )
    log("SUCCESS")

if __name__ == "__main__":
    main()
