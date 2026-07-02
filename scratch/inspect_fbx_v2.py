import bpy
import zipfile
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

# Extract and import Scoop bodysuit
zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_fbx")
fbx_path = "/tmp/scoop_inspect_fbx/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

armature = bpy.data.objects.get("Armature")
mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 2000:
        mesh_obj = obj
        break

print(f"Mesh: {mesh_obj.name}")
print(f"Mesh scale: {mesh_obj.scale}, location: {mesh_obj.location}, rotation: {mesh_obj.rotation_euler}")
print(f"Armature scale: {armature.scale}, location: {armature.location}, rotation: {armature.rotation_euler}")

print("TARGET BONES:")
for b in armature.data.bones:
    if "spine" in b.name.lower() or "chest" in b.name.lower() or "breast" in b.name.lower():
        print(f"Target bone: {b.name}, head={b.head}, tail={b.tail}")

# Let's import reference Bikini and see its breast bone positions
ref_zip = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/01 Bikini.zip"
with zipfile.ZipFile(ref_zip, 'r') as zip_ref:
    zip_ref.extractall("/tmp/bikini_inspect_fbx")
bpy.ops.import_scene.fbx(filepath="/tmp/bikini_inspect_fbx/01 Bikini.fbx")

# Find reference armature and reference breast bones
ref_armature = None
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE' and obj != armature:
        ref_armature = obj
        break

print(f"Reference Armature: {ref_armature.name}")
for b in ref_armature.data.bones:
    if "breast" in b.name.lower():
        print(f"Ref Bone '{b.name}': head={b.head}, tail={b.tail}")
