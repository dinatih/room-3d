import bpy
bpy.ops.import_scene.fbx(filepath="/home/dinatih/Projects/room-3d/sources_backup/animations/Walking.fbx")
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
action = arm.animation_data.action
print(f"ACTION: {action.name}")
print(f"HAS FCURVES: {hasattr(action, 'fcurves')}")
print(f"DIR: {dir(action)}")
