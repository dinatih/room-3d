import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# Ensure WGTS_rig collection exists and is HIDDEN but NOT EXCLUDED
wgts = bpy.data.collections.get("WGTS_rig")
if wgts:
    wgts.hide_viewport = True
    wgts.hide_render = True
    wgts.hide_select = True # make sure it's unselectable

# Set the active object to the rig and enter pose mode
rig = bpy.data.objects.get("rig")
if rig:
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    
    # Hide the metarig completely
    meta = bpy.data.objects.get("metarig")
    if meta:
        meta.hide_viewport = True
        meta.hide_render = True
        meta.hide_select = True

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
