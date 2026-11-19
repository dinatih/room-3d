"""Measure exported donor/before/after rigs, not the in-memory build.

blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/validate-ushiro-anatomy.py
Baseline: git show 300b8d54:public/characters/ushiro/ushiro.glb > /tmp/ushiro-before-rebuild.glb
"""
from pathlib import Path
import bpy, json, math, os, argparse, sys, runpy
import numpy as np
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/ushiro/rebuild'
parser=argparse.ArgumentParser();parser.add_argument('--draft',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
models=[('donor',ROOT/'public/characters/animated-pitbull-dog/dog.glb'),
        ('before',Path('/tmp/ushiro-before-rebuild.glb')),('after',Path('/tmp/ushiro-candidate.glb') if args.draft else ROOT/'public/characters/ushiro/ushiro.glb')]
clips=['idle 50','walk_fwd 29','run_fwd 13','idle_shake_1. 137','idle_shake_2. 81']
report={};failures=[]
for label,path in models:
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(path))
    rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
    for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
    rig.animation_data.action=None
    for pb in rig.pose.bones:pb.matrix_basis=__import__('mathutils').Matrix.Identity(4)
    bpy.context.view_layer.update()
    meshes=[o for o in bpy.data.objects if o.type=='MESH' and o.vertex_groups]
    body=max(meshes,key=lambda o:len(o.data.vertices))
    if label=='after':
        if len(bpy.data.actions) not in ([3,11] if args.draft else [119]):raise AssertionError('Animation catalog is incomplete')
        if any(a.frame_range[1]<=a.frame_range[0] for a in bpy.data.actions):raise AssertionError('Zero-duration clip')
        if any('_jnt' in b.name for b in rig.data.bones):raise AssertionError('Legacy rig retained')
        for obj in meshes:
            for vertex in obj.data.vertices:
                if len(vertex.groups)>4 or abs(sum(g.weight for g in vertex.groups)-1)>1e-5:raise AssertionError('Invalid exported skin weights')
    if label=='donor':runpy.run_path(str(ROOT/'scripts/dog-animation-curves.py'))['make_actions_continuous'](bpy.data.actions)
    segments=[]
    for side in ['Left','Right']:
        for chain in ([['Arm','ForeArm','Hand'],['UpLeg','Leg','Foot']] if label=='before' else [['Shoulder01','Arm','ForeArm','Hand'],['Pelvis','UpLeg','Leg','Foot']]):
            segments.extend((side+a,side+b) for a,b in zip(chain,chain[1:]))
    initial_lengths={a+'-'+b:(rig.pose.bones[a].matrix.translation-rig.pose.bones[b].matrix.translation).length for a,b in segments}
    result=dict(bones=len(rig.data.bones),clips=len(bpy.data.actions),measurements={})
    for clip in clips:
        action=bpy.data.actions[clip];rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
        start,end=action.frame_range;duration=(end-start)/bpy.context.scene.render.fps
        samples=[];maximum_length_error=0.
        # 240 Hz also probes halfway between the 600 Hz bake keys.
        times=sorted({float(duration)}|{i/240 for i in range(math.ceil(duration*240))})
        for time in times:
            frame=start+time*bpy.context.scene.render.fps;bpy.context.scene.frame_set(int(frame),subframe=frame%1);bpy.context.view_layer.update()
            points={pb.name:rig.matrix_world@pb.matrix.translation for pb in rig.pose.bones}
            def angle(a,b,c):return math.degrees((points[a]-points[b]).angle(points[c]-points[b]))
            angles={}
            for side in ['Left','Right']:
                fore=['Arm','ForeArm','Hand'] if label=='before' else ['Shoulder01','Arm','ForeArm']
                rear=['UpLeg','Leg','Foot'] if label=='before' else ['Pelvis','UpLeg','Leg']
                angles[side+'Elbow']=angle(*(side+n for n in fore));angles[side+'Knee']=angle(*(side+n for n in rear))
                if label!='before':
                    angles[side+'Carpus']=angle(*(side+n for n in ['Arm','ForeArm','Hand']))
                    angles[side+'Hock']=angle(*(side+n for n in ['UpLeg','Leg','Foot']))
            for a,b in segments:
                length=(rig.pose.bones[a].matrix.translation-rig.pose.bones[b].matrix.translation).length
                maximum_length_error=max(maximum_length_error,abs(length-initial_lengths[a+'-'+b]))
            graph=bpy.context.evaluated_depsgraph_get();minimum=math.inf
            for obj in meshes:
                if not obj.get('groundContactSurface',True):continue
                data=obj.evaluated_get(graph).data;coords=np.empty(len(data.vertices)*3,dtype=np.float64);data.vertices.foreach_get('co',coords)
                coordinates=coords.reshape((-1,3));matrix=np.array(obj.matrix_world,dtype=np.float64)
                world_z=coordinates@matrix[2,:3]+matrix[2,3]
                minimum=min(minimum,float(world_z.min()))
            samples.append(dict(time=time,phase=time/duration,ground=minimum,angles=angles))
        if label=='after':
            height=max(v.co.z for v in body.data.vertices)-min(v.co.z for v in body.data.vertices)
            # 0.01 cm in the app's 40 cm presentation height, also between bake keys.
            tolerance=height*.01/40
            if min(s['ground'] for s in samples)<-tolerance:failures.append('Exported skin penetrates ground: '+clip+' minimum='+str(min(s['ground'] for s in samples)))
            if maximum_length_error>height*1e-5:raise AssertionError('Limb length changes: '+clip)
        result['measurements'][clip]=dict(duration=duration,samples=samples,maximumLengthError=maximum_length_error,
            minimumGround=min(s['ground'] for s in samples))
        print('VALIDATED',label,clip,len(samples),'ground',result['measurements'][clip]['minimumGround'],flush=True)
    report[label]=result

errors={}
for clip in clips:
    reference=report['donor']['measurements'][clip]['samples']
    errors[clip]={}
    for label in ['before','after']:
        samples=report[label]['measurements'][clip]['samples']
        if len(samples)!=len(reference):raise AssertionError('Duration mismatch')
        joints={}
        for joint in ['LeftElbow','RightElbow','LeftKnee','RightKnee']:
            joints[joint]=float(np.sqrt(np.mean([(s['angles'][joint]-d['angles'][joint])**2 for s,d in zip(samples,reference)])))
        errors[clip][label]=dict(jointRMSEDegrees=joints,meanRMSEDegrees=sum(joints.values())/len(joints))
    # Angle matching is reported, not used as proof of skin quality. It must
    # not reward crushing the sculpt or copying the donor's penetrations.
report['angleErrors']=errors
report['failures']=failures
(OUT/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
if failures:
    for failure in failures:print('FAIL:',failure,flush=True)
    os._exit(1)
print('PASS:',report['after']['clips'],'clips, valid skin, fixed limb lengths, ground clearance at 240 Hz including off-grid samples; angle differences reported separately.',flush=True)
os._exit(0)
