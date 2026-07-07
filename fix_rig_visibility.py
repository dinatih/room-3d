import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
if rig:
    # Ensure armature is visible
    rig.hide_viewport = False
    rig.hide_get() # just to refresh
    rig.hide_render = False
    
    # Enable "In Front" so we can see it through the mesh
    rig.show_in_front = True
    
    # In Blender 4.0+, Rigify uses Bone Collections
    if hasattr(rig.data, 'collections'):
        for coll in rig.data.collections:
            coll.is_visible = True
            
    # Also if there are traditional layers
    if hasattr(rig.data, 'layers'):
        for i in range(32):
            rig.data.layers[i] = True
            
    # Make rig the active object
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
