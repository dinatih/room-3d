import bpy
import os
import glob
import json

all_lara_dir = 'public/media/all_lara'
glb_files = glob.glob(os.path.join(all_lara_dir, '*.glb'))

results = {}

for glb_path in glb_files:
    model_name = os.path.basename(glb_path)
    print(f"Reading: {model_name}")
    
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    try:
        bpy.ops.import_scene.gltf(filepath=glb_path)
    except Exception as e:
        print(f"Error loading {model_name}: {e}")
        continue
        
    results[model_name] = []
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            mats = [m.name for m in obj.data.materials if m]
            results[model_name].append({
                "name": obj.name,
                "materials": mats
            })

# Save results
with open('scratch/all_mesh_info.json', 'w') as f:
    json.dump(results, f, indent=2)

print("\n[SUCCESS] Saved all mesh info to scratch/all_mesh_info.json")
