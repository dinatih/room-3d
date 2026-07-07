import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

obj = bpy.data.objects.get("5_Hair2_1.0_0_0")
if obj:
    print(f"Parent: {obj.parent.name if obj.parent else None}")
    for mod in obj.modifiers:
        print(f"Modifier: {mod.name}, type: {mod.type}")
        if mod.type == 'ARMATURE':
            print(f"  -> target: {mod.object.name if mod.object else None}")
            print(f"  -> vertex group: {mod.vertex_group}")
    print("Vertex groups:")
    for vg in obj.vertex_groups:
        print(f"  - {vg.name}")
        # let's check weights for vertex 0
        try:
            print(f"    v0 weight: {vg.weight(0)}")
        except:
            print(f"    v0 weight: No weight")
