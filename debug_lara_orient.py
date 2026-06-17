import bpy
import os
from mathutils import Vector

SOURCE_FBX = "/tmp/lara_source/fbx_extracted/C1S1UIP9N1UQPLO2U787FMDUD.fbx"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=SOURCE_FBX)
    
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    for m in meshes:
        bb_min = Vector((999,999,999))
        bb_max = Vector((-999,-999,-999))
        for corner in m.bound_box:
            v = m.matrix_world @ Vector(corner)
            for i in range(3):
                bb_min[i] = min(bb_min[i], v[i])
                bb_max[i] = max(bb_max[i], v[i])
        print(f"Mesh {m.name} World BBox: {bb_min} to {bb_max}")
        print(f"Dimensions: {bb_max - bb_min}")

if __name__ == "__main__":
    main()
