import bpy

def print_bone_locals(path, label):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=path)
        arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        print(f"\n=== BONE LOCALS FOR {label} ===")
        # Print armature coordinates
        print(f"Armature object position: {arm.location}")
        for bname in ['breast_left_base', 'breast_right_base', 'mixamorig_spine_upper']:
            bone = arm.data.bones.get(bname)
            if bone:
                print(f"  {bname}:")
                print(f"    Parent: {bone.parent.name if bone.parent else 'None'}")
                print(f"    Head local: {bone.head}")
                print(f"    Tail local: {bone.tail}")
                print(f"    Center: {(bone.head + bone.tail)/2}")
            else:
                print(f"  {bname}: Not found!")
    except Exception as e:
        print(f"Error checking {label}: {e}")

print_bone_locals("/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb", "lara_native")
print_bone_locals("/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb", "01_bikini")
