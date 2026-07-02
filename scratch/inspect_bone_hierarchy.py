import bpy

def print_bone_path(path, label):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=path)
        arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        print(f"\n=== BONE PATHS FOR {label} ===")
        for bname in ['breast_left_base', 'breast_right_base', 'mixamorig_spine_upper', 'spine_3']:
            bone = arm.data.bones.get(bname)
            if bone:
                path_str = bone.name
                curr = bone.parent
                while curr:
                    path_str = f"{curr.name} -> {path_str}"
                    curr = curr.parent
                print(f"  {bname}: {path_str}")
            else:
                print(f"  {bname}: Not found!")
    except Exception as e:
        print(f"Error checking {label}: {e}")

print_bone_path("/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb", "lara_native")
print_bone_path("/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb", "01_bikini")
