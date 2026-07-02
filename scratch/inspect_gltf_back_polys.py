import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)

glb_path = "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb"
bpy.ops.import_scene.gltf(filepath=glb_path)

print("ALL OBJECTS IN EXPORTED GLB:")
mesh_objs = []
for obj in bpy.data.objects:
    print(f"Object: {obj.name}, type={obj.type}")
    if obj.type == 'MESH':
        mesh_objs.append(obj)

# For each mesh object, let's find vertices/polygons in the back region:
# X in [-0.15, 0.15]
# Y in [-0.15, -0.02]
# Z in [1.15, 1.35]
# (Note: GLB might have different coordinate axes if Blender rotates it on import/export! 
# Let's check coordinates. Blender import of glTF has Y as depth, Z as height!)
for obj in mesh_objs:
    print(f"\nMesh: {obj.name}")
    material_polys = {}
    for poly in obj.data.polygons:
        in_back = False
        for v_idx in poly.vertices:
            v = obj.data.vertices[v_idx]
            # Bounding box check (in Blender space)
            if -0.15 <= v.co.x <= 0.15 and -0.15 <= v.co.y <= -0.02 and 1.15 <= v.co.z <= 1.35:
                in_back = True
                break
        if in_back:
            mat_name = obj.material_slots[poly.material_index].name if obj.material_slots else 'NoMaterial'
            material_polys[mat_name] = material_polys.get(mat_name, 0) + 1
            
    print("Polygons in back region:")
    for mat_name, count in material_polys.items():
        print(f"  {mat_name}: {count} polygons")
