import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

for m_name in ["7_+Head|Hair.Classic_1.0_0_0", "5_Hair2_1.0_0_0", "7_-Head|Hair.FMV_1.0_0_0", "5_+Head|Glasses_1.0_0_0"]:
    obj = bpy.data.objects.get(m_name)
    if obj:
        # Rename DEF-head to DEF-spine.006
        vg = obj.vertex_groups.get("DEF-head")
        if vg:
            vg.name = "DEF-spine.006"

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
