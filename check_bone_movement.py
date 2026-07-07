import bpy
import mathutils

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
lara = bpy.data.objects.get("Lara")

bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='POSE')

print("--- BONE MOVEMENT TEST ---")
for b_name in ["DEF-spine", "DEF-pelvis.L", "DEF-thigh.L", "DEF-upper_arm.L"]:
    pbone = rig.pose.bones.get(b_name)
    if pbone:
        print(f"{b_name} head position: {pbone.head}")
        
print("--- VERTEX 2219 (BUTT) WEIGHTS ---")
v = lara.data.vertices[2219]
for g in v.groups:
    print(f"  {lara.vertex_groups[g.group].name}: {g.weight:.3f}")
