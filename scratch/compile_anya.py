import bpy
import zipfile
import os
import tempfile

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/3D Resources/humans/lara_croft/anya-pilot-danse-porn.zip"
out_glb_path = "/home/dinatih/Projects/room-3d/public/media/all_lara/anya_dance.glb"

with tempfile.TemporaryDirectory() as tmpdir:
    print(f"Extracting zip to {tmpdir}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(tmpdir)
        
    fbx_file = os.path.join(tmpdir, "source/Anya Pilot danse.fbx")
    if not os.path.exists(fbx_file):
        raise FileNotFoundError(f"FBX file not found at: {fbx_file}")
        
    print("Importing FBX into Blender...")
    # Blender FBX importer automatically searches for textures in textures/ relative to the FBX
    bpy.ops.import_scene.fbx(filepath=fbx_file)
    
    print("Listing imported armatures and objects:")
    for o in bpy.data.objects:
        print(f"  Object: {o.name}, Type: {o.type}")
        
    # Standardize animation names
    print("Animations (Actions):")
    for action in bpy.data.actions:
        print(f"  Action: {action.name}")
        
    print(f"Exporting GLB to: {out_glb_path}")
    os.makedirs(os.path.dirname(out_glb_path), exist_ok=True)
    
    # Export with animations
    bpy.ops.export_scene.gltf(
        filepath=out_glb_path,
        export_format='GLB',
        export_skins=True,
        export_animations=True,
        export_yup=True
    )
    print("Successfully compiled Anya GLB!")
