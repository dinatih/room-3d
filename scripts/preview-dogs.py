"""Render eight phases per base clip plus three views of the rest pose."""
from pathlib import Path
import bpy, os, argparse, sys
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--dog',choices=['dachshund-sculpt','ushiro'],required=True);parser.add_argument('--extended',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);DOG=args.dog
OUT=ROOT/'artifacts'/DOG/'review';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'artifacts'/DOG/('dachshund.blend' if DOG=='dachshund-sculpt' else 'ushiro.blend')))
s=bpy.context.scene;s.render.engine='BLENDER_WORKBENCH';s.display.shading.color_type='VERTEX' if DOG=='dachshund-sculpt' else 'TEXTURE';s.display.shading.light='STUDIO';s.display.shading.show_shadows=True;s.display.shading.show_cavity=True
s.render.resolution_x=480;s.render.resolution_y=360;s.render.resolution_percentage=100
s.world=bpy.data.worlds.new('Review background');s.world.color=(.18,.18,.18)
s.display.shading.background_type='WORLD'
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
model_meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if DOG=='ushiro':
 for material in bpy.data.materials:
  if material.use_nodes:
   diffuse=next((n for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and 'diffuse' in n.image.name.lower()),None)
   if diffuse:material.node_tree.nodes.active=diffuse
bpy.ops.mesh.primitive_plane_add(size=200);plane=bpy.context.object;plane.name='Review floor';plane.location.z=-.002;plane.color=(.28,.28,.28,1)
bpy.ops.object.camera_add();s.camera=bpy.context.object;s.camera.data.type='ORTHO';s.camera.data.ortho_scale=2.35 if DOG=='dachshund-sculpt' else 1.6
center=Vector((0,.20,.42)) if DOG=='dachshund-sculpt' else Vector((.04,-.10,.43))
def camera(offset):
 s.camera.location=center+Vector(offset);s.camera.rotation_euler=(center-s.camera.location).to_track_quat('-Z','Y').to_euler()
camera((3,0,.25))
clips=[('idle','idle 50'),('walk','walk_fwd 29'),('run','run_fwd 13')]
if args.extended:clips += [('sit','idle_sit_pose 2'),('lay','idle_lay_pose 2'),('jump','jump 22'),('scratch','idle_sit_one_off_scratch 176')]
for label,name in clips:
 a=bpy.data.actions[name];rig.animation_data.action=a;rig.animation_data.action_slot=a.slots[0];start,end=a.frame_range
 # One fixed framing for the entire cycle, including jumping and root motion.
 points=[]
 for i in range(8):
  frame=start+(end-start)*i/8;s.frame_set(int(frame),subframe=frame%1);bpy.context.view_layer.update()
  graph=bpy.context.evaluated_depsgraph_get()
  points.extend(o.matrix_world@Vector(corner) for o in model_meshes for corner in o.evaluated_get(graph).bound_box)
 lo=Vector([min(p[i] for p in points) for i in range(3)]);hi=Vector([max(p[i] for p in points) for i in range(3)])
 center=(lo+hi)/2;span=hi-lo
 s.camera.data.ortho_scale=max(span.y,span.z*s.render.resolution_x/s.render.resolution_y)*1.15
 camera((3,0,.25))
 if label=='idle':idle_center=center.copy();idle_scale=s.camera.data.ortho_scale
 for i in range(8):
  frame=start+(end-start)*i/8;s.frame_set(int(frame),subframe=frame%1)
  s.render.filepath=str(OUT/f'{label}-{i}.png');bpy.ops.render.render(write_still=True)
center=idle_center;s.camera.data.ortho_scale=idle_scale
rig.animation_data.action=bpy.data.actions['idle 50'];rig.animation_data.action_slot=rig.animation_data.action.slots[0];s.frame_set(0)
for name,offset in [('front',(0,-3,.35)),('three-quarter',(2,-3,.7)),('back',(-2,3,.5))]:
 camera(offset);s.render.filepath=str(ROOT/f'public/characters/{DOG}/{name}.png');bpy.ops.render.render(write_still=True)
print('REVIEW_RENDERED',flush=True);os._exit(0)
