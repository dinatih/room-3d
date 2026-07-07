import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")

if rig:
    # 1. Hide DEF, ORG, MCH bone collections to clean up the viewport
    if hasattr(rig.data, 'collections'):
        for coll in rig.data.collections:
            if coll.name in ["DEF", "ORG", "MCH", "Root"]:
                coll.is_visible = False
            # Also hide Tweaks just in case
            if "Tweak" in coll.name:
                coll.is_visible = False

    # 2. Fix parenting completely
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.name.startswith("WGT")]
    for m in meshes:
        # Parent object
        m.parent = rig
        
        # Remove ALL existing armature modifiers
        mods_to_remove = [mod for mod in m.modifiers if mod.type == 'ARMATURE']
        for mod in mods_to_remove:
            m.modifiers.remove(mod)
            
        # Add exactly one fresh armature modifier
        arm_mod = m.modifiers.new(name="Armature", type='ARMATURE')
        arm_mod.object = rig
        # Rigify uses vertex groups, so use_vertex_groups must be True (default is True)
        arm_mod.use_vertex_groups = True
        arm_mod.use_bone_envelopes = False

    print("Rig cleaned up and meshes parented perfectly.")
    
    # Select rig and enter pose mode
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# Export
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
