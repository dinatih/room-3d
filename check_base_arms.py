import bpy
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_base.blend")

for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        print(f"Armature object: {obj.name}")
