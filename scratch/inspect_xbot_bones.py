import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/public/media/sandbox/x_bot.glb")
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
print("X-BOT BONES:")
for bone in arm.data.bones[:20]:
    print(bone.name)
