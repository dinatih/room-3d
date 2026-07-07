import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_metarig_voxel.blend")
metarig = bpy.data.objects.get("Armature")
if metarig:
    print(f"Bones in metarig: {len(metarig.data.bones)}")
    for b in metarig.data.bones[:5]:
        print(f"{b.name} use_deform={b.use_deform}")
