import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
if rig and hasattr(rig.data, 'collections'):
    for coll in rig.data.collections:
        if "Tweak" in coll.name:
            coll.is_visible = False
            print(f"Hid collection: {coll.name}")

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
