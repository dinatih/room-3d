import os
import zipfile
import bpy
import struct
import json

# Clean slate
bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/basic.zip"
extract_dir = "/home/dinatih/Projects/room-3d/scratch/basic_extracted"

if not os.path.exists(zip_path):
    print(f"Error: Zip file not found at {zip_path}")
    exit(1)

# Extract ZIP
if not os.path.exists(extract_dir):
    os.makedirs(extract_dir)

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_dir)
    print(f"Extracted zip to {extract_dir}")

fbx_files = [f for f in os.listdir(extract_dir) if f.endswith(".fbx")]
print(f"Found {len(fbx_files)} FBX files in zip.")

for f in fbx_files:
    path = os.path.join(extract_dir, f)
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
                    
                    # Read all values for hips location
                    loc_keys = []
                    if hips_loc:
                        # Find range of values
                        x_pts = [kp.co[1] for kp in hips_loc[0].keyframe_points] if len(hips_loc) > 0 else [0]
                        y_pts = [kp.co[1] for kp in hips_loc[1].keyframe_points] if len(hips_loc) > 1 else [0]
                        z_pts = [kp.co[1] for kp in hips_loc[2].keyframe_points] if len(hips_loc) > 2 else [0]
                        
                        dx = max(x_pts) - min(x_pts)
                        dy = max(y_pts) - min(y_pts)
                        dz = max(z_pts) - min(z_pts)
                        
                        num_keys = len(x_pts)
                        
                        # Is it non-in-place?
                        # If horizontal displacement (X or Z) is significant (> 10 cm or > 0.1 m depending on scale)
                        # Let's check max horizontal displacement
                        is_non_in_place = (dx > 10.0 or dz > 10.0) or (dx > 0.1 or dz > 0.1) and (max(x_pts) > 2.0 or max(z_pts) > 2.0)
                        
                        # Let's print details
                        print(f"\nFBX file: {f}")
                        print(f"  Hips Location track: {num_keys} keys")
                        print(f"  X Range: [{min(x_pts):.4f} to {max(x_pts):.4f}] (Diff: {dx:.4f})")
                        print(f"  Y Range: [{min(y_pts):.4f} to {max(y_pts):.4f}] (Diff: {dy:.4f})")
                        print(f"  Z Range: [{min(z_pts):.4f} to {max(z_pts):.4f}] (Diff: {dz:.4f})")
                        
                        if is_non_in_place:
                            print(f"  --> CLASSIFICATION: NON-IN-PLACE (déplacement détecté)")
                        else:
                            print(f"  --> CLASSIFICATION: IN-PLACE (sur place ou fixe)")
                    else:
                        print(f"\nFBX file: {f} - No Hips location track found!")
        else:
            print(f"\nFBX file: {f} - No action found!")
    except Exception as e:
        print(f"Error reading {f}: {e}")
