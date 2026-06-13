import bpy
import os
import math
import re
from mathutils import Vector, Matrix

# ULTIMATE LARA PIPELINE V113 (THE FINAL UNDERSCORE)
# Goal: Use native Lara rig, Rename to Mixamo Underscore, Fix END bones.
# High compatibility with Three.js property binding.

SOURCE_FBX = "/home/dinatih/Projects/room-3d/scratch/lara_source_extracted/final_fbx/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
FINAL_GLB = "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb"

def log(m): print(f"[lara-fix] {m}", flush=True)

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # 1) Import Lara
    log("Importing Lara...")
    bpy.ops.import_scene.fbx(filepath=SOURCE_FBX)
    lara_arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    lara_meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    
    # 2) Sync Renaming (Native -> Mixamo Underscore)
    MAP = {
        "pelvis": "mixamorig_Hips", "spine lower": "mixamorig_Spine", "spine upper": "mixamorig_Spine2",
        "head neck lower": "mixamorig_Neck", "head neck upper": "mixamorig_Head", "head": "mixamorig_Head",
        "arm left shoulder 2": "mixamorig_LeftShoulder", "arm left elbow": "mixamorig_LeftArm", "arm left wrist": "mixamorig_LeftForeArm", 
        "arm left wrist 2": "mixamorig_LeftHand",
        "leg left thigh": "mixamorig_LeftUpLeg", "leg left knee": "mixamorig_LeftLeg", "leg left ankle": "mixamorig_LeftFoot",
        "arm right shoulder 2": "mixamorig_RightShoulder", "arm right elbow": "mixamorig_RightArm", "arm right wrist": "mixamorig_RightForeArm",
        "arm right wrist 2": "mixamorig_RightHand",
        "leg right thigh": "mixamorig_RightUpLeg", "leg right knee": "mixamorig_RightLeg", "leg right ankle": "mixamorig_RightFoot"
    }

    bpy.context.view_layer.objects.active = lara_arm
    bpy.ops.object.mode_set(mode='EDIT')
    
    bones_renamed = {}
    all_lara_bones = list(lara_arm.data.edit_bones)
    
    for eb in all_lara_bones:
        old_n = eb.name.lower()
        new_n = None
        if old_n in MAP: new_n = MAP[old_n]
        elif "wrist" in old_n: new_n = "mixamorig_LeftHand" if "left" in old_n else "mixamorig_RightHand"
        
        if new_n:
            bones_renamed[eb.name] = new_n
            eb.name = new_n
        else:
            # Standardize other bones to underscore
            eb.name = eb.name.replace(":", "_").replace(" ", "_")
            
    # Fix leaf bones (tails) for visual skeleton
    for b in lara_arm.data.edit_bones:
        if not b.children:
            end_n = f"{b.name}_End"
            if not lara_arm.data.edit_bones.get(end_n):
                eb_e = lara_arm.data.edit_bones.new(end_n); eb_e.parent = b; eb_e.head = b.tail
                dir = (b.tail - b.head).normalized() if b.length > 0.001 else Vector((0,0,1))
                eb_e.tail = b.tail + dir * 2.0
                
    bpy.ops.object.mode_set(mode='OBJECT')

    # 3) Vertex Group Sync
    for m in lara_meshes:
        for vg in m.vertex_groups:
            if vg.name in bones_renamed: vg.name = bones_renamed[vg.name]
            else:
                vg.name = vg.name.replace(":", "_").replace(" ", "_")
        
        # Rigging sync
        for mod in list(m.modifiers):
            if mod.type == 'ARMATURE': m.modifiers.remove(mod)
        mod = m.modifiers.new(name="Armature", type='ARMATURE'); mod.object = lara_arm

        # Rigid pins (Pistolets, Sac, Lunettes)
        n = m.name.lower()
        target = None
        if "gun" in n or "pistolet" in n: target = "mixamorig_RightHand" if "right" in n or "droit" in n else "mixamorig_LeftHand"
        elif "glass" in n or "lunette" in n: target = "mixamorig_Head"
        elif "bag" in n or "sac" in n: target = "mixamorig_Spine2"
        if target:
            for vg in list(m.vertex_groups): m.vertex_groups.remove(vg)
            vg = m.vertex_groups.new(name=target); vg.add(range(len(m.data.vertices)), 1.0, 'REPLACE')

    # 4) Scale and Ground (173.4 cm)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    bpy.context.view_layer.update()
    min_z = min((m.matrix_world @ Vector(c)).z for m in lara_meshes for c in m.bound_box)
    max_z = max((m.matrix_world @ Vector(c)).z for m in lara_meshes for c in m.bound_box)
    scale = 173.4 / (max_z - min_z)
    bpy.ops.transform.resize(value=(scale, scale, scale))
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    min_z = min((m.matrix_world @ Vector(c)).z for m in lara_meshes for c in m.bound_box)
    lara_arm.location.z -= min_z
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # 5) Export
    log(f"Exporting to {FINAL_GLB}")
    lara_arm.name = "lara_mixamo_armature"
    bpy.ops.export_scene.gltf(
        filepath=FINAL_GLB, export_format='GLB', export_apply=True,
        export_yup=True, export_animations=True,
        export_rest_position_armature=True, export_def_bones=True
    )
    log("SUCCESS")

if __name__ == "__main__":
    main()
