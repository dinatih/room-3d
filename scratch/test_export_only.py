import bpy
import os

glb_path = 'public/media/all_lara/lara_croft_red_dress.glb'
dest_path = 'scratch/test_red_dress_reexported.glb'

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

bpy.ops.import_scene.gltf(filepath=glb_path)

bpy.ops.export_scene.gltf(
    filepath=dest_path,
    export_format='GLB',
    export_skins=True,
    export_animations=True
)
print("Re-export complete.")
