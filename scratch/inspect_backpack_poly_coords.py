import bpy
import zipfile

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

# Print centers of all faces using BackPack or Buckle or Gear
for i, slot in enumerate(mesh_obj.material_slots):
    name_lower = slot.name.lower()
    if "backpack" in name_lower or "gear" in name_lower or "buckle" in name_lower:
        count = 0
        min_x, max_x = 999, -999
        min_y, max_y = 999, -999
        min_z, max_z = 999, -999
        for poly in mesh_obj.data.polygons:
            if poly.material_index == i:
                c = poly.center
                min_x = min(min_x, c.x)
                max_x = max(max_x, c.x)
                min_y = min(min_y, c.y)
                max_y = max(max_y, c.y)
                min_z = min(min_z, c.z)
                max_z = max(max_z, c.z)
                count += 1
        print(f"Material {slot.name} (index {i}): {count} polys, X=[{min_x:.4f}, {max_x:.4f}], Y=[{min_y:.4f}, {max_y:.4f}], Z=[{min_z:.4f}, {max_z:.4f}]")
