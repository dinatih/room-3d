import bpy
import bmesh

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

rig = bpy.data.objects.get("rig")
lara = bpy.data.objects.get("Lara")

bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='POSE')

# Move torso
torso = rig.pose.bones.get("torso")
if torso:
    torso.location = (0, 0.5, 0)
    
bpy.context.view_layer.update()

# Get evaluated mesh!
depsgraph = bpy.context.evaluated_depsgraph_get()
eval_lara = lara.evaluated_get(depsgraph)
mesh = eval_lara.to_mesh()

print(f"Original vertex 2219 co: {lara.data.vertices[2219].co}")
print(f"Evaluated vertex 2219 co: {mesh.vertices[2219].co}")

eval_lara.to_mesh_clear()
