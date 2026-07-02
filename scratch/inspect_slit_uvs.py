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

# Let's inspect Face 65146 (left) and Face 65470 (right) which are very small and in the box
# Let's inspect all faces in the left box
uv_layer = mesh_obj.data.uv_layers.active.data
print("LEFT BOX FACES UV AND GEOMETRY:")
for poly in mesh_obj.data.polygons:
    in_box = True
    for v_idx in poly.vertices:
        v = mesh_obj.data.vertices[v_idx]
        if not (0.03 <= v.co.x <= 0.11 and -0.12 <= v.co.y <= -0.04 and 1.20 <= v.co.z <= 1.28):
            in_box = False
            break
    if in_box:
        uvs = []
        for loop_idx in poly.loop_indices:
            uvs.append(f"({uv_layer[loop_idx].uv.x:.4f}, {uv_layer[loop_idx].uv.y:.4f})")
        print(f"Face {poly.index}: mat={mesh_obj.material_slots[poly.material_index].name}, center={poly.center}, normal={poly.normal}, UVs={', '.join(uvs)}")
