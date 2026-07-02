import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
try:
    bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb")
    arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    print("\n=== SPINE AND HIPS BONES ===")
    for bone in arm.data.bones:
        name_lower = bone.name.lower()
        if any(x in name_lower for x in ['spine', 'hips', 'root', 'pelvis']):
            print(f"  {bone.name}:")
            print(f"    Parent: {bone.parent.name if bone.parent else 'None'}")
            print(f"    Head: {bone.head}")
            print(f"    Tail: {bone.tail}")
except Exception as e:
    print(f"Error checking spine: {e}")
