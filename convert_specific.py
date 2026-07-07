import bpy
import os

src_dir = "/home/dinatih/Projects/room-3d/sources_backup/animations"
dst_dir = "/home/dinatih/Projects/room-3d/public/models/test_metarig_anims"
os.makedirs(dst_dir, exist_ok=True)

fbx_files = [
    'Back Flip To Uppercut.fbx'
]

for fbx in fbx_files:
    fbx_path = os.path.join(src_dir, fbx)
    if not os.path.exists(fbx_path):
        print(f"File not found: {fbx_path}")
        continue
    out_name = fbx.replace('.fbx', '').replace(' ', '_').lower() + '.glb'
    out_path = os.path.join(dst_dir, out_name)
    
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    bpy.ops.export_scene.gltf(filepath=out_path, export_format='GLB', export_animations=True)
    print(f"Converted {fbx} to {out_name}")
