import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

obj = bpy.data.objects.get("Lara")

if obj:
    vg_spine = obj.vertex_groups.get("DEF-spine")
    if not vg_spine:
        vg_spine = obj.vertex_groups.new(name="DEF-spine")
        
    vg_l = obj.vertex_groups.get("DEF-pelvis.L")
    vg_r = obj.vertex_groups.get("DEF-pelvis.R")
    
    # We will manually move weights from pelvis.L and pelvis.R into spine
    
    # Get indices
    idx_spine = vg_spine.index
    idx_l = vg_l.index if vg_l else -1
    idx_r = vg_r.index if vg_r else -1
    
    for v in obj.data.vertices:
        weight_to_add = 0.0
        
        for g in v.groups:
            if g.group == idx_l:
                weight_to_add += g.weight
            elif g.group == idx_r:
                weight_to_add += g.weight
                
        if weight_to_add > 0.0:
            # Check if it already has spine weight
            current_spine_weight = 0.0
            for g in v.groups:
                if g.group == idx_spine:
                    current_spine_weight = g.weight
            
            # Add to spine
            vg_spine.add([v.index], current_spine_weight + weight_to_add, 'REPLACE')
            
    # Now remove the bad groups
    if vg_l:
        obj.vertex_groups.remove(vg_l)
    if vg_r:
        obj.vertex_groups.remove(vg_r)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
