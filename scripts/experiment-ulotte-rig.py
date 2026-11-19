"""Experimental Ulotte motion reconstruction; publish only individually reviewed clips.
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/experiment-ulotte-rig.py -- --dog dachshund-sculpt --draft
Coordinates below are anatomical landmarks measured on the original sculpt.
"""
from pathlib import Path
import bpy, bmesh, math, os, tempfile, zipfile, json, argparse, sys, runpy
import numpy as np
from mathutils import Vector, Matrix, Quaternion
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--dog',choices=['dachshund-sculpt'],required=True)
parser.add_argument('--base-only',action='store_true')
parser.add_argument('--draft',action='store_true')
parser.add_argument('--output-dir',type=Path,default=Path('/tmp/ulotte-cycle-candidate'))
parser.add_argument('--clips',nargs='+')
parser.add_argument('--sample-fps',type=int,default=math.lcm(25,30,60,120))
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
DOG=args.dog
if not args.draft:raise ValueError('Experimental reconstruction requires --draft; merge only validated clips')
OUT=args.output_dir;EDIT=OUT
BASE_CLIPS=['idle 50','walk_fwd 29','run_fwd 13']
CLIPS=BASE_CLIPS if args.base_only else [entry['value'] for entry in json.loads((ROOT/'src/features/inventory/dogAnimationOptions.json').read_text())['animated-pitbull-dog']]
if args.clips:
    if len(set(args.clips))!=len(args.clips):raise ValueError('Duplicate clips')
    if args.base_only:raise ValueError('Choose clips or base-only')
    if set(args.clips)-set(CLIPS):raise ValueError('Unknown requested clip')
    CLIPS=args.clips
if args.sample_fps<=0:raise ValueError('Invalid sample rate')
bpy.ops.wm.read_factory_settings(use_empty=True)
with tempfile.TemporaryDirectory() as directory:
    with zipfile.ZipFile(Path.home()/'3D Resources/animals/dachshund-sculpt.zip') as archive:
        path=Path(directory)/'source.glb';path.write_bytes(archive.read('source/CocoSculpt.glb'))
    bpy.ops.import_scene.gltf(filepath=str(path))
meshes=list(bpy.context.scene.objects)
body=bpy.data.objects['CocoSculpt']
floor=min((body.matrix_world@v.co).z for v in body.data.vertices)
for obj in meshes:
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    for v in obj.data.vertices:v.co.z-=floor
bpy.context.view_layer.objects.active=body
modifier=body.modifiers.new('60k presentation mesh','DECIMATE');modifier.ratio=60000/len(body.data.vertices)
bpy.ops.object.modifier_apply(modifier=modifier.name)
# Recolour the coat's vertex colours, preserving the separate eyes.
for attribute in body.data.color_attributes:
    for entry in attribute.data:
        r,g,b,a=entry.color
        luminance=.2126*r+.7152*g+.0722*b
        entry.color=(luminance*.055,luminance*.055,luminance*.055,a)
# Use a lit coat material: the source's baked/unlit brown colours would
# otherwise become a flat black silhouette instead of a shaded black dog.
for material in body.data.materials:
    material.use_nodes=True;material.node_tree.nodes.clear()
    shader=material.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Roughness'].default_value=.6;shader.inputs['Metallic'].default_value=0
    colour=material.node_tree.nodes.new('ShaderNodeVertexColor');colour.layer_name=body.data.color_attributes[0].name
    output=material.node_tree.nodes.new('ShaderNodeOutputMaterial')
    material.node_tree.links.new(colour.outputs['Color'],shader.inputs['Base Color'])
    material.node_tree.links.new(shader.outputs['BSDF'],output.inputs['Surface'])
# Each head and tail is an actual joint, rather than a scaled donor bone vector.
heads={'Hips':(0,.60,.46),'Spine':(0,.43,.46),'Spine1':(0,.26,.46),'Spine2':(0,.09,.47),'Spine3':(0,-.08,.48),'Spine4':(0,-.22,.48),'Neck01':(0,-.33,.54),'Neck02':(0,-.40,.61),'Neck03':(0,-.47,.68),'Head':(0,-.55,.73)}
parents={name:previous for previous,name in zip(heads,list(heads)[1:])}
ends={'Head':(0,-.76,.68)}
for side,sign in [('Left',1),('Right',-1)]:
    chain=[('Shoulder',(.06,-.19,.43)),('Arm',(.115,-.17,.33)),('ForeArm',(.10,-.055,.18)),('Hand',(.10,-.105,.065)),('HandMiddle1',(.10,-.18,.035))]
    rear=[('Pelvis',(.07,.60,.43)),('UpLeg',(.125,.62,.37)),('Leg',(.14,.56,.23)),('Foot',(.13,.735,.11)),('ToeBase',(.135,.675,.035))]
    for items,parent in [(chain,'Spine4'),(rear,'Hips')]:
        for name,point in items:
            key=side+name;heads[key]=(point[0]*sign,point[1],point[2]);parents[key]=parent;parent=key
        ends[parent]=(heads[parent][0],heads[parent][1]-.045,heads[parent][2])
    for i,point in enumerate([(.12,-.47,.76),(.17,-.43,.66),(.17,-.40,.55)],1):
        name=side+('Ear' if i==1 else 'Ear'+str(i));heads[name]=(sign*point[0],point[1],point[2]);parents[name]='Head' if i==1 else side+('Ear' if i==2 else 'Ear2')
    ends[side+'Ear3']=(sign*.16,-.39,.51)
# Centreline measured in transverse sections through the sculpt's isolated tail.
tail=[(0,.78,.422),(0,.85,.388),(0,.92,.379),(0,.99,.382),(0,1.06,.394),(0,1.13,.415),(0,1.20,.444),(0,1.23,.462)]
for i in range(7):
    name=f'Tail{i+1:02d}';heads[name]=tail[i];ends[name]=tail[i+1];parents[name]='Hips' if i==0 else f'Tail{i:02d}'
# A non-deforming nose marker supports the scene's animal camera.
heads['Muzzle']=Vector(ends['Head']);parents['Muzzle']='Head';ends['Muzzle']=Vector(ends['Head'])+Vector((0,-.02,0))
children={parent:child for child,parent in parents.items() if not child.startswith(('Left','Right','Tail'))}
for side in ['Left','Right']:
    for suffixes in [('Shoulder','Arm','ForeArm','Hand','HandMiddle1'),('Pelvis','UpLeg','Leg','Foot','ToeBase'),('Ear','Ear2','Ear3')]:
        for a,b in zip(suffixes,suffixes[1:]):children[side+a]=side+b
arm=bpy.data.armatures.new(DOG+' anatomical skeleton');rig=bpy.data.objects.new(DOG+'Rig',arm);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,point in heads.items():
    b=arm.edit_bones.new(name);b.head=point;b.tail=ends[name] if name in ends else heads[children[name]]
    b.align_roll(Vector((1,0,0)));b.use_deform=name!='Muzzle'
for name,parent in parents.items():
    b=arm.edit_bones[name];b.parent=arm.edit_bones[parent]
    b.use_connect=(b.head-b.parent.tail).length<1e-6
bpy.ops.object.mode_set(mode='OBJECT');rig.show_in_front=True
# Closed weighting proxy keeps the heat solver independent of sculpt internals.
proxy=body.copy();proxy.data=body.data.copy();bpy.context.collection.objects.link(proxy)
bpy.ops.object.select_all(action='DESELECT');proxy.select_set(True);bpy.context.view_layer.objects.active=proxy
mod=proxy.modifiers.new('Closed weighting volume','REMESH');mod.mode='VOXEL';mod.voxel_size=.008
bpy.ops.object.modifier_apply(modifier=mod.name)
rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.parent_set(type='ARMATURE_AUTO')
if any(not v.groups for v in proxy.data.vertices):
    bpy.ops.wm.save_as_mainfile(filepath='/tmp/dog-heat-failure.blend');raise RuntimeError('Heat weighting failed')
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
mod=body.modifiers.new('Surface weights','DATA_TRANSFER');mod.object=proxy;mod.use_vert_data=True;mod.data_types_verts={'VGROUP_WEIGHTS'};mod.vert_mapping='POLYINTERP_NEAREST'
bpy.ops.object.datalayout_transfer(modifier=mod.name);bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(proxy,do_unlink=True)
for obj in meshes:
    obj.parent=rig;mod=obj.modifiers.new('Skin','ARMATURE');mod.object=rig
    if obj!=body:obj.vertex_groups.new(name='Head').add(list(range(len(obj.data.vertices))),1,'REPLACE')
# The detached eyes and rigid skull must use precisely the same transform.
for vertex in body.data.vertices:
    y,z=vertex.co.y,vertex.co.z
    neck_y,neck_z=(-.30,.45)
    w=max(0,min(1,(-y+neck_y)/.15))*max(0,min(1,(z-neck_z)/.15));w=w*w*(3-2*w)
    if w:
        head=body.vertex_groups['Head'];old=0
        for g in list(vertex.groups):
            if g.group==head.index:old=g.weight
            else:body.vertex_groups[g.group].add([vertex.index],g.weight*(1-w),'REPLACE')
        head.add([vertex.index],old*(1-w)+w,'REPLACE')
    if y>=tail[0][1] and abs(vertex.co.x)<.06 and z>.32:
        # Anatomical tail region: weights follow centreline arclength order.
        for g in list(vertex.groups):body.vertex_groups[g.group].remove([vertex.index])
        i=next((i for i in range(6) if y<tail[i+1][1]),6)
        if i==6:body.vertex_groups['Tail07'].add([vertex.index],1,'REPLACE')
        else:
            t=max(0,min(1,(y-tail[i][1])/(tail[i+1][1]-tail[i][1])))
            body.vertex_groups[f'Tail{i+1:02d}'].add([vertex.index],1-t,'REPLACE');body.vertex_groups[f'Tail{i+2:02d}'].add([vertex.index],t,'REPLACE')
# Match the four-influence skin used by glTF before contact calculations.
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);bpy.context.view_layer.objects.active=body
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL',limit=4)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL',lock_active=False)
if any(not v.groups for v in body.data.vertices):raise RuntimeError('Unweighted sculpt vertices')
GROUND_EPSILON=(max(v.co.z for v in body.data.vertices)-min(v.co.z for v in body.data.vertices))*1e-4
before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/characters/animated-pitbull-dog/dog.glb'))
source_objects=set(bpy.data.objects)-before;source=next(o for o in source_objects if o.type=='ARMATURE')
for o in source_objects:
    if o.type=='MESH':o.hide_viewport=True
for track in list(source.animation_data.nla_tracks):source.animation_data.nla_tracks.remove(track)
scene=bpy.context.scene;scene.render.fps=24
source_continuity=runpy.run_path(str(ROOT/'scripts/dog-animation-curves.py'))['make_actions_continuous'](bpy.data.actions)
print('SOURCE_CONTINUITY',source_continuity,flush=True)
source.animation_data.action=bpy.data.actions['idle 50'];source.animation_data.action_slot=source.animation_data.action.slots[0];scene.frame_set(0)
base={n:(source.matrix_world@source.pose.bones['Head' if n=='Muzzle' else n].matrix).copy() for n in heads}
rest={n:b.matrix_local.copy() for n,b in arm.bones.items()}
# IK solves the real short limb lengths. Donor feet supply contact timing/stride.
controls={};ratios={};sole={}
for side in ['Left','Right']:
    for upper,lower,foot in [('Arm','ForeArm','Hand'),('UpLeg','Leg','Foot')]:
        end=side+foot;first=side+upper;middle=side+lower
        target=bpy.data.objects.new(end+' IK',None);bpy.context.collection.objects.link(target)
        controls[end]=(target,middle)
        target_length=(Vector(heads[first])-Vector(heads[middle])).length+(Vector(heads[middle])-Vector(heads[end])).length
        source_length=(base[first].translation-base[middle].translation).length+(base[middle].translation-base[end].translation).length
        ratios[end]=target_length/source_length
        # Vertices whose strongest influence is this paw define its actual sole.
        group_names={end,side+('HandMiddle1' if foot=='Hand' else 'ToeBase')}
        vertices=[v.co.copy() for v in body.data.vertices if v.groups and body.vertex_groups[max(v.groups,key=lambda g:g.weight).group].name in group_names]
        if not vertices:raise RuntimeError('Missing sole geometry '+end)
        sole[end]=[rest[end].inverted()@p for p in vertices]
# Donor paw geometry defines lift independently of ankle pitch. This keeps
# seated, waving and lying paws from being mistaken for standing contacts.
source_soles={}
source_body=max((o for o in source_objects if o.type=='MESH' and o.vertex_groups),key=lambda o:len(o.data.vertices))
for name in controls:
    bone=source.data.bones[name]
    descendants={bone.name}|{b.name for b in bone.children_recursive}
    bind=(source.matrix_world@bone.matrix_local).inverted()
    source_soles[name]=[bind@(source_body.matrix_world@v.co) for v in source_body.data.vertices if v.groups and source_body.vertex_groups[max(v.groups,key=lambda g:g.weight).group].name in descendants]
    if not source_soles[name]:raise RuntimeError('Missing donor sole '+name)
root_ratio=sum(ratios.values())/len(ratios)
def solve_limbs(fk):
    def frame(axis,normal):
        y=axis.normalized();z=normal.cross(y).normalized();x=y.cross(z).normalized()
        return Matrix((x,y,z)).transposed().to_quaternion()
    def assign(name,matrix,parent_matrix):
        bone=arm.bones[name]
        rig.pose.bones[name].matrix_basis=bone.convert_local_to_pose(matrix,bone.matrix_local,invert=True,parent_matrix=parent_matrix,parent_matrix_local=bone.parent.matrix_local)
    for end,(target,middle) in controls.items():
        first=arm.bones[middle].parent.name
        start=rig.pose.bones[first].matrix.translation.copy();goal=target.location.copy()
        a=arm.bones[first].length;b=arm.bones[middle].length
        reach=goal-start;distance=reach.length
        if distance==0:raise RuntimeError('Undefined limb axis')
        axis=reach/distance;distance=min(a+b,max(abs(a-b),distance))
        upper=Vector(heads[middle])-Vector(heads[first]);lower=Vector(heads[end])-Vector(heads[middle])
        native_axis=(upper+lower).normalized();native_normal=upper.cross(lower).normalized()
        native_pole=(upper-native_axis*upper.dot(native_axis)).normalized()
        reference='Spine4' if end.endswith('Hand') else 'Hips'
        body_rotation=fk[reference].to_quaternion()@rest[reference].to_quaternion().inverted()
        swing=native_axis.rotation_difference(body_rotation.inverted()@axis)
        pole=body_rotation@(swing@native_pole);normal=body_rotation@(swing@native_normal)
        along=(a*a-b*b+distance*distance)/(2*distance)
        joint=start+axis*along+pole*math.sqrt(max(0,a*a-along*along))
        finish=start+axis*distance
        parent_matrix=rig.pose.bones[arm.bones[first].parent.name].matrix.copy()
        for name,old,new,head in [(first,upper,joint-start,start),(middle,lower,finish-joint,joint)]:
            rotation=frame(new,normal)@frame(old,native_normal).inverted()@rest[name].to_quaternion()
            matrix=rotation.to_matrix().to_4x4();matrix.translation=head;assign(name,matrix,parent_matrix);parent_matrix=matrix
        matrix=fk[end].to_quaternion().to_matrix().to_4x4();matrix.translation=finish;assign(end,matrix,parent_matrix)

head_groups={arm.bones['Neck01'].name}|{b.name for b in arm.bones['Neck01'].children_recursive}
head_surface=np.array([v.index for v in body.data.vertices if body.vertex_groups[max(v.groups,key=lambda g:g.weight).group].name in head_groups])
if not len(head_surface):raise RuntimeError('Empty head contact surface')
body_surface=np.setdiff1d(np.arange(len(body.data.vertices)),head_surface)
if not len(body_surface):raise RuntimeError('Empty trunk contact surface')
def lift_head_contact():
    # Correct cervical pitch before solving the body. Feet and pelvis remain
    # planted; a dipping nose must never lift all four paw targets.
    while True:
        data=body.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
        coords=np.empty(len(data.vertices)*3);data.vertices.foreach_get('co',coords)
        skin=coords.reshape((-1,3));minimum=float(skin[head_surface,2].min())
        if minimum>=-GROUND_EPSILON:return
        neck=rig.pose.bones['Neck01'];pivot=neck.matrix.translation.copy()
        nose=rig.pose.bones['Muzzle'].matrix.translation.copy();forward=nose-pivot
        horizontal=Vector((forward.x,forward.y,0));length=horizontal.length
        if length==0:raise RuntimeError('Undefined muzzle heading')
        native=Vector(heads['Muzzle'])-Vector(heads['Neck01'])
        maximum=math.atan2(native.z,math.hypot(native.x,native.y))-math.atan2(forward.z,length)
        if maximum<=0:
            # Leave half the existing exported contact budget for the body
            # projection and interpolation; never accept a larger residual.
            budget=(max(v.co.z for v in body.data.vertices)-min(v.co.z for v in body.data.vertices))*(.05/30)/2
            if minimum>=-budget:
                print('CERVICAL_LIMIT_WITHIN_CONTACT_BUDGET',clip,frame,minimum,flush=True);return
            raise RuntimeError('Cervical contact limit: '+str(dict(clip=clip,frame=frame,pivot=list(pivot),nose=list(nose),minimum=minimum)))
        angle=min(maximum,math.atan2(-minimum,length))
        rotation=Quaternion(horizontal.cross(Vector((0,0,1))).normalized(),angle)
        matrix=(rotation@neck.matrix.to_quaternion()).to_matrix().to_4x4();matrix.translation=pivot
        parent=neck.parent
        neck.matrix_basis=neck.bone.convert_local_to_pose(matrix,neck.bone.matrix_local,invert=True,parent_matrix=parent.matrix,parent_matrix_local=parent.bone.matrix_local)
        bpy.context.view_layer.update()
        check=body.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
        positions=np.empty(len(check.vertices)*3);check.vertices.foreach_get('co',positions)
        if float(positions.reshape((-1,3))[head_surface,2].min())<=minimum:raise RuntimeError('Cervical contact solve stalled')

new_actions=[]
for clip in CLIPS:
    action=bpy.data.actions[clip];source.animation_data.action=action;source.animation_data.action_slot=action.slots[0]
    start,end=action.frame_range
    # Solve on continuous source poses rather than interpolating contacts
    # baked from the donor's discontinuous STEP curves.
    frequency=args.sample_fps if clip in BASE_CLIPS or any(key in clip for key in ['shake','sniff','lay','pee','poop']) else scene.render.fps
    step=scene.render.fps/frequency
    frames=sorted({float(start),float(end)}|{float(start+i*step) for i in range(math.ceil((end-start)/step))})
    samples=[]
    for frame in frames:
        scene.frame_set(int(frame),subframe=frame%1);bpy.context.view_layer.update()
        samples.append((frame,{n:(source.matrix_world@source.pose.bones['Head' if n=='Muzzle' else n].matrix).copy() for n in heads}))
    contact={n:min(p[n].translation.z for _,p in samples) for n in controls}
    result=bpy.data.actions.new('New|'+clip);rig.animation_data_create();rig.animation_data.action=result
    for obj in meshes:obj.hide_viewport=True
    poses=[]
    if clip not in BASE_CLIPS:body.hide_viewport=False
    for frame,posed in samples:
        matrices={}
        hip_delta=posed['Hips'].translation-base['Hips'].translation
        root_motion=Vector((0,0,hip_delta.z*root_ratio)) if clip in BASE_CLIPS else hip_delta*root_ratio
        correction=Matrix.Identity(4).to_quaternion()
        if clip not in BASE_CLIPS:
            # Preserve the torso length while matching the donor's chest rise.
            # A long teckel cannot copy the pitch angle of the shorter pitbull.
            rest_axis=Vector(heads['Spine4'])-Vector(heads['Hips'])
            base_axis=base['Spine4'].translation-base['Hips'].translation
            donor_axis=posed['Spine4'].translation-posed['Hips'].translation
            rise=rest_axis.z+(donor_axis.z-base_axis.z)*root_ratio
            length=rest_axis.length
            rise=max(-length,min(length,rise))
            horizontal=Vector((donor_axis.x,donor_axis.y,0)).normalized()*math.sqrt(max(0,length*length-rise*rise))
            desired_axis=Vector((horizontal.x,horizontal.y,rise))
            hip_rotation=posed['Hips'].to_quaternion()@base['Hips'].to_quaternion().inverted()
            correction=(hip_rotation@rest_axis).rotation_difference(desired_axis)

        for n,bone in arm.bones.items():
            world_delta=posed[n].to_quaternion()@base[n].to_quaternion().inverted()
            rotation=correction@world_delta@rest[n].to_quaternion()
            parent=bone.parent
            local_rest=parent.matrix_local.inverted()@bone.matrix_local if parent else bone.matrix_local
            parent_rotation=matrices[parent.name].to_quaternion() if parent else Matrix.Identity(4).to_quaternion()
            pb=rig.pose.bones[n];pb.rotation_mode='QUATERNION';pb.rotation_quaternion=local_rest.to_quaternion().inverted()@parent_rotation.inverted()@rotation
            pb.location=((root_motion if clip in BASE_CLIPS else rest[n].to_3x3().inverted()@root_motion) if parent is None else Vector())
            pb.scale=(1,1,1)
            matrices[n]=(matrices[parent.name] if parent else Matrix.Identity(4))@local_rest@pb.matrix_basis
        for n,(target,middle) in controls.items():
            delta=posed[n].translation-base[n].translation
            if clip in BASE_CLIPS:
                position=Vector(heads[n])+Vector((delta.x,delta.y,0))*ratios[n]
            else:
                # Preserve world-space planted contacts. Pelvis pitch must
                # not swing the neutral foot offsets behind the chest.
                base_axis=base['Spine4'].translation-base['Hips'].translation
                posed_axis=posed['Spine4'].translation-posed['Hips'].translation
                yaw=math.atan2(posed_axis.x,-posed_axis.y)-math.atan2(base_axis.x,-base_axis.y)
                heading=Quaternion((0,0,1),yaw)
                base_relative=base[n].translation-base['Hips'].translation
                posed_relative=posed[n].translation-posed['Hips'].translation
                limb_delta=posed_relative-heading@base_relative
                position=Vector(heads['Hips'])+root_motion+heading@(Vector(heads[n])-Vector(heads['Hips']))+Vector((limb_delta.x,limb_delta.y,0))*ratios[n]
            rotation=matrices[n].to_quaternion()
            clearance=-min((rotation@p).z for p in sole[n])
            if clip in BASE_CLIPS:
                position.z=clearance+(posed[n].translation.z-contact[n])*ratios[n]
            else:
                donor_sole=posed[n].translation.z+min((posed[n].to_quaternion()@p).z for p in source_soles[n])
                baseline_sole=base[n].translation.z+min((base[n].to_quaternion()@p).z for p in source_soles[n])
                # Physical ground constraint: the sole cannot pass through Y=0.
                position.z=clearance+max(0,donor_sole-baseline_sole)*ratios[n]
            target.location=position;target.rotation_mode='QUATERNION';target.rotation_quaternion=rotation
        bpy.context.view_layer.update();solve_limbs(matrices);bpy.context.view_layer.update()
        if clip not in BASE_CLIPS:
            head_after_body=rig.pose.bones['Neck01'].matrix.translation.z<=0
            if not head_after_body:lift_head_contact()
            contact_surface=body_surface if head_after_body else np.arange(len(body.data.vertices))
            # Solve actual skin/ground contact, including belly and rump. The
            # donor's pelvis height cannot encode a different dog's body depth.
            previous=None;last_move=None
            while True:
                depsgraph=bpy.context.evaluated_depsgraph_get()
                skin=body.evaluated_get(depsgraph).data
                coordinates=np.empty(len(skin.vertices)*3,dtype=np.float32)
                skin.vertices.foreach_get('co',coordinates)
                points=coordinates.reshape((-1,3));index=int(contact_surface[np.argmin(points[contact_surface,2])]);minimum=float(points[index,2])
                if not math.isfinite(minimum):raise FloatingPointError(f'Invalid skin coordinates: {DOG} {clip} {frame}')
                if minimum>=-GROUND_EPSILON:break
                if previous is not None and abs(previous-minimum)<1e-8:
                    if last_move=='rigid':raise RuntimeError(f'Ground solve stalled after rigid projection: {DOG} {clip} {frame}: {minimum}')
                    # A saturated limb cannot move the colliding skin point.
                    # Project the complete constrained pose onto the plane,
                    # moving the pelvis and all four IK targets together.
                    root_motion.z-=minimum
                    rig.pose.bones['Hips'].location=rest['Hips'].to_3x3().inverted()@root_motion
                    for target,_ in controls.values():target.location.z-=minimum
                    previous=minimum;last_move='rigid';bpy.context.view_layer.update();solve_limbs(matrices);bpy.context.view_layer.update();continue
                previous=minimum
                vertex=body.data.vertices[index]
                group=body.vertex_groups[max(vertex.groups,key=lambda g:g.weight).group].name
                paw=next((name for name in controls if group==name or group in {b.name for b in arm.bones[name].children_recursive}),None)
                last_move='paw' if paw else 'pelvis'
                if paw:controls[paw][0].location.z-=minimum
                else:
                    root_motion.z-=minimum
                    rig.pose.bones['Hips'].location=rest['Hips'].to_3x3().inverted()@root_motion
                bpy.context.view_layer.update();solve_limbs(matrices);bpy.context.view_layer.update()
            if head_after_body:lift_head_contact()
        evaluated=rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
        poses.append((frame,{n:pb.matrix.copy() for n,pb in evaluated.pose.bones.items()}))
    # Bake evaluated IK to local rotations, with fixed rest offsets and scales.
    for frame,world in poses:
        for n,bone in arm.bones.items():
            kwargs={} if bone.parent is None else dict(parent_matrix=world[bone.parent.name],parent_matrix_local=bone.parent.matrix_local)
            basis=bone.convert_local_to_pose(world[n],bone.matrix_local,invert=True,**kwargs)
            loc,quat,scale=basis.decompose();pb=rig.pose.bones[n];pb.location=loc;pb.rotation_quaternion=quat;pb.scale=(1,1,1)
            if bone.parent is None:pb.keyframe_insert('location',frame=frame-start)
            pb.keyframe_insert('rotation_quaternion',frame=frame-start)
    result.use_fake_user=True;new_actions.append((result,clip));print('BAKED',clip,len(poses),flush=True)
for pb in rig.pose.bones:
    for constraint in list(pb.constraints):pb.constraints.remove(constraint)
for objects in controls.values():bpy.data.objects.remove(objects[0],do_unlink=True)
for obj in list(bpy.data.objects):
    if obj not in meshes and obj!=rig:bpy.data.objects.remove(obj,do_unlink=True)
for armature in list(bpy.data.armatures):
    if armature!=rig.data:bpy.data.armatures.remove(armature)
for action in list(bpy.data.actions):
    if action not in [a for a,_ in new_actions]:bpy.data.actions.remove(action)
for action,name in new_actions:
    action.name=name
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:key.interpolation='LINEAR'
runpy.run_path(str(ROOT/'scripts/dog-animation-curves.py'))['make_actions_continuous']([a for a,_ in new_actions])
rig.animation_data.action=new_actions[0][0];rig.animation_data.action_slot=rig.animation_data.action.slots[0];scene.frame_set(0)
for obj in meshes:obj.hide_viewport=False
for image in bpy.data.images:
    if image.has_data and not image.packed_file:image.pack()
OUT.mkdir(parents=True,exist_ok=True);EDIT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(EDIT/'dachshund.blend'),compress=True)
for obj in meshes:obj.hide_viewport=True
bpy.ops.export_scene.gltf(filepath=str(OUT/'dog.glb'),export_format='GLB',export_animations=True,export_skins=True,export_animation_mode='ACTIONS',export_force_sampling=False)
print('EXPORTED',DOG,len(CLIPS),'CLIPS',flush=True);os._exit(0)
