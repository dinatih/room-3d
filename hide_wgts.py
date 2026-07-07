import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")

wgts = bpy.data.collections.get("WGTS_rig")
if not wgts:
    wgts = bpy.data.collections.new("WGTS_rig")
    bpy.context.scene.collection.children.link(wgts)

for obj in bpy.data.objects:
    if obj.name.startswith("WGT"):
        for coll in obj.users_collection:
            coll.objects.unlink(obj)
        wgts.objects.link(obj)
        obj.hide_viewport = True
        obj.hide_render = True
        obj.hide_select = True
        obj.hide_set(True)

layer_collection = bpy.context.view_layer.layer_collection.children.get("WGTS_rig")
if layer_collection:
    layer_collection.exclude = True

bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT')
if rig:
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    rig.show_in_front = True
    
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='DESELECT')

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
