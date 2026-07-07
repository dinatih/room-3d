import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# Hide and unselect WGTS
wgts = bpy.data.collections.get("WGTS_rig")
if wgts:
    wgts.hide_viewport = True
    wgts.hide_render = True
    wgts.hide_select = True

rig = bpy.data.objects.get("rig")
if rig:
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
