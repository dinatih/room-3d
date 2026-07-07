import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

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
lara = bpy.data.objects.get("Lara")

# 2. Rename Lara vertex groups (Remove DEF- prefix, or MCH-)
for vg in lara.vertex_groups:
    if vg.name.startswith("DEF-"):
        vg.name = vg.name[4:]

print("Groups renamed!")

for mod in lara.modifiers:
    if mod.type == 'ARMATURE':
        lara.modifiers.remove(mod)

bpy.ops.object.select_all(action='DESELECT')
lara.select_set(True)
metarig.select_set(True)
bpy.context.view_layer.objects.active = metarig
bpy.ops.object.parent_set(type='ARMATURE')

for obj in bpy.data.objects:
    if obj.parent == bpy.data.objects.get("rig"):
        obj.parent = metarig
        if obj.parent_type == 'BONE':
            # Remove DEF- if it was there, or just keep it
            bone_name = obj.parent_bone
            if bone_name == "head":
                obj.parent_bone = "spine.005"
            elif bone_name.startswith("DEF-"):
                obj.parent_bone = bone_name[4:]
            # e.g., 'spine.005', 'hand.R', etc.

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

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_metarig_perfect.blend")
