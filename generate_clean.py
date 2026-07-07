import bpy

# 1. Start from the base file which has the pristine meshes and the updated metarig
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend")

# 2. Generate the rig
armature = bpy.data.objects.get("metarig")
bpy.context.view_layer.objects.active = armature
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.pose.rigify_generate()

rig = bpy.data.objects.get("rig")

# Hide the metarig
armature.hide_viewport = True
armature.hide_render = True

# 3. Clean visibility (hide DEF, ORG, MCH, Tweak)
if hasattr(rig.data, 'collections'):
    for coll in rig.data.collections:
        if coll.name in ["DEF", "ORG", "MCH", "Root"]:
            coll.is_visible = False
        if "Tweak" in coll.name:
            coll.is_visible = False

# Ensure WGTS_rig is included in view layer
def unexclude_all(lc):
    if "WGTS" in lc.name:
        lc.exclude = False
    for child in lc.children:
        unexclude_all(child)

unexclude_all(bpy.context.view_layer.layer_collection)

# 4. Parent meshes to the new rig using existing vertex groups
meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.name.startswith("WGT")]
for m in meshes:
    m.parent = rig
    
    # Remove old armature modifiers
    mods_to_remove = [mod for mod in m.modifiers if mod.type == 'ARMATURE']
    for mod in mods_to_remove:
        m.modifiers.remove(mod)
        
    # Add fresh armature modifier
    arm_mod = m.modifiers.new(name="Armature", type='ARMATURE')
    arm_mod.object = rig
    arm_mod.use_vertex_groups = True
    
    # Rename custom vertex groups so they match Rigify bones
    for vg in m.vertex_groups:
        if vg.name == 'spine upper':
            vg.name = 'DEF-spine.003'
        elif vg.name == 'DEF-weapon right':
            vg.name = 'DEF-hand.R'
        elif vg.name == 'DEF-weapon left':
            vg.name = 'DEF-hand.L'

# 5. Clean up the scene (select rig)
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = rig
rig.select_set(True)

# Save as final
bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# 6. Export to GLB
bpy.ops.object.select_all(action='DESELECT')
for m in meshes:
    m.select_set(True)
rig.select_set(True)

bpy.ops.export_scene.gltf(
    filepath="public/models/lara_perfect.glb",
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_animations=False
)
