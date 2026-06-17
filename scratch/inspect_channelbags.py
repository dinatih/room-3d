import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
path = "/home/dinatih/Projects/room-3d/sources_backup/animations/Happy Walk.fbx"
if os.path.exists(path):
    bpy.ops.import_scene.fbx(filepath=path)
    if bpy.data.actions:
        action = bpy.data.actions[0]
        layer = action.layers[0]
        if len(layer.strips) > 0:
            strip = layer.strips[0]
            for idx, cb in enumerate(strip.channelbags):
                print(f"Happy Walk - fcurves count: {len(cb.fcurves)}")
                hips_curves = [fc for fc in cb.fcurves if "Hips" in fc.data_path]
                print(f"Hips curves count: {len(hips_curves)}")
                for fc in hips_curves:
                    print(f"    {fc.data_path} (axis {fc.array_index}) : {len(fc.keyframe_points)} keys")
