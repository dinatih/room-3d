import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# 1. Clean up ALL vertex groups added by the failed ARMATURE_AUTO
# Keep only the original ones. Wait, instead of deleting, I'll just clear all VGs
# and re-import the meshes from the old file!
print("Re-importing meshes from old file to restore perfect weights...")

old_file = "sources_backup/lara_croft_perfect_rigify.blend"

# Get names of all meshes
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.name.startswith("WGT")]
mesh_names = [m.name for m in meshes]

# Delete current meshes
bpy.ops.object.select_all(action='DESELECT')
for m in meshes:
    m.select_set(True)
bpy.ops.object.delete()

# Append meshes from old file
with bpy.data.libraries.load(old_file, link=False) as (data_from, data_to):
    data_to.objects = [name for name in data_from.objects if name in mesh_names]

rig = bpy.data.objects.get("rig")

# Link to scene and process
for obj in data_to.objects:
    if obj is not None:
        bpy.context.collection.objects.link(obj)
        obj.parent = rig
        
        # Add modifier
        mods_to_remove = [mod for mod in obj.modifiers if mod.type == 'ARMATURE']
        for mod in mods_to_remove:
            obj.modifiers.remove(mod)
            
        arm_mod = obj.modifiers.new(name="Armature", type='ARMATURE')
        arm_mod.object = rig
        arm_mod.use_vertex_groups = True
        arm_mod.use_bone_envelopes = False
        
        # Fix missing bone names!
        for vg in obj.vertex_groups:
            if vg.name == 'spine upper':
                vg.name = 'DEF-spine.003'
            elif vg.name == 'DEF-weapon right':
                vg.name = 'DEF-hand.R' # fallback to hand
            elif vg.name == 'DEF-weapon left':
                vg.name = 'DEF-hand.L'

# Select rig and pose mode
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = rig
rig.select_set(True)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# Export
bpy.ops.object.select_all(action='DESELECT')
for obj in data_to.objects:
    obj.select_set(True)
rig.select_set(True)

bpy.ops.export_scene.gltf(
    filepath="public/models/lara_perfect.glb",
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_animations=False
)
