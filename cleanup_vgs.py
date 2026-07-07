import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

obj = bpy.data.objects.get("Lara")

if obj:
    groups_to_remove = []
    for vg in obj.vertex_groups:
        if not vg.name.startswith("DEF-"):
            groups_to_remove.append(vg)
            
    for vg in groups_to_remove:
        obj.vertex_groups.remove(vg)

# Let's do this for ALL meshes, just to be safe, so no old mixamo weights interfere
for m in bpy.context.scene.objects:
    if m.type == 'MESH' and m.name != "Lara" and not m.name.startswith("WGT"):
        groups_to_remove = []
        for vg in m.vertex_groups:
            # For accessories, maybe we manually named them DEF- something.
            # So anything not DEF- should be removed.
            if not vg.name.startswith("DEF-"):
                groups_to_remove.append(vg)
        for vg in groups_to_remove:
            m.vertex_groups.remove(vg)

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
