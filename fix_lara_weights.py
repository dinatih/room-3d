import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

lara = bpy.data.objects.get("Lara")
rig = bpy.data.objects.get("rig")

if lara and rig:
    # 1. Clear ALL vertex groups on Lara to destroy phantom weights
    lara.vertex_groups.clear()
    
    # 2. Make sure pelvis bones are still not deforming (just in case)
    for b in ["DEF-pelvis.L", "DEF-pelvis.R"]:
        bone = rig.data.bones.get(b)
        if bone:
            bone.use_deform = False

    # 3. Rerun Automatic Weights from scratch
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    lara.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    
    # 4. Clean up selections and put back in Pose Mode
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='DESELECT')

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
