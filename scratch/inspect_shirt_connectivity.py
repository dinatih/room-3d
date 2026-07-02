import bpy
import zipfile
import bmesh

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_shirt_islands")
fbx_path = "/tmp/scoop_inspect_shirt_islands/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 2000:
        mesh_obj = obj
        break

print(f"Mesh: {mesh_obj.name}")

# Build a BMesh of only the 5_Shirt_1.0_0_0 faces to find their islands
bm = bmesh.new()
bm.from_mesh(mesh_obj.data)

# Let's find material index for shirt
shirt_idx = -1
for i, slot in enumerate(mesh_obj.material_slots):
    if "shirt" in slot.name.lower():
        shirt_idx = i
        break

print(f"Shirt material index: {shirt_idx}")

# Filter BMesh to keep only shirt faces
faces_to_delete = [f for f in bm.faces if f.material_index != shirt_idx]
bmesh.ops.delete(bm, geom=faces_to_delete, context="FACES")

# Now find connected components (islands) of the shirt mesh
faces_todo = set(bm.faces)
islands = []
while faces_todo:
    face = faces_todo.pop()
    island_faces = [face]
    queue = [face]
    while queue:
        f = queue.pop(0)
        for edge in f.edges:
            for n_f in edge.link_faces:
                if n_f in faces_todo:
                    faces_todo.remove(n_f)
                    island_faces.append(n_f)
                    queue.append(n_f)
    islands.append(island_faces)

print(f"Total shirt islands: {len(islands)}")

# Print info on small shirt islands in the back area
for idx, island in enumerate(islands):
    min_x, max_x = 999.0, -999.0
    min_y, max_y = 999.0, -999.0
    min_z, max_z = 999.0, -999.0
    for f in island:
        for v in f.verts:
            co = v.co
            min_x = min(min_x, co.x)
            max_x = max(max_x, co.x)
            min_y = min(min_y, co.y)
            max_y = max(max_y, co.y)
            min_z = min(min_z, co.z)
            max_z = max(max_z, co.z)
            
    # If the island is small and in the back torso region
    if len(island) < 100 and min_z >= 1.0 and max_z <= 1.40 and max_y <= -0.02 and -0.15 <= min_x <= 0.15:
        print(f"Shirt Island {idx}:")
        print(f"  Faces: {len(island)}")
        print(f"  BBox: X=[{min_x:.4f}, {max_x:.4f}], Y=[{min_y:.4f}, {max_y:.4f}], Z=[{min_z:.4f}, {max_z:.4f}]")
