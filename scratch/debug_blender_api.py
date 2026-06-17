import bpy
import sys

# DEBUG ACTION DATA IN BLENDER 5.1
def clean_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

clean_scene()
bpy.ops.import_scene.fbx(filepath="/home/dinatih/Projects/room-3d/sources_backup/animations/walking.fbx")
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
if arm.animation_data and arm.animation_data.action:
    action = arm.animation_data.action
    print(f"Action: {action.name}")
    print(f"Attributes: {dir(action)}")
    # Check for likely candidates
    for attr in ["fcurves", "bindings", "curves", "channels", "animation", "data"]:
        if hasattr(action, attr):
            print(f"  HAS {attr}: {type(getattr(action, attr))}")
