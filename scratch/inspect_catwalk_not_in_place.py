import bpy
import os

# Clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)

path = "/home/dinatih/Projects/room-3d/sources_backup/Catwalk Walking not in place.fbx"

if os.path.exists(path):
    bpy.ops.import_scene.fbx(filepath=path)
    if bpy.data.actions:
        action = bpy.data.actions[0]
        layer = action.layers[0]
        if len(layer.strips) > 0:
            strip = layer.strips[0]
            for cb in strip.channelbags:
                hips_loc = [fc for fc in cb.fcurves if "Hips" in fc.data_path and "location" in fc.data_path]
                hips_rot = [fc for fc in cb.fcurves if "Hips" in fc.data_path and "rotation" in fc.data_path]
                
                print(f"\n--- Catwalk Walking not in place.fbx ---")
                print(f"Hips Location tracks: {len(hips_loc)}")
                print(f"Hips Rotation tracks: {len(hips_rot)}")
                
                if hips_loc:
                    x_pts = [kp.co[1] for kp in hips_loc[0].keyframe_points]
                    y_pts = [kp.co[1] for kp in hips_loc[1].keyframe_points]
                    z_pts = [kp.co[1] for kp in hips_loc[2].keyframe_points]
                    
                    dx = max(x_pts) - min(x_pts)
                    dy = max(y_pts) - min(y_pts)
                    dz = max(z_pts) - min(z_pts)
                    
                    print(f"Keyframe count: {len(x_pts)}")
                    print(f"X Range: [{min(x_pts):.4f} to {max(x_pts):.4f}] (Diff: {dx:.4f})")
                    print(f"Y Range: [{min(y_pts):.4f} to {max(y_pts):.4f}] (Diff: {dy:.4f})")
                    print(f"Z Range: [{min(z_pts):.4f} to {max(z_pts):.4f}] (Diff: {dz:.4f})")
                    
                    # Read first 5 values of Y displacement to see bobbing
                    print(f"First 5 Y values: {y_pts[:5]}")
                    
                if hips_rot:
                    # Let's print the keyframe count of rotations
                    r_pts = [kp.co[1] for kp in hips_rot[0].keyframe_points]
                    print(f"Rotation keyframe count: {len(r_pts)}")
else:
    print(f"File not found: {path}")
