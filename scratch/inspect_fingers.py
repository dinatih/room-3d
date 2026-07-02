import bpy

def check_fingers(path, label):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=path)
        arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        print(f"\n=== FINGERS FOR {label} ===")
        finger_bones = [b.name for b in arm.data.bones if "finger" in b.name.lower() or "thumb" in b.name.lower() or "index" in b.name.lower() or "pinky" in b.name.lower() or "middle" in b.name.lower() or "ring" in b.name.lower()]
        print("Finger bones:", finger_bones[:15]) # print first 15
        print("Total finger bones:", len(finger_bones))
    except Exception as e:
        print(f"Error checking {label}: {e}")

check_fingers("/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb", "01_bikini")
check_fingers("/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb", "07_scoop")
