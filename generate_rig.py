import bpy
import sys

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_fixed.blend")

# 1. Generate Rigify Rig
armature = bpy.data.objects.get("metarig")
if not armature:
    sys.exit(1)

bpy.context.view_layer.objects.active = armature
bpy.ops.object.mode_set(mode='OBJECT')
try:
    bpy.ops.pose.rigify_generate()
except Exception as e:
    print(f"Rigify generate failed: {e}")

# The generated rig is usually named "rig"
new_rig = bpy.data.objects.get("rig")
old_rig = bpy.data.objects.get("lara_rig") # Or whatever it was named

if new_rig:
    print("Rig generated successfully.")
    
    # Let's find the meshes and parent them to the new rig
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and not obj.name.startswith("WGT")]
    
    # Delete old rig if it exists
    if old_rig and old_rig != new_rig:
        bpy.data.objects.remove(old_rig, do_unlink=True)
        
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
        filepath="public/models/lara_perfect_new.glb",
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_animations=False
    )
    print("Exported to lara_perfect_new.glb")
else:
    print("Failed to find generated rig.")

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_generated.blend")
