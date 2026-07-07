import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend")

metarig = bpy.data.objects.get("metarig")
for bone in metarig.data.bones:
    print(bone.name)
