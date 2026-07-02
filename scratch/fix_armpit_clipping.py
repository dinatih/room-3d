import bpy
import zipfile
import math

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_fbx")
fbx_path = "/tmp/scoop_inspect_fbx/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 2000:
        mesh_obj = obj
        break

print(f"Mesh: {mesh_obj.name}")

# Find material indices
skin_slot_idx = -1
shirt_slot_idx = -1
for i, slot in enumerate(mesh_obj.material_slots):
    if "body" in slot.name.lower() or "skin" in slot.name.lower():
        skin_slot_idx = i
    elif "shirt" in slot.name.lower():
        shirt_slot_idx = i

print(f"Skin slot: {skin_slot_idx}, Shirt slot: {shirt_slot_idx}")

if skin_slot_idx != -1 and shirt_slot_idx != -1:
    # Get vertices using these materials
    skin_verts = []
    shirt_verts = []
    
    # Map polygons to vertices
    for poly in mesh_obj.data.polygons:
        if poly.material_index == skin_slot_idx:
            skin_verts.extend(poly.vertices)
        elif poly.material_index == shirt_slot_idx:
            shirt_verts.extend(poly.vertices)
            
    skin_verts = list(set(skin_verts))
    shirt_verts = list(set(shirt_verts))
    
    print(f"Total skin vertices: {len(skin_verts)}, shirt vertices: {len(shirt_verts)}")
    
    # Filter skin vertices in the armpit regions
    # Armpit region: Z in [1.20, 1.40], abs(X) in [0.06, 0.22]
    armpit_skin_verts = []
    for v_idx in skin_verts:
        v = mesh_obj.data.vertices[v_idx]
        if 1.20 <= v.co.z <= 1.40 and 0.06 <= abs(v.co.x) <= 0.22 and -0.15 <= v.co.y <= 0.05:
            armpit_skin_verts.append(v_idx)
            
    print(f"Found {len(armpit_skin_verts)} skin vertices in armpit region.")
