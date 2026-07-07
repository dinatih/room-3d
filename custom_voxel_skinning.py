import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

lara = bpy.data.objects.get("Lara")

# 1. Append metarig
filepath = "sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend"
inner_path = "Object"
object_name = "metarig"

bpy.ops.wm.append(
    filepath=f"{filepath}/{inner_path}/{object_name}",
    directory=f"{filepath}/{inner_path}/",
    filename=object_name
)

metarig = bpy.data.objects.get("metarig")
metarig.name = "Armature"

# 2. Clear Lara vertex groups and modifiers
lara.vertex_groups.clear()
for mod in lara.modifiers:
    if mod.type == 'ARMATURE':
        lara.modifiers.remove(mod)

# 3. Create proxy
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
lara.select_set(True)
bpy.context.view_layer.objects.active = lara
bpy.ops.object.duplicate()
proxy = bpy.context.active_object
proxy.name = "Lara_Proxy"

remesh = proxy.modifiers.new(name="Remesh", type='REMESH')
remesh.mode = 'VOXEL'
remesh.voxel_size = 0.015
bpy.ops.object.modifier_apply(modifier="Remesh")

# 4. Auto weight proxy to metarig
bpy.ops.object.select_all(action='DESELECT')
proxy.select_set(True)
metarig.select_set(True)
bpy.context.view_layer.objects.active = metarig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# 5. Transfer to Lara
bpy.ops.object.select_all(action='DESELECT')
lara.select_set(True)
bpy.context.view_layer.objects.active = lara

dt = lara.modifiers.new(name="DataTransfer", type='DATA_TRANSFER')
dt.object = proxy
dt.use_vert_data = True
dt.data_types_verts = {'VGROUP_WEIGHTS'}
dt.vert_mapping = 'POLYINTERP_NEAREST'

# Generate vertex groups
bpy.ops.object.datalayout_transfer(modifier="DataTransfer")
bpy.ops.object.modifier_apply(modifier="DataTransfer")

bpy.data.objects.remove(proxy)

# Add Armature mod to Lara
mod = lara.modifiers.new(name="Armature", type='ARMATURE')
mod.object = metarig
lara.parent = metarig

# Reparent accessories
for obj in bpy.data.objects:
    if obj.type == 'MESH' and obj != lara and obj.parent_type == 'BONE':
        bone_name = obj.parent_bone
        if bone_name == "head" or bone_name == "spine.006":
            obj.parent_bone = "spine.005"
        elif bone_name.startswith("DEF-"):
            obj.parent_bone = bone_name[4:]
        obj.parent = metarig

# Delete rigify rig
rig = bpy.data.objects.get("rig")
if rig:
    bpy.data.objects.remove(rig)

bpy.ops.export_scene.gltf(
    filepath="public/models/lara_perfect.glb",
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
    export_yup=True,
    export_animations=True
)
print("Export complete!")

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_metarig_final.blend")
