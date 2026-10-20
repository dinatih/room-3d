"""Compare Inter-X native SMPL-X FK with exported GLB rotations; no runtime retargeting."""
import json
import struct
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np
from temp_interx_grounding import rotations
import zipfile

if '--rebuild-fab' in sys.argv:
    import runpy
    import os
    api=runpy.run_path(str(Path(__file__).with_name('import-fab-animations.py')),run_name='foot_importer')
    api['convert'](api['inventory']())
    sys.stdout.flush();sys.stderr.flush();os._exit(0)

if '--actorcore' in sys.argv:
    import bpy
    import runpy
    from mathutils import Quaternion
    source=Path('/home/dinatih/3D Resources/fab.com/Actorcore-Blender-1014-522994.zip')
    with zipfile.ZipFile(source) as archive:
        archive.extract('dual_gun_muzdn_mov_cool_shoot_279383.fbx','/tmp/room-feet-actorcore')
    api=runpy.run_path(str(Path(__file__).with_name('import-fab-animations.py')),run_name='foot_importer')
    arm=api['load'](Path('/tmp/room-feet-actorcore/dual_gun_muzdn_mov_cool_shoot_279383.fbx'))
    mapping=api['bone_map'](arm);align=Quaternion((1,0,0),-np.pi/2)
    print('NATIVE_ACTORCORE_OBJECTS',[(o.name,o.type) for o in bpy.context.scene.objects])
    print('NATIVE_ACTORCORE_RATE',bpy.context.scene.render.fps,bpy.context.scene.render.fps_base,arm.animation_data.action.frame_range[:])
    start=arm.animation_data.action.frame_range[0];fps=bpy.context.scene.render.fps/bpy.context.scene.render.fps_base
    output=[];meshes=[]
    for frame in [27,92]:
        time=start+frame/30*fps;bpy.context.scene.frame_set(int(time),subframe=time%1)
        evaluated=arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
        vertices=[];indices=[]
        for obj in bpy.context.scene.objects:
            if obj.type!='MESH' or obj.hide_render:continue
            evaluated_mesh=obj.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated_mesh.to_mesh();mesh.calc_loop_triangles()
            offset=len(vertices)
            vertices.extend([list(align@(evaluated_mesh.matrix_world@v.co)) for v in mesh.vertices])
            indices.extend(offset+i for triangle in mesh.loop_triangles for i in triangle.vertices)
            evaluated_mesh.to_mesh_clear()
        vertices=np.array(vertices);ankles=np.array([list(align@(evaluated.matrix_world@evaluated.pose.bones[mapping[s+'Foot']].matrix).translation) for s in ['Left','Right']]).mean(axis=0)
        vertices-=np.array([ankles[0],vertices[:,1].min(),ankles[2]])
        meshes.append({'recording':'ActorCore original','person':'FBX','frame':frame,'vertices':vertices.reshape(-1).tolist(),'indices':indices})
        for side in ['Left','Right']:
            foot=mapping[side+'Foot'];toe=mapping[side+'ToeBase']
            a=align@(arm.matrix_world@arm.data.bones[foot].head_local);b=align@(arm.matrix_world@arm.data.bones[toe].head_local)
            delta=(align@(evaluated.matrix_world@evaluated.pose.bones[foot].matrix).to_quaternion())@(align@(arm.matrix_world@arm.data.bones[foot].matrix_local).to_quaternion()).inverted()
            output.append({'frame':frame,'side':side,'restAnkle':list(a),'restToe':list(b),'delta':[delta.x,delta.y,delta.z,delta.w]})
    Path('/tmp/room-feet-actorcore-native.json').write_text(json.dumps(output,indent=2))
    Path('/tmp/room-feet-actorcore-native-meshes.json').write_text(json.dumps(meshes))
    native=[]
    rests={name:(align@(arm.matrix_world@arm.data.bones[mapping[name]].matrix_local).to_quaternion()).inverted() for name in ['LeftFoot','RightFoot','LeftToeBase','RightToeBase']}
    for frame in range(int(arm.animation_data.action.frame_range[1]-start)+1):
        bpy.context.scene.frame_set(int(start+frame))
        evaluated=arm.evaluated_get(bpy.context.evaluated_depsgraph_get())
        sample={}
        for name,rest in rests.items():
            q=(align@(evaluated.matrix_world@evaluated.pose.bones[mapping[name]].matrix).to_quaternion())@rest
            sample[name]=[q.x,q.y,q.z,q.w]
        native.append(sample)
    Path('/tmp/room-feet-actorcore-native-rotations.json').write_text(json.dumps({'fps':fps,'frames':native}))
    print('NATIVE_ACTORCORE',json.dumps(output,indent=2),flush=True)
    import os
    os._exit(0)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('/home/dinatih/3D Resources/animations/Inter-X_Dataset-motions/motions')

def quaternion(q):
    x,y,z,w=q
    return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)], [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)], [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])

def glb(path):
    data=path.read_bytes(); length=struct.unpack_from('<I',data,12)[0]
    doc=json.loads(data[20:20+length]);binary=data[28+length:]
    def array(index):
        a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
        return np.frombuffer(binary, dtype='<f4', count=a['count']*{'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']], offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],-1)
    parents={c:i for i,n in enumerate(doc['nodes']) for c in n.get('children',[])}
    def world(frame=None):
        local=[quaternion(n.get('rotation',[0,0,0,1])) for n in doc['nodes']]
        if frame is not None:
            for c in doc['animations'][0]['channels']:
                if c['target']['path']!='rotation':continue
                sampler=doc['animations'][0]['samplers'][c['sampler']];times=array(sampler['input'])[:,0]
                values=array(sampler['output']);t=frame/30
                i=min(int(np.searchsorted(times,t,side='right'))-1,len(times)-1)
                q=values[i].astype(float)
                if i+1<len(times):
                    other=values[i+1].astype(float);dot=np.dot(q,other)
                    if dot<0:other=-other;dot=-dot
                    alpha=(t-times[i])/(times[i+1]-times[i]);angle=np.arccos(np.clip(dot,-1,1))
                    q=(1-alpha)*q+alpha*other if angle<np.finfo(np.float32).eps else (np.sin((1-alpha)*angle)*q+np.sin(alpha*angle)*other)/np.sin(angle)
                local[c['target']['node']]=quaternion(q/np.linalg.norm(q))
        cached={}
        def get(i):
            if i not in cached:cached[i]=(get(parents[i]) if i in parents else np.eye(3))@local[i]
            return cached[i]
        return {n['name']:get(i) for i,n in enumerate(doc['nodes'])}
    world.nodes=doc['nodes']
    world.tracks={}
    world.offsets={}
    for channel in doc['animations'][0]['channels']:
        sampler=doc['animations'][0]['samplers'][channel['sampler']]
        key=doc['nodes'][channel['target']['node']]['name']+'.'+channel['target']['path']
        world.tracks[key]=(array(sampler['input']),array(sampler['output']))
        accessor=doc['accessors'][sampler['output']];view=doc['bufferViews'][accessor['bufferView']]
        world.offsets[key]=28+length+view.get('byteOffset',0)+accessor.get('byteOffset',0)
    return world

def xyzw(m):
    a,b,c=m[0];d,e,f=m[1];g,h,i=m[2]
    symmetric=np.array([[a-e-i,b+d,c+g,h-f],[b+d,e-a-i,f+h,c-g],[c+g,f+h,i-a-e,d-b],[h-f,c-g,d-b,a+e+i]])
    return np.linalg.eigh(symmetric)[1][:,-1]

if '--verify' in sys.argv or '--finalize' in sys.argv:
    import subprocess
    import hashlib
    report=json.loads((ROOT/'scripts/fab-import-report.json').read_text())
    checked=0;largest=0.
    for entry in report['imported']:
        path='public/'+entry['path'];new=glb(ROOT/path)
        asset=(ROOT/path).read_bytes();json_length=struct.unpack_from('<I',asset,12)[0]
        assert len(asset)==entry['bytes'] and hashlib.sha256(asset[28+json_length:]).hexdigest()==entry['motionHash'],path+' stale import fingerprint'
        original=subprocess.check_output(['git','show','HEAD:'+path],cwd=ROOT)
        temporary=Path('/tmp/room-feet-reference.glb');temporary.write_bytes(original);old=glb(temporary)
        if '--finalize' in sys.argv:
            # Keep the published rig and every non-foot byte. The importer was
            # rebuilt against a newer Xbot bind skeleton; its unrelated changes
            # must not enter this foot correction. World-space bind calibration
            # is constant, so recover it once and apply it to the original keys.
            old_world=old(0);new_world=new(0);old_rest=old();new_rest=new()
            corrections={name:np.linalg.inv(old_world[name])@new_world[name]@np.linalg.inv(new_rest[name])@old_rest[name] for name in old_world if name.endswith(('LeftFoot','RightFoot','LeftToeBase','RightToeBase'))}
            data=bytearray(original)
            for name,correction in corrections.items():
                key=name+'.rotation'
                if key not in old.tracks:continue
                values=old.tracks[key][1];converted=[]
                parent=np.linalg.inv(corrections[name.replace('ToeBase','Foot')]) if name.endswith('ToeBase') else np.eye(3)
                for q in values:
                    value=xyzw(parent@quaternion(q)@correction)
                    if np.dot(value,converted[-1] if converted else q)<0:value=-value
                    converted.append(value)
                encoded=np.asarray(converted,dtype='<f4').tobytes();offset=old.offsets[key];data[offset:offset+len(encoded)]=encoded
            (ROOT/path).write_bytes(data)
            json_length=struct.unpack_from('<I',data,12)[0]
            entry['motionHash']=hashlib.sha256(data[28+json_length:]).hexdigest();entry['bytes']=len(data)
            new=glb(ROOT/path)
        old_nodes={n['name']:n for n in old.nodes};new_nodes={n['name']:n for n in new.nodes}
        assert old_nodes.keys()==new_nodes.keys(),path+' changed bone names'
        for name,node in new_nodes.items():
            before=old_nodes[name]
            assert sorted(new.nodes[i]['name'] for i in node.get('children',[]))==sorted(old.nodes[i]['name'] for i in before.get('children',[])),path+' changed hierarchy'
            for prop,default in [('translation',[0,0,0]),('rotation',[0,0,0,1]),('scale',[1,1,1])]:
                np.testing.assert_array_equal(node.get(prop,default),before.get(prop,default),err_msg=path+' '+name+' '+prop)
        assert new.tracks.keys()==old.tracks.keys(),path+' changed the track set'
        for key,(times,values) in new.tracks.items():
            old_times,old_values=old.tracks[key]
            np.testing.assert_array_equal(times,old_times,err_msg=path+' '+key+' timing')
            if key.rsplit('.',1)[0].endswith(('LeftFoot','RightFoot','LeftToeBase','RightToeBase')) and key.endswith('.rotation'):continue
            difference=float(np.max(abs(values-old_values)));largest=max(largest,difference)
            np.testing.assert_array_equal(values,old_values,err_msg=path+' '+key)
        checked+=1
    if '--finalize' in sys.argv:
        original_report=json.loads(subprocess.check_output(['git','show','HEAD:scripts/fab-import-report.json'],cwd=ROOT))
        updated={entry['id']:entry for entry in report['imported']}
        for entry in original_report['imported']:
            entry.update({key:updated[entry['id']][key] for key in ['motionHash','bytes']})
        (ROOT/'scripts/fab-import-report.json').write_text(json.dumps(original_report,indent=2,ensure_ascii=False)+'\n')
    exported=glb(ROOT/'public/animations/fab/actorcore/dual-gun-muzdn-mov-cool-shoot-279383.glb')
    rest=exported();reference=json.loads(Path('/tmp/room-feet-actorcore-native-rotations.json').read_text());error=0.
    for i,sample in enumerate(reference['frames']):
        world=exported(i*30/reference['fps'])
        for name,q in sample.items():
            key='mixamorig:'+name;expected=quaternion(q);actual=world[key]@rest[key].T
            error=max(error,float(abs(expected-actual).max()))
            np.testing.assert_allclose(actual,expected,rtol=0,atol=1e-5,err_msg=f'ActorCore frame {i} {name}')
    before=json.loads(Path('/tmp/room-feet-before.json').read_text());after=json.loads(Path('/tmp/room-feet-after.json').read_text())
    assert before['gaits']==after['gaits'],'Mixamo walk/run retargeting changed'
    print(json.dumps({'fabClips':checked,'maxUnrelatedTrackDifference':largest,'actorcoreNativeFrames':len(reference['frames']),'maxNativeFootMatrixError':error,'mixamoWalkRun':'identical'},indent=2))
    sys.exit(0)

results=[]
meshes=[]
for recording,frames in [('G019T006A000R024',[25,174]),('G019T000A000R003',[138])]:
    for person in ['P1','P2']:
        motion=np.load(SOURCE/recording/(person+'.npz'))
        rot=rotations(np.concatenate([motion['root_orient'][:,None],motion['pose_body']],axis=1).astype(float))
        model=np.load(SOURCE.parent.parent/f"SMPLX_{str(motion['gender'].item()).upper()}.npz")
        beta=motion['betas'].reshape(-1)
        shaped=model['v_template']+np.einsum('vck,k->vc',model['shapedirs'][:,:,:len(beta)],beta)
        rest_joints=model['J_regressor']@shaped
        parents=model['kintree_table'][0].astype(np.int64)
        exported=glb(ROOT/'public/animations/npz/interx'/f'{recording.lower()}-{person.lower()}.glb');rest=exported()
        for frame in frames:
            f=frame*4
            local=rotations(np.concatenate([motion['root_orient'][f:f+1,None],motion['pose_body'][f:f+1],np.zeros((1,3,3)),motion['pose_lhand'][f:f+1],motion['pose_rhand'][f:f+1]],axis=1).astype(float))[0]
            world=np.empty_like(local);joints=np.empty((55,3));world[0]=local[0];joints[0]=rest_joints[0]
            for j in range(1,55):
                p=parents[j];world[j]=world[p]@local[j];joints[j]=joints[p]+world[p]@(rest_joints[j]-rest_joints[p])
            posed=shaped+(model['posedirs'].reshape(-1,486)@(local[1:]-np.eye(3)).reshape(-1)).reshape(-1,3)
            weights=model['weights'];blended=np.einsum('vj,jab->vab',weights,world)
            vertices=np.einsum('vab,vb->va',blended,posed)+weights@(joints-np.einsum('jab,jb->ja',world,rest_joints))
            ankles=joints[[7,8]].mean(axis=0);vertices-=np.array([ankles[0],vertices[:,1].min(),ankles[2]])
            meshes.append({'recording':recording,'person':person,'frame':frame,'vertices':vertices.reshape(-1).tolist(),'indices':model['f'].reshape(-1).tolist(),'feet':(joints[[7,8]]-np.array([ankles[0],0,ankles[2]])).tolist()})
            poses=exported(frame)
            for side,chain in [('Left',[0,1,4,7]),('Right',[0,2,5,8])]:
                native=np.eye(3)
                for joint in chain:native=native@rot[frame*4,joint]
                name='mixamorig'+side+'Foot';key=next(k for k in poses if k.replace(':','')==name)
                delta=poses[key]@rest[key].T
                angle=np.degrees(np.arccos(np.clip((np.trace(native.T@delta)-1)/2,-1,1)))
                results.append({'recording':recording,'person':person,'frame':frame,'side':side,'errorDegrees':float(angle),'nativeUp':native[:,1].tolist(),'exportedUp':delta[:,1].tolist()})
print(json.dumps(results,indent=2))
Path('/tmp/room-feet-native.json').write_text(json.dumps(results,indent=2))
Path('/tmp/room-feet-native-meshes.json').write_text(json.dumps(meshes))
