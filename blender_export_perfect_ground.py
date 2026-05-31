"""Export Lara Mixamo with Perfect Ground Point Alignment.

Takes the Lara Mixamo model, surgically aligns the Hips bone horizontally (X/Z) 
above the origin, sits the lowest point of the mesh on the ground (Y=0), 
and exports a production-ready GLB.
"""
import math
import sys
import bpy
from mathutils import Matrix, Vector

# Paths
INPUT_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/lara_mixamo.glb"
OUTPUT_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/lara_perfect.glb"

def log(msg):
    print(f"[perfect-ground] {msg}", flush=True)

def wipe():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

def import_glb(path: str):
    pre = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.context.scene.objects if o not in pre]

def main():
    wipe()
    
    log(f"Importing: {INPUT_GLB}")
    objs = import_glb(INPUT_GLB)
    
    armature = next((o for o in objs if o.type == 'ARMATURE'), None)
    if not armature:
        log("Error: No armature found")
        return

    # 1.5) Scale to cm (Mixamo meters to project cm)
    armature.scale = Vector((100, 100, 100))
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    log("Scaled model 100x to project units (cm).")

    # 1) Find Hips bone to determine horizontal offset
    # In Lara Mixamo, it's 'mixamorig:Hips'
    hips = armature.data.bones.get('mixamorig:Hips')
    if not hips:
        log("Warning: 'mixamorig:Hips' not found, falling back to bounding box center")
        # Calc geometric center of all meshes
        meshes = [o for o in objs if o.type == 'MESH']
        center = Vector((0,0,0))
        for m in meshes:
            center += 0.125 * sum((Vector(b) for b in m.bound_box), Vector())
        center /= len(meshes)
        offset_x = center.x
        offset_z = center.z
    else:
        # We want the head of the hips bone to be at (0,0) horizontally
        hips_world_head = armature.matrix_world @ hips.head_local
        offset_x = hips_world_head.x
        offset_z = hips_world_head.z

    log(f"Detected horizontal offset: X={offset_x:.4f}, Z={offset_z:.4f}")

    # 2) Sit on ground (Y=0)
    # Find global min Y across all meshes
    min_y = 9999.0
    meshes = [o for o in objs if o.type == 'MESH']
    for m in meshes:
        for corner in m.bound_box:
            world_corner = m.matrix_world @ Vector(corner)
            if world_corner.y < min_y:
                min_y = world_corner.y
    
    log(f"Detected ground offset: Y={min_y:.4f}")

    # 3) Apply global correction to everything
    # We move everything so that:
    # NewX = OldX - offset_x
    # NewZ = OldZ - offset_z
    # NewY = OldY - min_y
    
    correction = Vector((-offset_x, -min_y, -offset_z))
    
    # We apply this to the armature object specifically if it's the root
    # But usually, it's safer to just shift the armature and the meshes follow if parented
    armature.location += correction
    
    # Check for unparented meshes (rare but possible)
    for o in objs:
        if o.type == 'MESH' and o.parent != armature:
             o.location += correction

    # 4) Final Freeze / Apply Transforms
    # We want the origin of the exported GLB to be exactly (0,0,0)
    # where (0,0,0) is Ground Point between feet.
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    log("Transforms applied. Model is now Ground-Point centered at (0,0,0).")

    # 5) Export
    log(f"Exporting to: {OUTPUT_GLB}")
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=True, # Keep animations for testing
        export_yup=True,
        export_def_bones=False,
        export_rest_position_armature=True,
    )
    log("Success.")

if __name__ == "__main__":
    main()
