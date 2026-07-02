import bpy
import sys

def get_dimensions(path):
    try:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=path)
        
        min_x, max_x = float('inf'), float('-inf')
        min_y, max_y = float('inf'), float('-inf')
        min_z, max_z = float('inf'), float('-inf')
        
        meshes = [o for o in bpy.data.objects if o.type == 'MESH']
        if not meshes:
            return None
            
        for m in meshes:
            for vertex in m.data.vertices:
                world_coord = m.matrix_world @ vertex.co
                min_x = min(min_x, world_coord.x)
                max_x = max(max_x, world_coord.x)
                min_y = min(min_y, world_coord.y)
                max_y = max(max_y, world_coord.y)
                min_z = min(min_z, world_coord.z)
                max_z = max(max_z, world_coord.z)
                
        return {
            "x": [min_x, max_x],
            "y": [min_y, max_y],
            "z": [min_z, max_z],
            "height": max_z - min_z # Blender Z-up
        }
    except Exception as e:
        return str(e)

files = {
    "Lara": "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb",
    "XBot": "/home/dinatih/Projects/room-3d/public/media/sandbox/Xbot_official.glb",
    "CCFemme": "/home/dinatih/Projects/room-3d/public/media/sandbox/CCFemme.glb",
    "CChomme": "/home/dinatih/Projects/room-3d/public/media/sandbox/CChomme.glb"
}

for name, path in files.items():
    print(f"{name}: {get_dimensions(path)}")
