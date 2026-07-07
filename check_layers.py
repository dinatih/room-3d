import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
if rig:
    visible_layers = [i for i, v in enumerate(rig.data.collections) if v.is_visible]
    # Wait, in Blender 4.0+ bone collections are used instead of layers!
    if hasattr(rig.data, "collections"):
        for coll in rig.data.collections:
            print(f"Collection {coll.name}: is_visible={coll.is_visible}")
    else:
        for i, layer in enumerate(rig.data.layers):
            if layer:
                print(f"Layer {i} is visible")
