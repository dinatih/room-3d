import bpy
import os

FBX_PATH = "/tmp/lara_source/fbx_extracted/C1S1UIP9N1UQPLO2U787FMDUD.fbx"
GLB_PATH = "/tmp/lara_source/lara_base.glb"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Import FBX
    bpy.ops.import_scene.fbx(filepath=FBX_PATH)
    
    # Basic cleanup: remove prefix if any
    for o in bpy.data.objects:
        if ":" in o.name:
            o.name = o.name.split(":")[-1]
            
    # Export as GLB for processing scripts
    bpy.ops.export_scene.gltf(
        filepath=GLB_PATH,
        export_format='GLB',
        export_skins=True,
        export_yup=True
    )
    print(f"Exported: {GLB_PATH}")

if __name__ == "__main__":
    main()
