import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

lara = bpy.data.objects.get("Lara")

if lara:
    print(f"Lara vertex groups count: {len(lara.vertex_groups)}")
    for vg in lara.vertex_groups:
        print(f"  - {vg.name}")
else:
    print("Lara not found")
