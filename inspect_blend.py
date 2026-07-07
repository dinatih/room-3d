import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_fixed.blend")

for obj in bpy.context.scene.objects:
    print(f"Object: {obj.name}, Type: {obj.type}, Parent: {obj.parent.name if obj.parent else 'None'}")
    if obj.type == 'MESH':
        modifiers = [m.name for m in obj.modifiers]
        print(f"  Modifiers: {modifiers}")

