import bpy
import os

fbx_file = "/home/dinatih/Projects/room-3d/sources_backup/animations/Skinning Test.fbx"
out_glb = "/home/dinatih/Projects/room-3d/public/models/test_metarig_anims/skinning_test.glb"
os.makedirs(os.path.dirname(out_glb), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=fbx_file)
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', export_animations=True)
