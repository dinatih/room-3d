import bpy
import sys
import os

# Get arguments
argv = sys.argv
argv = argv[argv.index("--") + 1:] # get all args after "--"

fbx_in = argv[0]
glb_out = argv[1]

# Clear existing objects
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import FBX
bpy.ops.import_scene.fbx(filepath=fbx_in)

# Export GLB
bpy.ops.export_scene.gltf(
    filepath=glb_out,
    export_format='GLB',
    export_animations=True,
    export_skins=True,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False
)
