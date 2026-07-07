import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

lara = bpy.data.objects.get("Lara")
rig = bpy.data.objects.get("rig")

if lara and rig:
    print("Starting Voxel Heat Skinning workaround (with proper operator transfer)...")
    
    lara.vertex_groups.clear()
    
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    lara.select_set(True)
    bpy.context.view_layer.objects.active = lara
    bpy.ops.object.duplicate()
    proxy = bpy.context.active_object
    proxy.name = "Lara_Proxy"
    
    remesh = proxy.modifiers.new(name="Remesh", type='REMESH')
    remesh.mode = 'VOXEL'
    remesh.voxel_size = 0.015
    bpy.ops.object.modifier_apply(modifier="Remesh")
    print("Remesh applied.")
    
    bpy.ops.object.select_all(action='DESELECT')
    proxy.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    print("Automatic weights applied to Proxy.")
    
    # 5. Transfer the perfect weights from Proxy back to the original Lara using OPERATOR
    bpy.ops.object.select_all(action='DESELECT')
    proxy.select_set(True) # Source
    lara.select_set(True)  # Destination
    bpy.context.view_layer.objects.active = lara # Active is destination
    
    # This operator creates vertex groups and transfers weights!
    bpy.ops.object.data_transfer(
        use_reverse_transfer=False, 
        data_type='VGROUP_WEIGHTS', 
        use_create=True, 
        vert_mapping='POLYINTERP_NEAREST', 
        layers_select_src='ALL', 
        layers_select_dst='NAME'
    )
    print("Weights transferred to Lara.")
    
    # Make sure Lara is parented to the rig
    bpy.ops.object.select_all(action='DESELECT')
    lara.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE')
    
    # Clean up
    bpy.data.objects.remove(proxy)
    
    for b in ["DEF-pelvis.L", "DEF-pelvis.R"]:
        bone = rig.data.bones.get(b)
        if bone:
            bone.use_deform = False

    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='POSE')

    bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
    print("Finished successfully.")
