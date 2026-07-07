import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# 1. Cleanup old mixamo vertex groups
for m in bpy.context.scene.objects:
    if m.type == 'MESH' and not m.name.startswith("WGT"):
        groups_to_remove = []
        for vg in m.vertex_groups:
            if not vg.name.startswith("DEF-"):
                groups_to_remove.append(vg)
        for vg in groups_to_remove:
            m.vertex_groups.remove(vg)

# 2. Fix the hair stretching
# If it stretches wildly, it's either an unapplied transform, or we shouldn't have assigned all vertices to DEF-spine.006.
# Wait! In the original model, 5_Hair2_1.0_0_0 HAD vertex groups!
# It was weighted to "head neck upper" AND "head neck lower" AND "spine upper"!
# When I cleared all vertex groups and set them to 1.0 for DEF-spine.006, I broke the ponytail bones!
# Ah! The original ponytail was deformed by the rig! We should use Data Transfer from Lara's head, OR just re-parent it properly.
# Since we cleared it, we lost the original weights. Let's just Data Transfer the weights from Lara to the hair!

hair2 = bpy.data.objects.get("5_Hair2_1.0_0_0")
lara = bpy.data.objects.get("Lara")

if hair2 and lara:
    # Remove all current groups
    hair2.vertex_groups.clear()
    
    # Add Data Transfer modifier
    mod = hair2.modifiers.new(name="DataTransfer", type='DATA_TRANSFER')
    mod.object = lara
    mod.use_vert_data = True
    mod.data_types_verts = {'VGROUP_WEIGHTS'}
    mod.vert_mapping = 'NEAREST'
    
    # Apply modifier
    bpy.context.view_layer.objects.active = hair2
    bpy.ops.object.modifier_apply(modifier=mod.name)

# Do the same for the other hair parts that I cleared!
for m_name in ["7_+Head|Hair.Classic_1.0_0_0", "7_-Head|Hair.FMV_1.0_0_0", "5_+Head|Glasses_1.0_0_0"]:
    obj = bpy.data.objects.get(m_name)
    if obj and lara:
        obj.vertex_groups.clear()
        mod = obj.modifiers.new(name="DataTransfer", type='DATA_TRANSFER')
        mod.object = lara
        mod.use_vert_data = True
        mod.data_types_verts = {'VGROUP_WEIGHTS'}
        mod.vert_mapping = 'NEAREST'
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)


bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
