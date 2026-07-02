import bpy
import zipfile

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_test_flatten")
fbx_path = "/tmp/scoop_test_flatten/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 2000:
        mesh_obj = obj
        break

# Let's find material index for shirt
shirt_idx = -1
for i, slot in enumerate(mesh_obj.material_slots):
    if "shirt" in slot.name.lower():
        shirt_idx = i

left_verts = []
right_verts = []

for poly in mesh_obj.data.polygons:
    if poly.material_index == shirt_idx:
        for v_idx in poly.vertices:
            v = mesh_obj.data.vertices[v_idx]
            # Left slit region
            if 0.04 <= v.co.x <= 0.105 and -0.11 <= v.co.y <= -0.07 and 1.20 <= v.co.z <= 1.28:
                left_verts.append(v_idx)
            # Right slit region
            elif -0.105 <= v.co.x <= -0.04 and -0.11 <= v.co.y <= -0.07 and 1.20 <= v.co.z <= 1.28:
                right_verts.append(v_idx)

left_verts = list(set(left_verts))
right_verts = list(set(right_verts))

print(f"Left slit vertices: {left_verts}")
for v_idx in left_verts:
    v = mesh_obj.data.vertices[v_idx]
    old_y = v.co.y
    v.co.y = -0.114
    print(f"  v {v_idx} Y: {old_y:.4f} -> {v.co.y:.4f}")

print(f"Right slit vertices: {right_verts}")
for v_idx in right_verts:
    v = mesh_obj.data.vertices[v_idx]
    old_y = v.co.y
    v.co.y = -0.114
    print(f"  v {v_idx} Y: {old_y:.4f} -> {v.co.y:.4f}")
