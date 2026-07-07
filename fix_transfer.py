import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

lara = bpy.data.objects.get("Lara")
rig = bpy.data.objects.get("rig")

if lara and rig:
    # Proxy already exists? No, I deleted it. Let's make it again.
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
    
    bpy.ops.object.select_all(action='DESELECT')
    proxy.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    
    # Transfer using Modifier
    bpy.ops.object.select_all(action='DESELECT')
    lara.select_set(True)
    bpy.context.view_layer.objects.active = lara
    
    dt = lara.modifiers.new(name="DataTransfer", type='DATA_TRANSFER')
    dt.object = proxy
    dt.use_vert_data = True
    dt.data_types_verts = {'VGROUP_WEIGHTS'}
    dt.vert_mapping = 'POLYINTERP_NEAREST'
    
    # CRITICAL: Generate vertex groups
    bpy.ops.object.datalayout_transfer(modifier="DataTransfer")
    
    bpy.ops.object.modifier_apply(modifier="DataTransfer")
    
    bpy.data.objects.remove(proxy)
    
    bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
    print(f"Lara VGs after fix: {len(lara.vertex_groups)}")
