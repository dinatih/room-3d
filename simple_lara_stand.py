import bpy
import os
import math

SOURCE_FBX = "/tmp/lara_source/fbx_extracted/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
FINAL_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/lara_perfect.glb"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=SOURCE_FBX)
    
    # Stand her up in Blender (Rotate 90 on X)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.transform.rotate(value=math.radians(90), orient_axis='X')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    # Scale to 173.4 units (cm)
    lara_mesh = max([o for o in bpy.data.objects if o.type == 'MESH'], key=lambda o: len(o.data.vertices))
    bb = [lara_mesh.matrix_world @ Vector(c) for c in lara_mesh.bound_box]
    min_z = min(v.z for v in bb); max_z = max(v.z for v in bb)
    scale = 173.4 / (max_z - min_z)
    bpy.ops.transform.resize(value=(scale, scale, scale))
    
    # Ground her (Min Z -> 0)
    bpy.context.view_layer.update()
    min_z = min((o.matrix_world @ Vector(c)).z for o in bpy.data.objects if o.type == 'MESH' for c in o.bound_box)
    for o in bpy.data.objects:
        if not o.parent: o.location.z -= min_z
        
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    # Export
    bpy.ops.export_scene.gltf(
        filepath=FINAL_GLB,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )

from mathutils import Vector
if __name__ == "__main__":
    main()
