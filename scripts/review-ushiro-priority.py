"""Render actual exported skin over the difficult reference poses (no skeleton overlay)."""
from pathlib import Path
import argparse, json, os, sys, runpy
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--model',required=True)
parser.add_argument('--label',required=True)
parser.add_argument('--output',type=Path)
parser.add_argument('--rest-only',action='store_true')
parser.add_argument('--clip',action='append')
parser.add_argument('--phase',type=float,action='append')
parser.add_argument('--ground',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
out=args.output if args.output else ROOT/'artifacts/ushiro/priority-review'/args.label;out.mkdir(parents=True,exist_ok=True)
path=Path(args.model)
if path.suffix=='.blend':bpy.ops.wm.open_mainfile(filepath=str(path))
else:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(path))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
rig.animation_data.action=None
for pb in rig.pose.bones:pb.matrix_basis.identity()
runpy.run_path(str(ROOT/'scripts/dog-animation-curves.py'))['make_actions_continuous'](bpy.data.actions)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.vertex_groups]
for m in bpy.data.materials:
 if m.use_nodes:
  texture=next((n for n in m.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and ('diffuse' in n.image.name.lower() or 'basecolor' in n.image.name.lower())),None)
  if texture:m.node_tree.nodes.active=texture
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH'
scene.render.resolution_x=440;scene.render.resolution_y=330;scene.render.resolution_percentage=100
scene.display.shading.color_type='TEXTURE';scene.display.shading.light='STUDIO'
scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True
scene.display.shading.background_type='WORLD'
scene.world=bpy.data.worlds.new('Background');scene.world.color=(.4,.43,.47)
bpy.ops.object.camera_add();camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO'
clips=['rest'] if args.rest_only else ['rest','idle 50','walk_fwd 29','run_fwd 13','idle_shake_1. 137','idle_shake_2. 81','interact_bed_lay_exist 270','interact_bed_sleep_exist 221','poop 75','track_bark_harvest 75','canter_fwd 53','idle_bark_04_warning 47']
if args.clip:clips=args.clip
manifest=[]
for index,name in enumerate(clips):
 if name=='rest':rig.animation_data.action=None;phases=[0]
 else:
  a=bpy.data.actions[name];rig.animation_data.action=a;rig.animation_data.action_slot=a.slots[0]
  count=16 if 'shake' in name else (8 if name in ['walk_fwd 29','run_fwd 13'] else 4)
  phases=args.phase if args.phase else [i/count for i in range(count)]
  if any(not 0<=phase<=1 for phase in phases):raise ValueError('Phase outside animation')
 points=[]
 for phase in phases:
  if name!='rest':
   start,end=a.frame_range;frame=start+(end-start)*phase;scene.frame_set(int(frame),subframe=frame%1)
  bpy.context.view_layer.update();graph=bpy.context.evaluated_depsgraph_get()
  points.extend(o.matrix_world@Vector(c) for o in meshes for c in o.evaluated_get(graph).bound_box)
 focus=Vector([(min(p[i] for p in points)+max(p[i] for p in points))/2 for i in range(3)])
 height=max(p.z for p in points)-min(p.z for p in points)
 floor_line=None
 if args.ground:
  curve=bpy.data.curves.new('Ground datum','CURVE');curve.dimensions='3D';curve.bevel_depth=height/scene.render.resolution_y
  for direction in [(1,0,0),(0,1,0)]:
   spline=curve.splines.new('POLY');spline.points.add(1)
   for point,sign in zip(spline.points,[-1,1]):point.co=(*(sign*height*5*v for v in direction),1)
  floor_line=bpy.data.objects.new('Ground plane',curve);scene.collection.objects.link(floor_line)
  material=bpy.data.materials.new('Green ground');material.diffuse_color=(0,.8,.15,1);curve.materials.append(material)
 for view,offset in [('profile',(4,0,.04)),('three-quarter',(3,-3,1.5))]:
  camera.location=focus+Vector(offset)*height;camera.rotation_euler=(focus-camera.location).to_track_quat('-Z','Y').to_euler()
  right=camera.rotation_euler.to_quaternion()@Vector((1,0,0));up=camera.rotation_euler.to_quaternion()@Vector((0,1,0))
  camera.data.ortho_scale=max(max(p.dot(right) for p in points)-min(p.dot(right) for p in points),(max(p.dot(up) for p in points)-min(p.dot(up) for p in points))*4/3)*1.08
  for phase in phases:
   if name!='rest':
    frame=start+(end-start)*phase;scene.frame_set(int(frame),subframe=frame%1)
   bpy.context.view_layer.update();filename=f'{index:02d}-{view}-{phase}.png';scene.render.filepath=str(out/filename);bpy.ops.render.render(write_still=True)
   manifest.append(dict(clip=name,phase=phase,view=view,file=filename))
 if floor_line:bpy.data.objects.remove(floor_line,do_unlink=True)
 print('REVIEWED',name,flush=True)
(out/'manifest.json').write_text(json.dumps(manifest,indent=2));print('DONE',flush=True);os._exit(0)
