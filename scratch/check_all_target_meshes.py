import bpy
import os

models = [
  'lara_croft_3254_rigged.glb',
  'lara_croft_543i.glb',
  'lara_croft_43254_rigged.glb',
  'lara_croft_4543.glb',
  'lara_croft_suit.glb'
]

all_lara_dir = 'public/media/all_lara'

for model_file in models:
    glb_path = os.path.join(all_lara_dir, model_file)
    if not os.path.exists(glb_path):
        print(f"\nFile not found: {model_file}")
        continue
        
    print(f"\n===========================================")
    print(f"Model: {model_file}")
    print(f"===========================================")
    
    # Clear Blender scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    # Import model
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    # Check all mesh objects
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            # List vertex groups (bones) with non-zero weights
            group_weights = {}
            for vertex in obj.data.vertices:
                for g in vertex.groups:
                    group_name = obj.vertex_groups[g.group].name
                    group_weights[group_name] = group_weights.get(group_name, 0) + g.weight
            
            # Sort
            sorted_groups = sorted(group_weights.items(), key=lambda x: x[1], reverse=True)
            
            # Print if it has material and vertices
            mats = [m.name for m in obj.data.materials if m]
            print(f"Mesh Object: \"{obj.name}\" (Materials: {mats})")
            print(f"  Vertices: {len(obj.data.vertices)}")
            print("  Top bones:")
            for g_name, total_w in sorted_groups[:5]:
                print(f"    {g_name}: {total_w:.2f}")
