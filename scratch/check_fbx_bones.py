import os
import zipfile
import tempfile
import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

src_dir = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style"
zip_files = [f for f in os.listdir(src_dir) if f.endswith(".zip")]
zip_files.sort()

for zf in zip_files:
    zip_path = os.path.join(src_dir, zf)
    print(f"\n--- Checking {zf} ---")
    with tempfile.TemporaryDirectory() as tmpdir:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Find the .fbx file inside the zip
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            if not fbx_files:
                print("No FBX file found inside zip!")
                continue
            
            fbx_name = fbx_files[0]
            zip_ref.extract(fbx_name, tmpdir)
            extracted_path = os.path.join(tmpdir, fbx_name)
            
            # Clear scene
            bpy.ops.wm.read_factory_settings(use_empty=True)
            
            # Import FBX
            try:
                bpy.ops.import_scene.fbx(filepath=extracted_path)
            except Exception as e:
                print(f"Error importing FBX: {e}")
                continue
                
            # Find armature
            armatures = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
            if not armatures:
                print("No armature found in FBX!")
                continue
                
            arm = armatures[0]
            bone_names = [b.name for b in arm.data.bones]
            breast_bones = [name for name in bone_names if "breast" in name.lower() or "pec" in name.lower()]
            print(f"Total bones: {len(bone_names)}")
            if breast_bones:
                print(f"Found breast bones: {breast_bones}")
            else:
                print("No breast bones found.")
