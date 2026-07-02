import bpy

def check_shoulders(path, label):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.gltf(filepath=path)
        arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        print(f"\n=== SHOULDERS FOR {label} ===")
        for b in arm.data.bones:
            if "shoulder" in b.name.lower() or "clavicle" in b.name.lower() or "upperarm" in b.name.lower() or "leftarm" in b.name.lower():
                print(f"  {b.name}:")
                print(f"    Parent: {b.parent.name if b.parent else 'None'}")
                print(f"    Head: {b.head}")
                print(f"    Tail: {b.tail}")
                print(f"    Children: {[c.name for c in b.children]}")
    except Exception as e:
        print(f"Error checking {label}: {e}")

check_shoulders("/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb", "01_bikini")
check_shoulders("/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb", "07_scoop")
