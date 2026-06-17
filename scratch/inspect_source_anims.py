import bpy
import os

# Clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)

anim_dir = "/home/dinatih/Projects/room-3d/sources_backup/animations"
files = ["Walking.fbx", "Happy Walk.fbx"]

for f in files:
    path = os.path.join(anim_dir, f)
    if os.path.exists(path):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=path)
        
        # Check action
        action = bpy.data.actions[0] if bpy.data.actions else None
        print(f"\n--- {f} ---")
        if action:
            print(f"Action Name: {action.name}")
            print(f"Total F-Curves: {len(action.fcurves)}")
            
            # Print F-Curves for Hips
            hips_curves = [fc for fc in action.fcurves if "Hips" in fc.data_path]
            print(f"Hips F-Curves: {len(hips_curves)}")
            for fc in hips_curves:
                print(f"  {fc.data_path} (axis {fc.array_index}) : {len(fc.keyframe_points)} keys")
        else:
            print("No action found!")
    else:
        print(f"File not found: {path}")
