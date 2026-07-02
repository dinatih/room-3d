import bpy
import zipfile

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_fbx")
fbx_path = "/tmp/scoop_inspect_fbx/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

armature = bpy.data.objects.get("Armature")
mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        mesh_obj = obj
        break

print(f"Mesh: {mesh_obj.name}")
print("HAIR/BRAID BONES IN TARGET FBX:")
hair_bones = []
for b in armature.data.bones:
    name_lower = b.name.lower()
    if "hair" in name_lower or "braid" in name_lower or "ponytail" in name_lower:
        hair_bones.append(b.name)
        print(f"  Bone: {b.name}, head={b.head}, tail={b.tail}")

# Let's inspect vertex groups related to hair/braid
print("HAIR/BRAID VERTEX GROUPS IN TARGET FBX:")
for vg in mesh_obj.vertex_groups:
    name_lower = vg.name.lower()
    if "hair" in name_lower or "braid" in name_lower or "ponytail" in name_lower:
        print(f"  Vertex Group: {vg.name}")

# Let's find vertices that belong to Braid material
# Material slot index for 5_Braid_1.0_0_0
braid_slot_index = -1
for i, slot in enumerate(mesh_obj.material_slots):
    if "braid" in slot.name.lower():
        braid_slot_index = i
        print(f"Braid material slot index: {i} ({slot.name})")

if braid_slot_index != -1:
    # Let's find vertices that use this material slot
    braid_verts = []
    for poly in mesh_obj.data.polygons:
        if poly.material_index == braid_slot_index:
            for v_idx in poly.vertices:
                braid_verts.append(v_idx)
    braid_verts = list(set(braid_verts))
    print(f"Found {len(braid_verts)} vertices using Braid material.")
    
    # Let's check if any of these vertices have NO weights or are weighted to 0.0 or to a bone at the origin
    unweighted_count = 0
    weighted_to_origin_count = 0
    
    # We will print the bone weights for the first few braid vertices
    sample_printed = 0
    for v_idx in braid_verts:
        v = mesh_obj.data.vertices[v_idx]
        groups = v.groups
        if len(groups) == 0:
            unweighted_count += 1
        else:
            # check if weighted to a bone that might be at the origin (e.g. armature root or none)
            is_valid = False
            for g in groups:
                # get vertex group name
                vg_name = mesh_obj.vertex_groups[g.group].name
                if g.weight > 0.01:
                    is_valid = True
            if not is_valid:
                unweighted_count += 1
                
            # Let's print a sample of vertices at the end of the braid (lowest Z or highest Y depending on coordinates)
            if sample_printed < 5 and v.co.z < 1.0: # braid end is low in Z
                bone_weights = []
                for g in groups:
                    vg_name = mesh_obj.vertex_groups[g.group].name
                    bone_weights.append(f"{vg_name}: {g.weight:.3f}")
                print(f"Braid vertex {v_idx} at co={v.co}: {', '.join(bone_weights)}")
                sample_printed += 1
                
    print(f"Braid vertices with no valid weight: {unweighted_count}")
