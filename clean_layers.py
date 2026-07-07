import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
if rig and hasattr(rig.data, "collections"):
    hide_keywords = ["(FK)", "(Tweak)", "(Secondary)", "(Detail)"]
    
    for coll in rig.data.collections:
        if any(kw in coll.name for kw in hide_keywords):
            coll.is_visible = False
            
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.select_all(action='DESELECT')
        
bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
