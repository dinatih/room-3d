import bpy

def print_foot_locals(path, label):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=path)
        arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        print(f"\n=== FOOT LOCALS FOR {label} ===")
        # Print all bone names and details containing foot, toe, leg, ankle
        for bone in arm.data.bones:
            name_lower = bone.name.lower()
            if any(x in name_lower for x in ['foot', 'toe', 'leg', 'ankle', 'calf']):
                print(f"  {bone.name}:")
                print(f"    Parent: {bone.parent.name if bone.parent else 'None'}")
                print(f"    Head: {bone.head}")
                print(f"    Tail: {bone.tail}")
    except Exception as e:
        print(f"Error checking {label}: {e}")

print_foot_locals("/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb", "lara_native")
print_foot_locals("/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb", "01_bikini")
