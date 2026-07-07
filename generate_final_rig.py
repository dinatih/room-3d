import bpy
import sys

# Open the validated metarig blend file
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend")

# 1. Generate Rigify Rig
armature = bpy.data.objects.get("metarig")
if not armature:
    print("Metarig not found!")
    sys.exit(1)

bpy.context.view_layer.objects.active = armature
bpy.ops.object.mode_set(mode='OBJECT')
try:
    bpy.ops.pose.rigify_generate()
except Exception as e:
    print(f"Rigify generate failed: {e}")

# The generated rig is usually named "rig"
new_rig = bpy.data.objects.get("rig")
old_rig = bpy.data.objects.get("lara_rig") # from previous if it existed, though in this blend it might just be 'rig'

if new_rig:
    print("Rig generated successfully.")
    
    # Let's find the meshes to parent them to the new rig
    # We want meshes that do not start with WGT (widgets) and are not hidden
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.name.startswith("WGT")]
    
    # Try to clean up any old rig if it exists and isn't the newly generated one
    for obj in bpy.context.scene.objects:
        if obj.type == 'ARMATURE' and obj != new_rig and obj != armature:
            bpy.data.objects.remove(obj, do_unlink=True)
            
    # Unparent meshes and re-parent to new_rig with automatic weights
    bpy.ops.object.select_all(action='DESELECT')
    for m in meshes:
        m.select_set(True)
    new_rig.select_set(True)
    bpy.context.view_layer.objects.active = new_rig
    
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    
    print("Meshes parented with automatic weights.")
    
    # Export to GLB
    # We only want to export the meshes and the new rig
    bpy.ops.object.select_all(action='DESELECT')
    for m in meshes:
        m.select_set(True)
    new_rig.select_set(True)
    
    bpy.ops.export_scene.gltf(
        filepath="public/models/lara_perfect.glb",
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_animations=False
    )
    print("Exported to lara_perfect.glb")
else:
    print("Failed to find generated rig.")

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
