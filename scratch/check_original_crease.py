import bpy
import zipfile
import os
import tempfile

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with tempfile.TemporaryDirectory() as tmpdir:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(tmpdir)
        fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
        tgt_fbx_path = os.path.join(tmpdir, fbx_files[0])
        
    bpy.ops.import_scene.fbx(filepath=tgt_fbx_path)
    
    out_glb_path = "/home/dinatih/Projects/room-3d/public/media/sandbox/test_orig_scoop.glb"
    bpy.ops.export_scene.gltf(
        filepath=out_glb_path,
        export_format='GLB',
        export_skins=True,
        export_yup=True
    )
    print("Exported original FBX to GLB!")
