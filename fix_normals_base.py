import bpy
import sys

SRC = "/tmp/lara_source/lara_base.glb"
DST = "/tmp/lara_source/lara_norm.glb"

# Node name for Face mesh (Object_107 in previous GLB, here likely part of a combined mesh or named differently)
# Looking at Blender logs: "5_+Head|Glasses_1.0_0_0" seems to be a root or a combined mesh.
# The previous script used "Object_107".
# Let's find the mesh that contains face-related materials.

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=SRC)

    target = None
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and ("Face" in obj.name or "Head" in obj.name):
            target = obj
            print(f"Found target: {target.name}")
            # Recalculate normals
            bpy.ops.object.select_all(action='DESELECT')
            target.select_set(True)
            bpy.context.view_layer.objects.active = target
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.normals_make_consistent(inside=False)
            bpy.ops.object.mode_set(mode='OBJECT')

    bpy.ops.export_scene.gltf(
        filepath=DST,
        export_format='GLB',
        export_skins=True,
        export_yup=True,
        export_apply=False
    )
    print(f"Exported: {DST}")

if __name__ == "__main__":
    main()
