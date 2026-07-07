import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

for m_name in ["7_+Head|Hair.Classic_1.0_0_0", "5_Hair2_1.0_0_0", "5_+Head|Glasses_1.0_0_0"]:
    obj = bpy.data.objects.get(m_name)
    if obj:
        print(f"[{obj.name}] VGs:")
        for vg in obj.vertex_groups:
            print(f"  - {vg.name}")
        
        # Check if the Armature modifier is there
        mods = [mod for mod in obj.modifiers if mod.type == 'ARMATURE']
        print(f"  - Armatures: {[mod.object.name if mod.object else None for mod in mods]}")
        
        # Also let's just force all vertices to DEF-head!
        # Just in case some vertices had 0 weight, let's assign 1.0 weight to DEF-head for all vertices!
        
        vg = obj.vertex_groups.get("DEF-head")
        if not vg:
            vg = obj.vertex_groups.new(name="DEF-head")
        
        verts = [v.index for v in obj.data.vertices]
        vg.add(verts, 1.0, 'REPLACE')

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
