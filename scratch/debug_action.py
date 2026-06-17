import bpy
import sys

def main():
    path = sys.argv[-2]
    
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    
    for action in bpy.data.actions:
        print(f"Action: {action.name}")
        print(f"Attributes: {dir(action)}")
        if hasattr(action, 'fcurves'):
             print(f"Has fcurves, count: {len(action.fcurves)}")
        if hasattr(action, 'curves'):
             print(f"Has curves, count: {len(action.curves)}")

if __name__ == "__main__":
    main()
