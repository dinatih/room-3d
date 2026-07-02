import bpy
import zipfile
import bmesh

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_del")
fbx_path = "/tmp/scoop_inspect_del/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 2000:
        mesh_obj = obj
        break

print(f"Mesh: {mesh_obj.name}")

# Let's count how many faces in the back region use Gear/BackPack/Buckle
target_mats = ["5_Gear_1.0_0_0", "5_BackPack_1.0_0_0", "5_Buckle_1.0_0_0"]
to_delete = []

bm = bmesh.new()
bm.from_mesh(mesh_obj.data)

deleted_count = 0
for face in bm.faces:
    mat_name = mesh_obj.material_slots[face.material_index].name
    if any(m in mat_name for m in target_mats):
        # Check if the face is in the target back region
        # X in [-0.15, 0.15]
        # Y in [-0.15, -0.04]
        # Z in [1.15, 1.32]
        c = face.calc_center_median()
        if -0.15 <= c.x <= 0.15 and -0.15 <= c.y <= -0.04 and 1.15 <= c.z <= 1.32:
            to_delete.append(face)

print(f"Found {len(to_delete)} faces to delete in the back region.")
for face in to_delete[:10]:
    mat_name = mesh_obj.material_slots[face.material_index].name
    c = face.calc_center_median()
    print(f"  Face {face.index}: mat={mat_name}, center=({c.x:.4f}, {c.y:.4f}, {c.z:.4f})")
