import bpy
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
objects = [obj.name for obj in bpy.data.objects if obj.type == 'ARMATURE']
print("ARMATURES IN FILE:", objects)
