import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

lara = bpy.data.objects.get("Lara")

import bmesh
bm = bmesh.new()
bm.from_mesh(lara.data)
bm.verts.ensure_lookup_table()
deform_layer = bm.verts.layers.deform.verify()

v = bm.verts[2219] # the one from the butt
weights = {}
for idx, weight in v[deform_layer].items():
    weights[lara.vertex_groups[idx].name] = weight
print("--- TOP 5 HEAVIEST VERTEX GROUPS FOR VERTEX 2219 ---")
for name, w in sorted(weights.items(), key=lambda item: item[1], reverse=True)[:5]:
    print(f"  {name}: {w:.3f}")

rig = bpy.data.objects.get("rig")
print("--- RIG DEFORM BONES ---")
for b in ["DEF-spine", "DEF-thigh.R", "DEF-thigh.R.001"]:
    bone = rig.data.bones.get(b)
    if bone:
        print(f"{b} use_deform: {bone.use_deform}")
    else:
        print(f"{b} NOT FOUND")
        
# Fix the modifiers!
for mod in lara.modifiers:
    if mod.name == "Armature" and mod.object is None:
        lara.modifiers.remove(mod)
        print("Removed broken Armature modifier")

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")
