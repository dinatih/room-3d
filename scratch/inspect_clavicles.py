import bpy
import zipfile

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_fbx")
fbx_path = "/tmp/scoop_inspect_fbx/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

armature = bpy.data.objects.get("Armature")

print("ARMATURE BONES HEIGHTS:")
for b in armature.data.bones:
    if "clavicle" in b.name.lower() or "shoulder" in b.name.lower() or "upperarm" in b.name.lower() or "neck" in b.name.lower():
        print(f"Bone: {b.name}, head={b.head}, tail={b.tail}")
