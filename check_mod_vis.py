import bpy
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
lara = bpy.data.objects.get("Lara")

for mod in lara.modifiers:
    print(f"Name: {mod.name}, show_viewport: {mod.show_viewport}")
