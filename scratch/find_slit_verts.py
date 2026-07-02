import bpy
import zipfile

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_slits")
fbx_path = "/tmp/scoop_inspect_slits/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 2000:
        mesh_obj = obj
        break

# Let's find vertices of 5_Shirt_1.0_0_0 in the left back slit region:
# X in [0.04, 0.11], Z in [1.20, 1.28], Y in [-0.12, -0.05]
shirt_idx = -1
for i, slot in enumerate(mesh_obj.material_slots):
    if "shirt" in slot.name.lower():
        shirt_idx = i

# Find all vertices used by these faces
vert_indices = set()
for poly in mesh_obj.data.polygons:
    if poly.material_index == shirt_idx:
        in_box = True
        for v_idx in poly.vertices:
            v = mesh_obj.data.vertices[v_idx]
            if not (0.04 <= v.co.x <= 0.10 and -0.12 <= v.co.y <= -0.04 and 1.20 <= v.co.z <= 1.28):
                in_box = False
                break
        if in_box:
            for v_idx in poly.vertices:
                vert_indices.add(v_idx)

print(f"Found {len(vert_indices)} vertices in the left slit region:")
for v_idx in sorted(list(vert_indices)):
    v = mesh_obj.data.vertices[v_idx]
    print(f"  v {v_idx}: co=({v.co.x:.4f}, {v.co.y:.4f}, {v.co.z:.4f})")
