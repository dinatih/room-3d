import bpy

# Load GLB
glb_path = 'public/media/all_lara/lara_croft_red_dress.glb'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=glb_path)

gear_objects = ['Object_152', 'Object_153', 'Object_146', 'Object_147']

for name in gear_objects:
    obj = bpy.data.objects.get(name)
    if not obj:
        print(f"Object not found: {name}")
        continue
    
    print(f"\n===========================================")
    print(f"Object: {name} (Material: {[m.name for m in obj.data.materials if m]})")
    print(f"===========================================")
    
    # List vertex groups (bones) with non-zero weights
    group_weights = {}
    for vertex in obj.data.vertices:
        for g in vertex.groups:
            group_name = obj.vertex_groups[g.group].name
            group_weights[group_name] = group_weights.get(group_name, 0) + g.weight
            
    # Sort and print
    sorted_groups = sorted(group_weights.items(), key=lambda x: x[1], reverse=True)
    print("Non-zero weight bones/vertex groups:")
    for g_name, total_w in sorted_groups[:15]:
        print(f"  {g_name}: {total_w:.2f}")
