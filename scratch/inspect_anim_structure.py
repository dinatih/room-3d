import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/tmp_anim_extract/O5ETGWT4A4E27OM610Y9HSVUH.glb")
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
print("BONES:")
for bone in arm.data.bones[:30]:
    print(bone.name)
