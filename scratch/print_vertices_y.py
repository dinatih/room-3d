import bpy
import zipfile

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

# Let's import reference Bikini and transfer weights to see which vertices get weights
ref_zip = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/01 Bikini.zip"
with zipfile.ZipFile(ref_zip, 'r') as zip_ref:
    zip_ref.extractall("/tmp/bikini_inspect_fbx")
bpy.ops.import_scene.fbx(filepath="/tmp/bikini_inspect_fbx/01 Bikini.fbx")

ref_mesh = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and obj != mesh_obj:
        if len(obj.data.vertices) > 1000:
            ref_mesh = obj

# Align vertex group names
for vg in ref_mesh.vertex_groups:
    vg_name_lower = vg.name.lower()
    if "breast" in vg_name_lower and "left" in vg_name_lower:
        vg.name = "breast_left_base"
    elif "breast" in vg_name_lower and "right" in vg_name_lower:
        vg.name = "breast_right_base"
        
for bname in ["breast_left_base", "breast_right_base"]:
    if bname not in mesh_obj.vertex_groups:
        mesh_obj.vertex_groups.new(name=bname)

# Run data transfer
bpy.ops.object.select_all(action='DESELECT')
mesh_obj.select_set(True)
bpy.context.view_layer.objects.active = mesh_obj
bpy.ops.object.duplicate()
tmp_mesh = bpy.context.active_object

# Configure data transfer
transfer_mod = tmp_mesh.modifiers.new(name="BreastTransfer", type='DATA_TRANSFER')
transfer_mod.object = ref_mesh
transfer_mod.use_vert_data = True
transfer_mod.data_types_verts = {'VGROUP_WEIGHTS'}
transfer_mod.vert_mapping = 'POLYINTERP_NEAREST'

bpy.ops.object.select_all(action='DESELECT')
tmp_mesh.select_set(True)
bpy.context.view_layer.objects.active = tmp_mesh
bpy.ops.object.datalayout_transfer(modifier="BreastTransfer")
bpy.ops.object.modifier_apply(modifier="BreastTransfer")

# Now inspect vertex coordinates that got weights
for vg_name in ["breast_left_base", "breast_right_base"]:
    vg = tmp_mesh.vertex_groups.get(vg_name)
    x_coords = []
    y_coords = []
    z_coords = []
    for v in tmp_mesh.data.vertices:
        for g in v.groups:
            if g.group == vg.index and g.weight > 0.01:
                x_coords.append(v.co.x)
                y_coords.append(v.co.y)
                z_coords.append(v.co.z)
    if y_coords:
        print(f"Group {vg_name}: {len(y_coords)} vertices")
        print(f"  X range: min={min(x_coords):.4f}, max={max(x_coords):.4f}")
        print(f"  Y range: min={min(y_coords):.4f}, max={max(y_coords):.4f}")
        print(f"  Z range: min={min(z_coords):.4f}, max={max(z_coords):.4f}")
