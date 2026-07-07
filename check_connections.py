import bpy
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
arm = bpy.data.objects.get("metarig")
for b in ["spine.001", "spine.002", "spine.003", "spine.004", "shoulder.L", "shoulder.R", "breast.L", "breast.R"]:
    eb = arm.data.bones.get(b)
    if eb:
        print(f"{b}: parent={eb.parent.name if eb.parent else 'None'}, use_connect={eb.use_connect}")
