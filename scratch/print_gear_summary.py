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

print("=== MESH OBJECT STRUCTURES FOR TARGET MODELS ===")

for model_file in models:
    glb_path = os.path.join(all_lara_dir, model_file)
    if not os.path.exists(glb_path):
        continue
        
    # Clear Blender scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    # Import
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    print(f"\nModel: {model_file}")
    
    # Analyze each mesh
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            mats = [m.name for m in obj.data.materials if m]
            # Check if any material is Gear, Accs, or if the name includes Gear/Accs
            is_gear_accs = any('gear' in m.lower() or 'acc' in m.lower() for m in mats) or 'gear' in obj.name.lower() or 'acc' in obj.name.lower()
            if is_gear_accs:
                # Find which bones it is weighted to
                group_weights = {}
                for vertex in obj.data.vertices:
                    for g in vertex.groups:
                        group_name = obj.vertex_groups[g.group].name
                        group_weights[group_name] = group_weights.get(group_name, 0) + g.weight
                
                # Check if it has both spine/neck (backpack) and thigh/pelvis (holster/legs) weights
                has_spine = any('spine' in b.lower() or 'neck' in b.lower() or 'shoulder' in b.lower() for b in group_weights)
                has_legs = any('thigh' in b.lower() or 'pelvis' in b.lower() or 'calf' in b.lower() or 'leg' in b.lower() for b in group_weights)
                
                print(f"  Mesh \"{obj.name}\" (Materials: {mats}, Vertices: {len(obj.data.vertices)})")
                if has_spine and has_legs:
                    print("    -> status: MERGED (Both backpack/spine and holster/legs weights are present in this single mesh!)")
                elif has_spine:
                    print("    -> status: BACKPACK ONLY (Only spine/shoulders weights are present!)")
                elif has_legs:
                    print("    -> status: CEINTURE/HOLSTERS ONLY (Only pelvis/thighs weights are present!)")
                else:
                    print("    -> status: OTHER/UNWEIGHTED")
                
                # Print top bones
                sorted_groups = sorted(group_weights.items(), key=lambda x: x[1], reverse=True)
                print("    Top bones: " + ", ".join(f"{b}({w:.1f})" for b, w in sorted_groups[:4]))
