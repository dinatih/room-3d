import bpy
import zipfile
import os

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_fbx")
    
fbx_path = "/tmp/scoop_inspect_fbx/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

armature = None
tgt_body_mesh = None

for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        armature = obj
    elif obj.type == 'MESH':
        if len(obj.data.vertices) > 5000: # the main body mesh
            tgt_body_mesh = obj

print(f"Armature: {armature.name if armature else 'None'}")
print(f"Body Mesh: {tgt_body_mesh.name if tgt_body_mesh else 'None'}")

# Let's print parent_bone (spine_upper or Spine2) head position
parent_bone_name = "spine_upper"
for b in armature.data.bones:
    if "spine2" in b.name.lower() or "spine_upper" in b.name.lower():
        parent_bone_name = b.name
        break

parent_bone = armature.data.bones.get(parent_bone_name)
print(f"Parent bone name: {parent_bone_name}")
if parent_bone:
    print(f"Parent bone head: {parent_bone.head}")
    print(f"Parent bone tail: {parent_bone.tail}")

# Let's run a test transfer to see where the breast weights map on vertices
# We can import reference 01_bikini
ref_zip = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/01 Bikini.zip"
with zipfile.ZipFile(ref_zip, 'r') as zip_ref:
    zip_ref.extractall("/tmp/bikini_inspect_fbx")
bpy.ops.import_scene.fbx(filepath="/tmp/bikini_inspect_fbx/01 Bikini.fbx")

ref_mesh = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and obj != tgt_body_mesh:
        if len(obj.data.vertices) > 1000:
            ref_mesh = obj

print(f"Reference Mesh: {ref_mesh.name if ref_mesh else 'None'}")

if ref_mesh and tgt_body_mesh:
    # Set up data transfer
    # Align vertex group names
    for vg in ref_mesh.vertex_groups:
        vg_name_lower = vg.name.lower()
        if "breast" in vg_name_lower and "left" in vg_name_lower:
            vg.name = "breast_left_base"
        elif "breast" in vg_name_lower and "right" in vg_name_lower:
            vg.name = "breast_right_base"
            
    # Ensure target has these groups
    for bname in ["breast_left_base", "breast_right_base"]:
        if bname not in tgt_body_mesh.vertex_groups:
            tgt_body_mesh.vertex_groups.new(name=bname)
            
    # Duplicate target body mesh to run the Data Transfer
    bpy.ops.object.select_all(action='DESELECT')
    tgt_body_mesh.select_set(True)
    bpy.context.view_layer.objects.active = tgt_body_mesh
    bpy.ops.object.duplicate()
    tmp_mesh = bpy.context.active_object
    
    # Run data transfer
    transfer_mod = tmp_mesh.modifiers.new(name="BreastTransfer", type='DATA_TRANSFER')
    transfer_mod.object = ref_mesh
    transfer_mod.use_vertex_groups_data = True
    transfer_mod.vertex_group_mapping = 'TOPOLOGY' # wait, in build script we used datalayout_transfer, let's see
    
    bpy.ops.object.select_all(action='DESELECT')
    tmp_mesh.select_set(True)
    bpy.context.view_layer.objects.active = tmp_mesh
    
    # We will print the vertex coordinate range of the transferred group
    vg_l = tmp_mesh.vertex_groups.get("breast_left_base")
    # Let's run a topological datalayout transfer
    # (Actually we can just scan vertices and print coordinates)
