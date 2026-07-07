import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# Ensure WGTS_rig is included in the view layer
wgts_coll = bpy.data.collections.get("WGTS_rig")
if wgts_coll:
    # Find it in the view layer and ensure exclude is False
    # The checkbox in outliner is "exclude"
    def unexclude_coll(layer_collection, target_coll):
        if layer_collection.collection == target_coll:
            layer_collection.exclude = False
            return True
        for child in layer_collection.children:
            if unexclude_coll(child, target_coll):
                return True
        return False

    view_layer = bpy.context.view_layer
    unexclude_coll(view_layer.layer_collection, wgts_coll)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
