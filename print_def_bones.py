import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
print("DEF bones in rig:")
for b in rig.data.bones:
    if b.name.startswith("DEF-"):
        print(f" - {b.name}")
