import bpy
from mathutils import Vector
def measure(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=path)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    bpy.context.view_layer.update()
    z_min = min((m.matrix_world @ Vector(c)).z for m in meshes for c in m.bound_box)
    z_max = max((m.matrix_world @ Vector(c)).z for m in meshes for v in [m.bound_box] for c in v)
    print(f"FILE: {path} | HEIGHT: {z_max - z_min}")
measure("/home/dinatih/Projects/room-3d/sources_backup/X Bot.fbx")
measure("/home/dinatih/Projects/room-3d/sources_backup/Y Bot.fbx")
