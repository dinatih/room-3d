import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

for m_name in ["7_+Head|Hair.Classic_1.0_0_0", "5_Hair2_1.0_0_0", "7_-Head|Hair.FMV_1.0_0_0", "5_+Head|Glasses_1.0_0_0"]:
    obj = bpy.data.objects.get(m_name)
    if obj:
        # Remove all existing vertex groups to prevent conflicting weights
        obj.vertex_groups.clear()
        
        # Create the proper target bone group
        target_group = "DEF-head"
        if m_name == "5_+Head|Glasses_1.0_0_0":
            target_group = "DEF-glasses"
            # Actually, if there is no DEF-glasses in the rig, let's just use DEF-head!
            rig = bpy.data.objects.get("rig")
            if rig and "DEF-glasses" not in rig.data.bones:
                target_group = "DEF-head"
        
        vg = obj.vertex_groups.new(name=target_group)
        
        # Assign 100% weight to all vertices
        verts = [v.index for v in obj.data.vertices]
        vg.add(verts, 1.0, 'REPLACE')

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
