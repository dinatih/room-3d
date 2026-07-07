import bpy
import sys

bpy.ops.wm.open_mainfile(filepath="/home/dinatih/Projects/room-3d/sources_backup/xbot_from_mixamo.blend")
bpy.ops.export_scene.gltf(
    filepath="/home/dinatih/Projects/room-3d/public/models/xbot.glb",
    export_format='GLB',
    export_yup=True
)
