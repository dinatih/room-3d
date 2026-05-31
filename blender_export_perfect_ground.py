"""Export Lara Mixamo with Perfect Ground Point Alignment.

Surgically aligns model horizontally (X/Z) above origin and sits it on ground (Y=0).
Scales 100x for project cm units.
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

    # 1) Scale to cm (Mixamo meters to project cm)
    # We apply scale but AVOID applying rotation to prevent bone corruption
    select_only(armature)
    armature.scale = Vector((100, 100, 100))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    log("Scaled model 100x to project units (cm).")

    # 2) Find horizontal pivot (Hips)
    hips = armature.data.bones.get('mixamorig:Hips')
    offset_x = 0.0
    offset_z = 0.0
    if hips:
        # Get world position of hips head
        # We need to account for armature's world matrix
        world_matrix = armature.matrix_world
        hips_world_head = world_matrix @ hips.head_local
        offset_x = hips_world_head.x
        offset_z = hips_world_head.z
    else:
        # Fallback to bbox center
        meshes = [o for o in objs if o.type == 'MESH']
        center = Vector((0,0,0))
        for m in meshes:
            center += 0.125 * sum((Vector(b) for b in m.bound_box), Vector())
        center /= len(meshes)
        offset_x = center.x
        offset_z = center.z

    # 3) Find vertical base (lowest point)
    min_y = 9999.0
    meshes = [o for o in objs if o.type == 'MESH']
    for m in meshes:
        # Update mesh world matrix just in case
        m.update_tag()
        world_matrix = m.matrix_world
        for corner in m.bound_box:
            world_corner = world_matrix @ Vector(corner)
            if world_corner.y < min_y:
                min_y = world_corner.y

    log(f"Detected offsets: X={offset_x:.4f}, Y={min_y:.4f}, Z={offset_z:.4f}")

    # 4) Apply Translation
    # We shift the armature root. Meshes follow if parented.
    # New horizontal origin will be exactly under the Hips.
    # New vertical origin will be at the floor.
    correction = Vector((-offset_x, -min_y, -offset_z))
    armature.location += correction
    
    # Also move any unparented meshes
    for o in objs:
        if o.type == 'MESH' and o.parent != armature:
             o.location += correction

    # 5) Apply Location (Fix current location as the new (0,0,0))
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    
    log("Transforms applied. Model is now Ground-Point centered.")

    # 6) Export
    log(f"Exporting to: {OUTPUT_GLB}")
    # Force Y-UP to ensure it matches Three.js standard
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=True,
        export_yup=True,
        export_def_bones=False,
        export_rest_position_armature=True,
    )
    log("Success.")

if __name__ == "__main__":
    main()
