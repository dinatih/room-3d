import bpy
import zipfile

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_back_faces")
fbx_path = "/tmp/scoop_inspect_back_faces/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 2000:
        mesh_obj = obj
        break

print(f"Mesh: {mesh_obj.name}")

# Let's inspect the polygons in the left back slit region (X around 0.05 to 0.09, Z around 1.20 to 1.26, Y around -0.12 to -0.06)
print("LEFT STRAP SLIT POLYGONS:")
left_polys = []
for poly in mesh_obj.data.polygons:
    # If the poly center is within a small bounding box
    c = poly.center
    if 0.04 <= c.x <= 0.09 and -0.12 <= c.y <= -0.05 and 1.21 <= c.z <= 1.26:
        left_polys.append(poly)

for poly in left_polys:
    mat_name = mesh_obj.material_slots[poly.material_index].name
    print(f"Face {poly.index}: mat={mat_name}, center=({c.x:.4f}, {c.y:.4f}, {c.z:.4f}), normal=({poly.normal.x:.4f}, {poly.normal.y:.4f}, {poly.normal.z:.4f})")
    for v_idx in poly.vertices:
        v = mesh_obj.data.vertices[v_idx]
        print(f"  v {v_idx}: co=({v.co.x:.4f}, {v.co.y:.4f}, {v.co.z:.4f})")
