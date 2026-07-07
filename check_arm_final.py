import bpy
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_metarig_final.blend")
objects = [obj.name for obj in bpy.data.objects if obj.type == 'ARMATURE']
print("ARMATURES IN FINAL FILE:", objects)
for obj in bpy.data.objects:
    if obj.type == 'ARMATURE':
        print(f"Bones in {obj.name}: {len(obj.data.bones)}")
