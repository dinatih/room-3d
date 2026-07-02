import bpy

def get_bones(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
    return sorted([b.name for b in arm.data.bones])

b1 = get_bones("/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb")
b2 = get_bones("/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb")

print("\nBones in Bikini but not in Scoop:")
print(set(b1) - set(b2))

print("\nBones in Scoop but not in Bikini:")
print(set(b2) - set(b1))
