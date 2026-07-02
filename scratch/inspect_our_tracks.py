import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/public/media/glb-animations/woman-solo.glb")

print("\nWOMAN-SOLO ACTIONS:")
for act in bpy.data.actions:
    print("Action name:", act.name)
    # Check if there are pose markers or curves
    for fcurve in act.fcurves[:10]:
        print(f"FCurve: {fcurve.data_path}, index: {fcurve.array_index}")
        # Print the first 5 keyframe points
        for kp in fcurve.keyframe_points[:5]:
            print(f"  Frame: {kp.co[0]}, Value: {kp.co[1]}")
