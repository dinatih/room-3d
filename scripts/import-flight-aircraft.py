"""Convert the user's FBX archives to GLB; preserve the origami animation."""
import bpy, zipfile, io, shutil, json
from pathlib import Path
source = Path('/home/dinatih/3D Resources/vehicules')
target = Path(__file__).resolve().parents[1] / 'public/items/aircraft'
target.mkdir(parents=True, exist_ok=True)
work = Path('/tmp/aircraft-source')
assets = [
 ('origami', 'other-origami-paper-plane-animation.zip', 'source/Plane_anim.fbx'),
 ('paper-glb', 'paper-plane.zip', 'source/0419plane.fbx'),
 ('a380', 'a380.zip', 'source/a380.zip'),
 ('delorean', '1985_delorean_dmc-12_time_machine_bttf.glb', None),
 ('police', 'fifth_element_-_police_hover_car.glb', None),
 ('korean-a380', 'korean_air__a380.glb', None),
]
for key, name, member in assets:
 if (target/f'{key}.glb').exists(): continue
 bpy.ops.wm.read_factory_settings(use_empty=True)
 if member:
  folder = work / key; folder.mkdir(parents=True, exist_ok=True)
  with zipfile.ZipFile(source / name) as archive:
   if key == 'a380':
    with zipfile.ZipFile(io.BytesIO(archive.read(member))) as inner: inner.extractall(folder)
    (folder/'2011040706020043412.png').write_bytes(archive.read('textures/2011040706020043412.png'))
    path = folder/'a380.FBX'
   else:
    path = folder/Path(member).name; path.write_bytes(archive.read(member))
  bpy.ops.import_scene.fbx(filepath=str(path))
  bpy.ops.export_scene.gltf(filepath=str(target/f'{key}.glb'), export_format='GLB', export_animations=key=='origami', export_animation_mode='SCENE', export_frame_range=False)
 else:
  shutil.copy2(source/name,target/f'{key}.glb')
  bpy.ops.import_scene.gltf(filepath=str(target/f'{key}.glb'))
 print('AIRCRAFT',key, 'objects',len(bpy.data.objects), 'actions',[(a.name,list(a.frame_range)) for a in bpy.data.actions],flush=True)
