import bpy
import os

models = [
  'lara_croft_324_rigged.glb',
  'lara_croft_43254_rigged.glb',
  'lara_croft_4543.glb',
  'lara_croft_motorcycle_gear.glb',
  'lara_croft_spy_gear.glb',
  'lara_croft_suit.glb',
  'lara_croft_brown_jacket.glb',
  'lara_croft_swim_gear.glb',
  'lara_croft_swim_gear_1.glb',
  'lara_croft_dress_345.glb',
  'lara_croft_red_dress.glb',
  'lara_croft_swim_gear_243.glb',
  'lara_croft_black_tank_top.glb',
  'lara_croft_4259.glb',
  'lara_croft_3254_rigged.glb',
  'lara_croft_gold_shades.glb',
  'lara_original_88_bones.glb',
  'lara_croft_zip.glb',
  'lara_croft_543i.glb',
  'xbot_studio.glb'
]

all_lara_dir = 'public/media/all_lara'

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
    split_any = False
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
            split_any = True
            
    # 4. Export back to GLB if any meshes were split
    if split_any:
        print(f"  Exporting back to {glb_path}...")
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.export_scene.gltf(
            filepath=glb_path,
            export_format='GLB',
            export_skins=True,
            export_animations=True
        )
        print(f"[SUCCESS] Exported and split {model_file} successfully!")
    else:
        print(f"  No multi-material meshes to split in {model_file}.")
