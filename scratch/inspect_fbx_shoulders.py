import bpy
import zipfile
import tempfile
import os

with tempfile.TemporaryDirectory() as tmpdir:
    # Unzip 07 Scoop
    zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(tmpdir)
        fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
        fbx_path = os.path.join(tmpdir, fbx_files[0])
        
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    print(f"\n=== SHOULDERS IN ORIGINAL FBX ===")
    for b in arm.data.bones:
        if "shoulder" in b.name.lower() or "clavicle" in b.name.lower() or "leftarm" in b.name.lower():
            print(f"  {b.name}:")
            print(f"    Parent: {b.parent.name if b.parent else 'None'}")
            print(f"    Head: {b.head}")
            print(f"    Tail: {b.tail}")
            print(f"    Children: {[c.name for c in b.children]}")
