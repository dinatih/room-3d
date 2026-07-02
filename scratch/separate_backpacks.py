import bpy
import os

models = [
  'lara_croft_3254_rigged.glb',
  'lara_croft_543i.glb',
  'lara_croft_red_dress.glb',
  'lara_croft_suit.glb',
  'lara_croft_43254_rigged.glb',
  'lara_croft_4543.glb'
]

all_lara_dir = 'public/media/all_lara'
backpack_bones = {'spine_3', 'spine_2', 'spine_1', 'head_neck_upper', 'head_neck_lower', 'neck', 'head', 'arm_left_shoulder_1', 'arm_right_shoulder_1'}

for model_file in models:
    glb_path = os.path.join(all_lara_dir, model_file)
    if not os.path.exists(glb_path):
        print(f"File not found: {model_file}")
        continue
        
    print(f"\n===========================================")
    print(f"PROCESSING: {model_file}")
    print(f"===========================================")
    
    # 1. Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    # 2. Import GLB
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    # 3. Find all mesh objects and separate them by material
    mesh_objects = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    for obj in mesh_objects:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        
        # Only separate if it has multiple materials
        if len(obj.data.materials) > 1:
            print(f"  Separating multi-material mesh by material: \"{obj.name}\"")
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.separate(type='MATERIAL')
            bpy.ops.object.mode_set(mode='OBJECT')
            
    # 4. Refresh list of mesh objects
    mesh_objects = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    
    # Identify the Gear or Accs object that contains the backpack
    for obj in mesh_objects:
        mats = [m.name for m in obj.data.materials if m]
        if not mats:
            continue
            
        mat_name = mats[0].lower()
        # We target materials containing 'gear' or 'acc' (but NOT body, face, dress, hair, etc.)
        if ('gear' in mat_name or 'acc' in mat_name) and not ('body' in mat_name or 'face' in mat_name or 'hair' in mat_name):
            print(f"  Target Gear/Accs Mesh: \"{obj.name}\" (Material: \"{mats[0]}\")")
            
            # Check vertex weights to determine backpack vs leg holsters
            group_weights = {}
            for vertex in obj.data.vertices:
                for g in vertex.groups:
                    group_name = obj.vertex_groups[g.group].name
                    group_weights[group_name] = group_weights.get(group_name, 0) + g.weight
            
            has_backpack_weights = any(b in backpack_bones for b in group_weights)
            has_leg_weights = any('thigh' in b.lower() or 'pelvis' in b.lower() or 'calf' in b.lower() or 'leg' in b.lower() for b in group_weights)
            
            if has_backpack_weights and has_leg_weights:
                print("    -> Mesh has MERGED weights. Splitting backpack from leg gear...")
                
                # We will duplicate the object to create the backpack
                bpy.ops.object.select_all(action='DESELECT')
                obj.select_set(True)
                bpy.context.view_layer.objects.active = obj
                bpy.ops.object.duplicate()
                backpack_obj = bpy.context.active_object
                backpack_obj.name = "backpack"
                backpack_obj.data.name = "backpack"
                
                # Select original (which will become gear only)
                bpy.ops.object.select_all(action='DESELECT')
                obj.select_set(True)
                bpy.context.view_layer.objects.active = obj
                
                # Delete backpack vertices from original object
                print("    - Removing backpack vertices from original Gear mesh...")
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='DESELECT')
                bpy.ops.object.mode_set(mode='OBJECT')
                
                # Mark vertices weighted to backpack bones
                for v in obj.data.vertices:
                    is_backpack_vertex = False
                    for g in v.groups:
                        g_name = obj.vertex_groups[g.group].name
                        if g_name in backpack_bones and g.weight > 0.1:
                            is_backpack_vertex = True
                            break
                    if is_backpack_vertex:
                        v.select = True
                        
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.delete(type='VERT')
                bpy.ops.object.mode_set(mode='OBJECT')
                
                # Delete gear vertices from backpack object
                print("    - Removing non-backpack vertices from new backpack mesh...")
                bpy.ops.object.select_all(action='DESELECT')
                backpack_obj.select_set(True)
                bpy.context.view_layer.objects.active = backpack_obj
                
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.select_all(action='DESELECT')
                bpy.ops.object.mode_set(mode='OBJECT')
                
                for v in backpack_obj.data.vertices:
                    is_backpack_vertex = False
                    for g in v.groups:
                        g_name = backpack_obj.vertex_groups[g.group].name
                        if g_name in backpack_bones and g.weight > 0.1:
                            is_backpack_vertex = True
                            break
                    if not is_backpack_vertex:
                        v.select = True
                        
                bpy.ops.object.mode_set(mode='EDIT')
                bpy.ops.mesh.delete(type='VERT')
                bpy.ops.object.mode_set(mode='OBJECT')
                
                print("    -> Split complete!")
                
            elif has_backpack_weights:
                print("    -> Mesh is BACKPACK ONLY. Renaming directly to 'backpack'...")
                obj.name = "backpack"
                obj.data.name = "backpack"
                
    # 5. Export back to GLB
    print(f"  Exporting back to {glb_path}...")
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_skins=True,
        export_animations=True
    )
    print(f"[SUCCESS] Exported {model_file} successfully!")
