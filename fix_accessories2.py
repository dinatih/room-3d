import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")

mapping = {
    'head neck upper': 'DEF-head',
    'head neck lower': 'DEF-spine.006', # or DEF-neck, but there is no DEF-neck! Let's use DEF-spine.006 (highest spine)
    'DEF-spine.003': 'DEF-spine.005', # If DEF-spine.003 is too low, maybe the chest is DEF-spine.005
}

meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and obj.name != "Lara" and not obj.name.startswith("WGT")]
for m in meshes:
    # 1. Fix modifiers
    for mod in reversed(m.modifiers):
        if mod.type == 'ARMATURE':
            m.modifiers.remove(mod)
    
    mod = m.modifiers.new("Armature", 'ARMATURE')
    mod.object = rig
    
    # 2. Fix Vertex Groups
    for vg in m.vertex_groups:
        if vg.name in mapping:
            vg.name = mapping[vg.name]
            
    # For Backpack, make sure it has the highest spine if it doesn't move with the chest
    if m.name == "5_BackPack_1.0_0_0":
        # Let's just parent the backpack directly to the chest bone if weight painting is failing
        # Or better, just rename all its vertex groups to 'DEF-spine.006' (upper chest)
        for vg in m.vertex_groups:
            if "spine" in vg.name:
                vg.name = "DEF-spine.006"

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
