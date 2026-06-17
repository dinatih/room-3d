import bpy
import os

SOURCE_FBX = "/tmp/lara_source/fbx_extracted/C1S1UIP9N1UQPLO2U787FMDUD.fbx"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=SOURCE_FBX)
    for o in bpy.data.objects:
        if o.type == 'MESH':
            print(f"MESH: {o.name} | Verts: {len(o.data.vertices)}")
            if len(o.data.vertices) > 0:
                print(f"  First vert: {o.data.vertices[0].co}")

if __name__ == "__main__":
    main()
