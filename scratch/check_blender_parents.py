import bpy

# Load GLB
glb_path = 'public/media/all_lara/lara_croft_red_dress.glb'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=glb_path)

print("\n=== Object parenting in Blender ===")
for obj in bpy.data.objects:
    parent_name = obj.parent.name if obj.parent else "None"
    print(f"Object: \"{obj.name}\" -> Parent: \"{parent_name}\"")
