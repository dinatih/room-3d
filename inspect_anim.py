import bpy
import os

ANIM_GLB = "/home/dinatih/Projects/room-3d/public/media/sandbox/Xbot_official.glb"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=ANIM_GLB)
    
    for action in bpy.data.actions:
        print(f"ACTION: {action.name}")
        for fc in action.fcurves:
            print(f"TRACK: {fc.data_path}")

if __name__ == "__main__":
    main()
