import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

lara = bpy.data.objects.get("Lara")

print("--- LARA MODIFIERS ---")
for mod in lara.modifiers:
    print(f"Name: {mod.name}, Type: {mod.type}")
    if mod.type == 'ARMATURE':
        print(f"  Object: {mod.object.name if mod.object else 'None'}")
        print(f"  Vertex Groups: {mod.use_vertex_groups}")
        print(f"  Bone Envelopes: {mod.use_bone_envelopes}")
        print(f"  Multi Modifier: {mod.use_multi_modifier}")

print("--- TOP 5 HEAVIEST VERTEX GROUPS FOR VERTEX 2219 ---")
import bmesh
bm = bmesh.new()
bm.from_mesh(lara.data)
deform_layer = bm.verts.layers.deform.verify()

v = bm.verts[2219] # the one from the butt
weights = {}
for idx, weight in v[deform_layer].items():
    weights[lara.vertex_groups[idx].name] = weight
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
