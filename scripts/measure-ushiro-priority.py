"""Surface strain and fixed-length diagnostics for exported priority poses.

Statistics describe deformation, not a perceptual pass/fail test.
"""
from pathlib import Path
import argparse,json,os,sys,runpy
import bpy,numpy as np
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--model',required=True);p.add_argument('--output',required=True)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=a.model)
r=next(o for o in bpy.data.objects if o.type=='ARMATURE')
for t in list(r.animation_data.nla_tracks):r.animation_data.nla_tracks.remove(t)
runpy.run_path(str(ROOT/'scripts/dog-animation-curves.py'))['make_actions_continuous'](bpy.data.actions)
r.animation_data.action=None
for pb in r.pose.bones:pb.matrix_basis.identity()
bpy.context.view_layer.update()
o=max((o for o in bpy.data.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices))
coords=np.array([list(v.co) for v in o.data.vertices]);edges=np.array([tuple(e.vertices) for e in o.data.edges])
lengths=np.linalg.norm(coords[edges[:,1]]-coords[edges[:,0]],axis=1)
regions={}
for label,names in [('shoulders',{'LeftShoulder','RightShoulder','LeftShoulder01','RightShoulder01','LeftArm','RightArm'}),('hips',{'LeftPelvis','RightPelvis','LeftUpLeg','RightUpLeg'}),('trunk',{'Hips','Spine','Spine1','Spine2','Spine3','Spine4'})]:
 mask=np.array([o.vertex_groups[max(v.groups,key=lambda g:g.weight).group].name in names for v in o.data.vertices])
 regions[label]=mask[edges[:,0]]&mask[edges[:,1]]&(lengths>0)
clips=['idle 50','walk_fwd 29','run_fwd 13','idle_shake_1. 137','idle_shake_2. 81','interact_bed_lay_exist 270','interact_bed_sleep_exist 221','poop 75','track_bark_harvest 75','canter_fwd 53','idle_bark_04_warning 47']
report={}
for name in clips:
 action=bpy.data.actions[name];r.animation_data.action=action;r.animation_data.action_slot=action.slots[0]
 samples=[]
 for i in range(32):
  start,end=action.frame_range;frame=start+(end-start)*i/32;bpy.context.scene.frame_set(int(frame),subframe=frame%1);bpy.context.view_layer.update()
  skin=o.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
  xyz=np.empty(len(coords)*3);skin.vertices.foreach_get('co',xyz);xyz=xyz.reshape((-1,3))
  deformed=np.linalg.norm(xyz[edges[:,1]]-xyz[edges[:,0]],axis=1)
  row={}
  for region,mask in regions.items():
   ratio=deformed[mask]/lengths[mask];strain=np.abs(np.log(np.maximum(ratio,np.finfo(float).tiny)))
   row[region]=dict(medianLogStrain=float(np.median(strain)),p95LogStrain=float(np.quantile(strain,.95)),minimumEdgeRatio=float(ratio.min()),maximumEdgeRatio=float(ratio.max()))
  paws={n:r.matrix_world@r.pose.bones[n].matrix.translation for n in ['LeftHand','RightHand','LeftFoot','RightFoot']}
  front=(paws['LeftHand']+paws['RightHand'])/2;rear=(paws['LeftFoot']+paws['RightFoot'])/2
  trunk=(r.matrix_world@r.data.bones['Spine4'].head_local-r.matrix_world@r.data.bones['Hips'].head_local).length
  rotation=(r.matrix_world@r.pose.bones['Hips'].matrix).to_quaternion()@(r.matrix_world@r.data.bones['Hips'].matrix_local).to_quaternion().inverted()
  forward=(rotation@Vector((1,0,0))).cross(Vector((0,0,1))).normalized()
  samples.append(dict(phase=i/32,regions=row,projectedForeHindPawGapOverTrunk=(front-rear).dot(forward)/trunk,horizontalForeHindPawGapOverTrunk=float(np.linalg.norm(np.array(front-rear)[:2]))/trunk))
 report[name]=samples;print('MEASURED',name,flush=True)
Path(a.output).write_text(json.dumps(report,indent=2)+'\n');os._exit(0)
