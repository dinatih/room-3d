import bpy
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_metarig_final.blend")
arm = bpy.data.objects.get("metarig")
deform_bones = [b.name for b in arm.data.bones if b.use_deform]
print(f"DEFORM BONES: {deform_bones}")
