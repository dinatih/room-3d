"""Render six diagnostic poses offline; output: /tmp/dachshund-review/."""
from pathlib import Path
import bpy
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath=str(Path(__file__).resolve().parents[1]/'artifacts/dachshund-sculpt/dachshund.blend'))
s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.display.shading.color_type='MATERIAL';s.render.resolution_x=700;s.render.resolution_y=500;s.render.resolution_percentage=100
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
bpy.ops.object.camera_add(location=(2.5,0,1));s.camera=bpy.context.object;s.camera.data.type='ORTHO';s.camera.data.ortho_scale=2.6;s.camera.rotation_euler=(Vector((0,.2,.35))-s.camera.location).to_track_quat('-Z','Y').to_euler()
for label,name in [('idle','idle 50'),('walk','walk_fwd 29'),('run','run_fwd 13'),('sit','idle_sit_pose 2'),('lay','idle_lay_pose 2'),('jump','jump 22')]:
 a=bpy.data.actions[name];rig.animation_data.action=a;rig.animation_data.action_slot=a.slots[0];s.frame_set(int(sum(a.frame_range)/2));s.render.filepath='/tmp/dachshund-review/'+label+'.png';bpy.ops.render.render(write_still=True)
