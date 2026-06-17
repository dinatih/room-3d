import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
anim_dir = "/home/dinatih/Projects/room-3d/sources_backup/animations"

if os.path.exists(anim_dir):
    for f in sorted(os.listdir(anim_dir)):
        if f.endswith(".fbx"):
            path = os.path.join(anim_dir, f)
            bpy.ops.wm.read_factory_settings(use_empty=True)
            try:
                bpy.ops.import_scene.fbx(filepath=path)
                if bpy.data.actions:
                    action = bpy.data.actions[0]
                    if len(action.layers) > 0:
                        strip = action.layers[0].strips[0]
                        for cb in strip.channelbags:
                            hips_loc = [fc for fc in cb.fcurves if "Hips" in fc.data_path and "location" in fc.data_path]
                            hips_rot = [fc for fc in cb.fcurves if "Hips" in fc.data_path and "rotation" in fc.data_path]
                            print(f"{f:30s} | Hips Loc curves: {len(hips_loc)} | Hips Rot curves: {len(hips_rot)}")
                            if hips_loc:
                                print(f"    Loc keys count: {[len(fc.keyframe_points) for fc in hips_loc]}")
                            if hips_rot:
                                print(f"    Rot keys count: {[len(fc.keyframe_points) for fc in hips_rot]}")
            except Exception as e:
                print(f"Error reading {f}: {e}")
