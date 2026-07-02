import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/tmp_anim_extract/PT74TBFLIU63A25FS9ZSIUKJV.glb")
src_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
print("Armature animation_data:", src_arm.animation_data)
if src_arm.animation_data:
    print("Armature active action:", src_arm.animation_data.action)
print("All actions in Blender database:", list(bpy.data.actions))

for bname in ["handl", "handr"]:
    bone = src_arm.pose.bones.get(bname)
    if bone:
        bpy.context.scene.frame_set(0)
        bpy.context.view_layer.update()
        p0 = bone.matrix.translation.copy()
        
        bpy.context.scene.frame_set(60)
        bpy.context.view_layer.update()
        p60 = bone.matrix.translation.copy()
        
        print(f"{bname} frame 0 pos={p0}")
        print(f"{bname} frame 60 pos={p60}")
        print(f"{bname} Diff pos: {(p60 - p0).length}")
    else:
        print(f"Bone {bname} not found!")





