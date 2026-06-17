import bpy
import os
import math
import re
from mathutils import Vector, Matrix

# ULTIMATE LARA PIPELINE V52 (ABSOLUTE RESTORATION)

SOURCE_FBX = "/tmp/lara_source/fbx_extracted/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
YBOT_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/y_bot_from_mixamo.glb"
FINAL_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/lara_perfect.glb"

def log(m): print(f"[lara-fix] {m}", flush=True)

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # 1) Import Lara
    log("Importing Lara...")
    bpy.ops.import_scene.fbx(filepath=SOURCE_FBX)
    lara_arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    lara_mesh = max([o for o in bpy.data.objects if o.type == 'MESH'], key=lambda o: len(o.data.vertices))
    lara_mesh.name = "BODY_LARA"
    lara_arm.name = "ARM_LARA"
    
    # Orientation
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.transform.rotate(value=-math.pi/2, orient_axis='X')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    # Measure
    bpy.context.view_layer.update()
    min_y = min(v.co.y for v in lara_mesh.data.vertices)
    max_y = max(v.co.y for v in lara_mesh.data.vertices)
    curr_h = max_y - min_y
    scale = 173.4 / curr_h
    log(f"Height {curr_h:.4f}m. Multiplier {scale:.4f}")

    # 4) Import Y-Bot
    log("Importing Y-Bot Armature...")
    bpy.ops.import_scene.gltf(filepath=YBOT_GLB)
    ybot_arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE' and o.name != "ARM_LARA")
    
    # Purge Y-Bot meshes
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and o.name != "BODY_LARA":
            bpy.data.objects.remove(o, do_unlink=True)

    # Retarget
    bpy.context.view_layer.objects.active = ybot_arm
    bpy.ops.object.mode_set(mode='EDIT')
    for eb in ybot_arm.data.edit_bones: eb.name = re.sub(r'_\d+$', '', eb.name)
    MAP = {"pelvis":"mixamorig:Hips","spine lower":"mixamorig:Spine","spine upper":"mixamorig:Spine2","head neck lower":"mixamorig:Neck","head neck upper":"mixamorig:Head","arm left shoulder 2":"mixamorig:LeftArm","arm left elbow":"mixamorig:LeftForeArm","arm left wrist":"mixamorig:LeftHand","leg left thigh":"mixamorig:LeftUpLeg","leg left knee":"mixamorig:LeftLeg","leg left ankle":"mixamorig:LeftFoot","arm right shoulder 2":"mixamorig:RightArm","arm right elbow":"mixamorig:RightForeArm","arm right wrist":"mixamorig:RightHand","leg right thigh":"mixamorig:RightUpLeg","leg right knee":"mixamorig:RightLeg","leg right ankle":"mixamorig:RightFoot"}
    for lp, mn in MAP.items():
        lb = lara_arm.data.bones.get(lp)
        mb = ybot_arm.data.edit_bones.get(mn)
        if lb and mb:
            mb.head = lara_arm.matrix_world @ lb.head_local
            mb.tail = lara_arm.matrix_world @ lb.tail_local
    bpy.ops.object.mode_set(mode='OBJECT')

    # Link Mesh
    lara_mesh.parent = ybot_arm
    lara_mesh.matrix_parent_inverse = ybot_arm.matrix_world.inverted()
    for mod in list(lara_mesh.modifiers):
        if mod.type == 'ARMATURE': lara_mesh.modifiers.remove(mod)
    mod = lara_mesh.modifiers.new(name="Armature", type='ARMATURE'); mod.object = ybot_arm
    for vg in lara_mesh.vertex_groups:
        for lp, mn in MAP.items():
            if vg.name.startswith(lp): vg.name = mn; break
            
    bpy.data.objects.remove(lara_arm, do_unlink=True)
    ybot_arm.name = "lara_mixamo_armature"

    # HARD BAKE
    bpy.context.view_layer.update()
    min_y_m = min(v.co.y for v in lara_mesh.data.vertices)
    hips = ybot_arm.data.bones['mixamorig:Hips']
    px = hips.head_local.x; pz = hips.head_local.z
    
    # Combined scale and shift
    shift_cm = Vector((-px * scale, -min_y_m * scale, -pz * scale))
    
    # APPLY TO BONES
    bpy.context.view_layer.objects.active = ybot_arm
    bpy.ops.object.mode_set(mode='EDIT')
    for eb in ybot_arm.data.edit_bones:
        eb.head *= scale; eb.tail *= scale
        eb.head += shift_cm; eb.tail += shift_cm
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # APPLY TO MESH DATA
    M = Matrix.Translation(shift_cm) @ Matrix.Scale(scale, 4)
    lara_mesh.data.transform(M)
    
    # Reset object positions
    ybot_arm.matrix_world = Matrix.Identity(4)
    lara_mesh.matrix_world = Matrix.Identity(4)

    # 7) Export
    log(f"Exporting to {FINAL_GLB}")
    bpy.ops.export_scene.gltf(
        filepath=FINAL_GLB,
        export_format='GLB',
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_rest_position_armature=True
    )
    log("SUCCESS")

if __name__ == "__main__":
    main()
