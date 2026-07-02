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
        breast_bones = [b.name for b in arm.data.bones if "breast" in b.name.lower()]
        print(f"\n{label} ({path}):")
        print("Breast bones found:", breast_bones)
    except Exception as e:
        print(f"Error loading {label}: {e}")
