import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify.blend")
arm = bpy.data.objects.get("metarig")
print("Original:")
for pb in arm.pose.bones:
    if pb.rigify_type:
        print(pb.name, pb.rigify_type)

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
arm = bpy.data.objects.get("metarig")
print("Final:")
for pb in arm.pose.bones:
    if pb.rigify_type:
        print(pb.name, pb.rigify_type)
