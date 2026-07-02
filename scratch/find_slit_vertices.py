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

# Let's inspect faces in the left slit region
print("FACES IN LEFT BOX X=[0.04, 0.10], Y=[-0.12, -0.05], Z=[1.20, 1.28]:")
left_faces = []
for poly in mesh_obj.data.polygons:
    in_box = True
    for v_idx in poly.vertices:
        v = mesh_obj.data.vertices[v_idx]
        if not (0.03 <= v.co.x <= 0.11 and -0.12 <= v.co.y <= -0.04 and 1.20 <= v.co.z <= 1.28):
            in_box = False
            break
    if in_box:
        left_faces.append(poly)

for f in left_faces:
    mat = mesh_obj.material_slots[f.material_index].name
    print(f"Face {f.index}: mat={mat}, center={f.center}, area={f.area:.6f}")

print("\nFACES IN RIGHT BOX X=[-0.10, -0.04], Y=[-0.12, -0.05], Z=[1.20, 1.28]:")
right_faces = []
for poly in mesh_obj.data.polygons:
    in_box = True
    for v_idx in poly.vertices:
        v = mesh_obj.data.vertices[v_idx]
        if not (-0.11 <= v.co.x <= -0.03 and -0.12 <= v.co.y <= -0.04 and 1.20 <= v.co.z <= 1.28):
            in_box = False
            break
    if in_box:
        right_faces.append(poly)

for f in right_faces:
    mat = mesh_obj.material_slots[f.material_index].name
    print(f"Face {f.index}: mat={mat}, center={f.center}, area={f.area:.6f}")
