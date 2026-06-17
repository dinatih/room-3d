import bpy
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath='sources_backup/animations/Walking.fbx')

action = bpy.data.actions[0]
print(f"Action: {action.name}")

found_loc = False
# Try to find location fcurves manually in slots
try:
    for strip in action.slots[0].strips:
        for fc in strip.action.fcurves:
            if "location" in fc.data_path and "Hips" in fc.data_path:
                print(f"FCurve: {fc.data_path}[{fc.array_index}]")
                found_loc = True
                for i in range(5):
                    print(f"  Frame {i}: {fc.keyframe_points[i].co[1]}")
except Exception as e:
    print(f"Error accessing fcurves via slots: {e}")

if not found_loc:
    # Try older API if action.fcurves exists
    try:
        for fc in action.fcurves:
            if "location" in fc.data_path and "Hips" in fc.data_path:
                print(f"FCurve: {fc.data_path}[{fc.array_index}]")
                for i in range(5):
                    print(f"  Frame {i}: {fc.keyframe_points[i].co[1]}")
    except:
        pass
