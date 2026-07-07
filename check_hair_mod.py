import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

obj = bpy.data.objects.get("5_Hair2_1.0_0_0")
if obj:
    for mod in obj.modifiers:
        if mod.type == 'ARMATURE':
            print(f"show_viewport: {mod.show_viewport}, show_render: {mod.show_render}")
            
    # Also check if there are shape keys or something overriding it?
    if obj.data.shape_keys:
        print("HAS SHAPE KEYS")

