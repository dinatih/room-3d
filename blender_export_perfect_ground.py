"""Export Lara Mixamo with Ground Point Alignment.
Simple version: Move the armature and export without applying complex transforms that break rigs.
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

    # 1) Scale 100x (Mixamo meters to cm)
    # Instead of applying scale (which can break bone lengths in some Blender versions), 
    # we just set the object scale. The GLTF exporter will handle it.
    armature.scale = Vector((100, 100, 100))
    
    # 2) Calculate Pivot (Hips)
    # We want the horizontal center to be the Hips
    hips = armature.data.bones.get('mixamorig:Hips')
    if hips:
        # head_local is relative to armature origin (0,0,0)
        # Since armature is at 0,0,0 and scale 100, hips world pos is head_local * 100
        pivot_x = hips.head_local.x * 100
        pivot_z = hips.head_local.z * 100
    else:
        pivot_x = 0
        pivot_z = 0

    # 3) Calculate Ground (Min Y)
    # Find min Y of all meshes after scaling
    min_y = 9999.0
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            # world_matrix includes the 100x scale
            for corner in o.bound_box:
                world_corner = o.matrix_world @ Vector(corner)
                if world_corner.y < min_y:
                    min_y = world_corner.y

    log(f"Pivot: {pivot_x}, {pivot_z} | Ground: {min_y}")

    # 4) Shift everything
    # We move the armature object so that the desired pivot point ends up at (0,0,0)
    armature.location.x -= pivot_x
    armature.location.z -= pivot_z
    armature.location.y -= min_y

    # 5) Export
    # IMPORTANT: We do NOT apply transforms (transform_apply) as it often breaks skinning weights
    # if the meshes and armature are not handled perfectly.
    # The GLTF exporter with 'export_apply=True' (default for some settings) will bake the object transforms.
    log(f"Exporting to: {OUTPUT_GLB}")
    bpy.ops.export_scene.gltf(
        filepath=OUTPUT_GLB,
        export_format="GLB",
        use_selection=False, # Export everything
        export_apply=True,
        export_yup=True,
        export_animations=True,
        export_rest_position_armature=True,
    )
    log("Success.")

if __name__ == "__main__":
    main()
