"""Export the edited Export collection, then join/compress without quantization.
Run from the repository root:
blender -b -noaudio -t 4 --python scripts/export-framework-laptop.py
"""
import bpy,os,sys,subprocess,tempfile
from pathlib import Path
root=Path(__file__).resolve().parent.parent
asset=root/'public/items/framework-laptop13/framework-laptop13'
bpy.ops.wm.open_mainfile(filepath=str(asset.with_suffix('.blend')))
collection=bpy.data.collections['Export']
assert not collection.hide_viewport and not collection.hide_render
bpy.ops.object.select_all(action='DESELECT')
for obj in collection.objects:obj.select_set(True)
bpy.context.view_layer.objects.active=next(obj for obj in collection.objects if obj.type=='MESH')
with tempfile.TemporaryDirectory(prefix='room-framework-') as temporary:
 raw=Path(temporary)/'laptop.glb'
 bpy.ops.export_scene.gltf(filepath=str(raw),export_format='GLB',use_selection=True,export_extras=True)
 subprocess.run(['node',str(root/'scripts/pack-framework-laptop.mjs'),str(raw),str(asset.with_suffix('.glb'))],cwd=root,check=True)
# Avoid the local audio backend hanging Blender's background shutdown after export.
sys.stdout.flush();os._exit(0)
