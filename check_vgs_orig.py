import bpy
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
lara = bpy.data.objects.get("Lara")
vg_names = [vg.name for vg in lara.vertex_groups]
print(f"LARA VERTEX GROUPS: {vg_names[:20]} ... (total {len(vg_names)})")
