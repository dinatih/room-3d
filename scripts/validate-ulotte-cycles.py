"""Measure exported skin contacts and maximum inter-frame bone rotation at 240 Hz."""
from pathlib import Path
import bpy, json, math, os, runpy, argparse, sys
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--report',type=Path,default=ROOT/'artifacts/dachshund-sculpt/life-review/continuous-cycles.json');parser.add_argument('--before',type=Path,default=Path('/tmp/ulotte-before-cycle-fix.glb'));parser.add_argument('--candidate',type=Path,default=Path('/tmp/ulotte-cycle-candidate/dog.glb'));parser.add_argument('--clips',nargs='+',default=['idle_shake_1. 137','idle_lay_pose 2','walk_fwd_sniff 46']);args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
report={};failures=[]
for label,path in [('before',args.before),('candidate',args.candidate)]:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(path))
 runpy.run_path(str(ROOT/'scripts/dog-animation-curves.py'))['make_actions_continuous'](bpy.data.actions)
 rig=next(o for o in bpy.data.objects if o.type=='ARMATURE');meshes=[o for o in bpy.data.objects if o.type=='MESH'];body=max(meshes,key=lambda o:len(o.data.vertices))
 for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
 paw_names={'LeftHand','LeftHandMiddle1','RightHand','RightHandMiddle1','LeftFoot','LeftToeBase','RightFoot','RightToeBase'}
 paw_vertices=np.array([v.index for v in body.data.vertices if body.vertex_groups[max(v.groups,key=lambda g:g.weight).group].name in paw_names])
 if not len(paw_vertices):raise RuntimeError('No paw contact surfaces')
 result={}
 for name in args.clips:
  action=bpy.data.actions[name];rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
  start,end=action.frame_range;duration=(end-start)/bpy.context.scene.render.fps;minimum=math.inf;maximum=0;maximum_bone=None;previous=None;maximum_paw_height=-math.inf
  for i in range(math.ceil(duration*240)+1):
   frame=start+min(duration,i/240)*bpy.context.scene.render.fps;bpy.context.scene.frame_set(int(frame),subframe=frame%1);bpy.context.view_layer.update()
   current=[p.matrix.to_quaternion() for p in rig.pose.bones]
   if previous:
    angles=[2*math.acos(min(1,abs(a.dot(b)))) for a,b in zip(current,previous)]
    if max(angles)>maximum:maximum=max(angles);maximum_bone=list(rig.pose.bones)[angles.index(maximum)].name
   previous=current
   data=body.evaluated_get(bpy.context.evaluated_depsgraph_get()).data;coords=np.empty(len(data.vertices)*3);data.vertices.foreach_get('co',coords);minimum=min(minimum,float(coords.reshape((-1,3))[:,2].min()));maximum_paw_height=max(maximum_paw_height,float(coords.reshape((-1,3))[paw_vertices,2].min()))
  height=max(v.co.z for v in body.data.vertices)-min(v.co.z for v in body.data.vertices)
  result[name]=dict(duration=duration,minimumGround=minimum,minimumGroundAt30Cm=minimum*30/height,maximumLowestPawAt30Cm=maximum_paw_height*30/height,maximumBoneStepDegrees=math.degrees(maximum),maximumBoneStepBone=maximum_bone)
  print(label,name,result[name],flush=True)
  if label=='candidate':
   height=max(v.co.z for v in body.data.vertices)-min(v.co.z for v in body.data.vertices)
   if name=='walk_fwd_sniff 46' and maximum_paw_height>height*.05/30:failures.append('Walking paws lose ground support: '+str(maximum_paw_height*30/height)+' cm')
   if minimum < -height*.05/30:failures.append('Ground penetration: '+name+' '+str(minimum))
 report[label]=result
for name in report['candidate']:
 if abs(report['candidate'][name]['duration']-report['before'][name]['duration'])>1e-5:failures.append('Duration changed: '+name)
for name in [clip for clip in args.clips if clip!='idle_lay_pose 2']:
 if report['candidate'][name]['maximumBoneStepDegrees']>report['before'][name]['maximumBoneStepDegrees']:failures.append('Angular continuity regressed: '+name)
report['failures']=failures
out=args.report;out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n')
if failures:raise RuntimeError('; '.join(failures))
print('PASS exported candidate contacts at 240 Hz and unchanged durations.',flush=True);os._exit(0)
