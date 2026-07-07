import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_metarig_voxel.blend")
lara = bpy.data.objects.get("Lara")
print(f"Vertex groups count: {len(lara.vertex_groups)}")
for vg in lara.vertex_groups:
    print(vg.name)
