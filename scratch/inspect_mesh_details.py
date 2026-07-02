import bpy
import sys

# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

glb_path = 'public/media/all_lara/lara_croft_red_dress.glb'
print(f"Loading GLB: {glb_path}")
bpy.ops.import_scene.gltf(filepath=glb_path)

print("\n=== Objects in Blender ===")
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        print(f"Mesh Object: \"{obj.name}\"")
        print(f"  Materials: {[mat.name for mat in obj.data.materials if mat]}")
        print(f"  Vertices: {len(obj.data.vertices)}")
        print(f"  Polygons: {len(obj.data.polygons)}")
