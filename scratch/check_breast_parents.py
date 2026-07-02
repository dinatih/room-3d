import bpy

for path, label in [
    ("/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb", "07_scoop"),
    ("/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb", "lara_native"),
    ("/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb", "01_bikini")
]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=path)
        arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        print(f"\n{label} ({path}):")
        for bone_name in ['breast_left_base', 'breast_right_base']:
            bone = arm.data.bones.get(bone_name)
            if bone:
                print(f"  {bone_name}: parent={bone.parent.name if bone.parent else 'None'}")
            else:
                print(f"  {bone_name}: Not found!")
    except Exception as e:
        print(f"Error loading {label}: {e}")
