import bpy
import os
import sys

src_dir = "/home/dinatih/Projects/room-3d/sources_backup/animations"
dst_dir = "/home/dinatih/Projects/room-3d/public/models/test_metarig_anims"
os.makedirs(dst_dir, exist_ok=True)

fbx_files = [f for f in os.listdir(src_dir) if f.endswith('.fbx')]
for fbx in fbx_files:
    fbx_path = os.path.join(src_dir, fbx)
    out_name = fbx.replace('.fbx', '').replace(' ', '_').lower() + '.glb'
    out_path = os.path.join(dst_dir, out_name)
    
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', export_animations=True)
