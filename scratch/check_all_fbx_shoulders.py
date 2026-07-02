import os
import zipfile
import tempfile
import bpy

src_dir = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style"
for name in sorted(os.listdir(src_dir)):
    if name.endswith(".zip"):
        zip_path = os.path.join(src_dir, name)
        with tempfile.TemporaryDirectory() as tmpdir:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                fbx_files = [n for n in zip_ref.namelist() if n.lower().endswith(".fbx")]
                if fbx_files:
                    fbx_path = os.path.join(tmpdir, fbx_files[0])
                    zip_ref.extract(fbx_files[0], tmpdir)
                    
                    bpy.ops.wm.read_factory_settings(use_empty=True)
                    try:
                        bpy.ops.import_scene.fbx(filepath=fbx_path)
                        arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
                        bones = [b.name for b in arm.data.bones if "shoulder" in b.name.lower()]
                        print(f"{name}: {bones}")
                    except Exception as e:
                        print(f"{name}: Failed: {e}")
