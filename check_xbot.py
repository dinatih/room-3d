import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/xbot_from_mixamo.blend")
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        print(f"Found Armature: {obj.name}")
        for bone in obj.data.bones[:5]:
            print(f"  - {bone.name}")
