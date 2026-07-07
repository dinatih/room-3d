import bpy
bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_metarig_final.blend")
arm = bpy.data.objects.get("Armature")
if arm:
    arm.name = "metarig"
    
# Make metarig visible
arm.hide_viewport = False
arm.hide_render = False

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_metarig_final.blend")

bpy.ops.export_scene.gltf(
    filepath="public/models/lara_perfect.glb",
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
    export_yup=True,
    export_animations=True
)
