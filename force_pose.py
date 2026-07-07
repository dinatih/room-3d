import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
if rig:
    # Deselect everything
    bpy.ops.object.select_all(action='DESELECT')
    
    # Make rig active and select it
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    
    # Switch to Pose mode
    bpy.ops.object.mode_set(mode='POSE')
    
    # Select all bones so they know they are in pose mode
    bpy.ops.pose.select_all(action='SELECT')
    
# Save
bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
