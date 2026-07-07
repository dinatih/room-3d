import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
print(f"Rig type: {rig.type if rig else 'None'}")
print(f"Rig mode: {rig.mode if rig else 'None'}")

# Print a few objects
for obj in bpy.context.scene.objects:
    if not obj.name.startswith("WGT"):
        print(f"Object: {obj.name}, Type: {obj.type}, Hide: {obj.hide_get()}, Selectable: {not obj.hide_select}")
