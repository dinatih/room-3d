import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

lara = bpy.data.objects.get("Lara")

import bmesh
bm = bmesh.new()
bm.from_mesh(lara.data)
deform_layer = bm.verts.layers.deform.verify()

unweighted_count = 0
for v in bm.verts:
    if not v[deform_layer]:
        unweighted_count += 1

print(f"Number of completely unweighted vertices on Lara: {unweighted_count}")
