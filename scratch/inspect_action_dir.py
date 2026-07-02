import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/tmp_anim_extract/PT74TBFLIU63A25FS9ZSIUKJV.glb")
act = bpy.data.actions[0]
print("ACTION DIR:")
print(dir(act))
if hasattr(act, "curves"):
    print("Has curves!")
elif hasattr(act, "fcurves"):
    print("Has fcurves!")
