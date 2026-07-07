import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# 1. Delete rig
rig = bpy.data.objects.get("rig")
if rig:
    bpy.data.objects.remove(rig)

# 2. Append metarig
filepath = "sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend"
inner_path = "Object"
object_name = "metarig"

bpy.ops.wm.append(
    filepath=f"{filepath}/{inner_path}/{object_name}",
    directory=f"{filepath}/{inner_path}/",
    filename=object_name
)

metarig = bpy.data.objects.get("metarig")

# Ensure metarig is named "Armature" for clean export (optional but good)
metarig.name = "Armature"

lara = bpy.data.objects.get("Lara")

# 3. Clear all vertex groups and modifiers on Lara
lara.vertex_groups.clear()
for mod in lara.modifiers:
    if mod.type == 'ARMATURE':
        lara.modifiers.remove(mod)

# 4. Voxel Skinning!
bpy.ops.object.select_all(action='DESELECT')
lara.select_set(True)
metarig.select_set(True)
bpy.context.view_layer.objects.active = metarig

# Voxel Heat Diffuse Skinning
print("Running Voxel Skinning on metarig...")
try:
    bpy.ops.object.voxel_heat_diffuse_skinning(
        voxel_resolution=8,
        submesh_resolution=256,
        smooth_iterations=3,
        use_create=True # Important: creates vertex groups
    )
    print("Voxel Skinning successful!")
except Exception as e:
    print(f"Voxel Skinning failed: {e}")

# 5. Add Armature Modifier and Parent
# The addon might have parented it, let's verify
has_armature = any(mod.type == 'ARMATURE' for mod in lara.modifiers)
if not has_armature:
    mod = lara.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = metarig

if lara.parent != metarig:
    lara.parent = metarig

# 6. Reparent accessories to metarig
# We need to map Rigify bone names to metarig bone names.
# In Rigify, head is 'head'. In metarig, head is 'spine.005'.
# In Rigify, hand.L is 'hand.L'. In metarig, hand is 'hand.L'.
for obj in bpy.data.objects:
    if obj.type == 'MESH' and obj != lara and obj.parent_type == 'BONE':
        bone_name = obj.parent_bone
        if bone_name == "head" or bone_name == "spine.006":
            obj.parent_bone = "spine.005"
        elif bone_name.startswith("DEF-"):
            obj.parent_bone = bone_name[4:]
        
        # Ensure it is parented to the new Armature
        obj.parent = metarig

# 7. Export GLB
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

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_metarig_voxel.blend")
