import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/tmp_anim_extract/PT74TBFLIU63A25FS9ZSIUKJV.glb")
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
print("ALL BONES:")
for bone in arm.data.bones:
    print(bone.name)
