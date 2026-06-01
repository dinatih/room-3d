"""Export Lara Mixamo with Ground Point Alignment.
Refined version: Clean translation and scale, no rotation.
"""
import bpy
from mathutils import Vector

INPUT_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/lara_mixamo.glb"
OUTPUT_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/lara_perfect.glb"

def log(msg):
    print(f"[perfect-ground] {msg}", flush=True)

def wipe():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def main():
    wipe()
    log(f"Importing: {INPUT_GLB}")
    bpy.ops.import_scene.gltf(filepath=INPUT_GLB)
    
    armature = next((o for o in bpy.context.scene.objects if o.type == 'ARMATURE'), None)
    if not armature:
        log("Error: No armature found")
        return

    # 1) Scale to cm (100x)
    # We select EVERYTHING and scale, then apply scale.
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.transform.resize(value=(100, 100, 100))
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    log("Applied 100x scale to everything.")

    # 2) Pivot calculation (Hips)
    # We want the horizontal center (X/Z) to be the Hips bone head.
    hips = armature.data.bones.get('mixamorig:Hips')
    if hips:
        # head_local is relative to armature origin in meters (before our scale? No, we applied scale).
        # Actually, let's get world position to be absolutely sure.
        bpy.context.view_layer.update()
        pivot_x = (armature.matrix_world @ hips.head_local).x
        pivot_z = (armature.matrix_world @ hips.head_local).z
    else:
        pivot_x = 0
        pivot_z = 0

    # 3) Ground calculation (Min Y)
    # Find global min Y of all meshes.
    min_y = 9999.0
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            for corner in o.bound_box:
                world_corner = o.matrix_world @ Vector(corner)
                if world_corner.y < min_y:
                    min_y = world_corner.y

    log(f"Calculated offsets: X={pivot_x:.4f}, Z={pivot_z:.4f}, Y={min_y:.4f}")

    # 4) Shift everything
    # We shift the objects in the scene so (pivot_x, min_y, pivot_z) moves to (0,0,0)
    offset = Vector((-pivot_x, -min_y, -pivot_z))
    for o in bpy.context.scene.objects:
        if not o.parent: # Only move roots
            o.location += offset
    
    # 5) Apply location to lock (0,0,0) as the new origin
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    log("Applied location to everything.")

    # 6) Export
    log(f"Exporting to: {OUTPUT_GLB}")
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_rest_position_armature=True,
    )
    log("Success.")

if __name__ == "__main__":
    main()
