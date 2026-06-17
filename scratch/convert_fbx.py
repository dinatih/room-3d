import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath="/home/dinatih/Downloads/walking/Happy Walk.fbx")
bpy.ops.export_scene.gltf(
    filepath="public/media/glb-animations/happy_walk.glb",
    export_format='GLB',
    export_animations=True,
    export_apply=True
)
