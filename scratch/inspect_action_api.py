import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
path = "/home/dinatih/Projects/room-3d/sources_backup/animations/Walking.fbx"
if os.path.exists(path):
    bpy.ops.import_scene.fbx(filepath=path)
    if bpy.data.actions:
        action = bpy.data.actions[0]
        print(f"Action type: {type(action)}")
        print(f"Attributes: {dir(action)}")
        if hasattr(action, 'fcurves'):
            print(f"Has fcurves: {len(action.fcurves)}")
        # Check Blender 5 animation data paths
        if hasattr(action, 'groups'):
            print(f"Has groups: {len(action.groups)}")
        if hasattr(action, 'curves'):
            print(f"Has curves: {len(action.curves)}")
