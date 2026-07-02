import bpy
import zipfile

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_meshes")
fbx_path = "/tmp/scoop_inspect_meshes/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

print("ALL OBJECTS IN SCENE:")
for obj in bpy.data.objects:
    print(f"Object: {obj.name}, type={obj.type}")
    if obj.type == 'MESH':
        print(f"  Materials: {[slot.name for slot in obj.material_slots]}")
        print(f"  Vertices: {len(obj.data.vertices)}")
