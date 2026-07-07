import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and obj.name != "Lara" and not obj.name.startswith("WGT")]
for m in meshes:
    print(f"[{m.name}] vertex groups:")
    for vg in m.vertex_groups:
        print(f"  - {vg.name}")
