"""Render review GIFs from the standalone retarget prototype."""
import bpy,os,tempfile,subprocess
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]/'artifacts/ushiro-retarget'
frames=Path(tempfile.mkdtemp(prefix='ushiro-retarget-preview-'))
bpy.ops.wm.open_mainfile(filepath=str(root/'ushiro-retarget-prototype.blend'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='TEXTURE';scene.display.shading.background_type='WORLD';scene.world=bpy.data.worlds.new('Grey');scene.world.color=(.15,.15,.15)
scene.render.resolution_x=450;scene.render.resolution_y=450;scene.render.resolution_percentage=100;scene.render.image_settings.color_depth='8';scene.render.image_settings.compression=50
bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO'

for label in ['Idle','Walk','Run']:
 a=bpy.data.actions['Pitbull|'+label];rig.animation_data.action=a;rig.animation_data.action_slot=a.slots[0]
 for i in range(12):
  scene.frame_set(round(a.frame_range[1]*i/12))
  deps=bpy.context.evaluated_depsgraph_get();points=[o.matrix_world@v.co for o in meshes for v in o.evaluated_get(deps).data.vertices]
  if i==0:
   lo=Vector(tuple(min(v[k] for v in points) for k in range(3)));hi=Vector(tuple(max(v[k] for v in points) for k in range(3)));center=(lo+hi)/2;span=max(hi-lo)
   scene.camera.location=center+Vector((1.4,-2,.6))*span;scene.camera.rotation_euler=(center-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.camera.data.ortho_scale=span*1.5
  scene.render.filepath=str(frames/f'{label}-{i:02d}.png');bpy.ops.render.render(write_still=True)
 delay=(a.frame_range[1]-a.frame_range[0])/scene.render.fps/12*100
 subprocess.run(['magick','-delay',str(delay),*[str(p) for p in sorted(frames.glob(label+'-*.png'))],'-loop','0',str(root/(label.lower()+'.gif'))],check=True)
 print('RENDERED',label,flush=True)
os._exit(0)
