import bpy
import sys

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# Clean up rigify widgets before export? Usually we don't want widgets in the glb.
wgts = bpy.data.collections.get("WGTS_rig")
if wgts:
    for obj in wgts.objects:
        bpy.data.objects.remove(obj)

# Export to public/models/lara_perfect.glb
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
print("Export complete!")
