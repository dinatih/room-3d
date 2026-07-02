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

print(f"Analyzing mesh: {mesh_obj.name}")

# Let's count polygons and their materials in the back area:
# X in [-0.15, 0.15]
# Y in [-0.15, -0.02] (back of the torso is on the negative Y side)
# Z in [1.15, 1.35]
material_polys = {}
for poly in mesh_obj.data.polygons:
    # Check if any vertex of this polygon is in the target back area
    in_back = False
    for v_idx in poly.vertices:
        v = mesh_obj.data.vertices[v_idx]
        if -0.15 <= v.co.x <= 0.15 and -0.15 <= v.co.y <= -0.02 and 1.15 <= v.co.z <= 1.35:
            in_back = True
            break
            
    if in_back:
        mat_name = mesh_obj.material_slots[poly.material_index].name
        material_polys[mat_name] = material_polys.get(mat_name, 0) + 1

print("Materials found in the back region:")
for mat_name, count in material_polys.items():
    print(f"  {mat_name}: {count} polygons")
