"""Rebuild either dog from source geometry with a new anatomical skeleton and IK.
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-dogs.py -- --dog dachshund-sculpt
Coordinates below are anatomical landmarks measured on the original sculpt.
"""
from pathlib import Path
import bpy, bmesh, math, os, tempfile, zipfile, json, argparse, sys
import numpy as np
from mathutils import Vector, Matrix, Quaternion
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--dog',choices=['dachshund-sculpt','ushiro'],required=True)
parser.add_argument('--base-only',action='store_true')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
DOG=args.dog
OUT=ROOT/'public/characters'/DOG
EDIT=ROOT/'artifacts'/DOG
BASE_CLIPS=['idle 50','walk_fwd 29','run_fwd 13']
CLIPS=BASE_CLIPS if args.base_only else [entry['value'] for entry in json.loads((ROOT/'src/features/inventory/dogAnimationOptions.json').read_text())['animated-pitbull-dog']]
bpy.ops.wm.read_factory_settings(use_empty=True)
if DOG=='dachshund-sculpt':
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

else:
    work=Path(tempfile.mkdtemp(prefix='ushiro-new-rig-'))
    with zipfile.ZipFile(Path.home()/'3D Resources/animals/shiba-inu-texture-updated.zip') as archive:archive.extractall(work)
    bpy.ops.wm.open_mainfile(filepath=str(work/'source/Shibaa.blend'))
    old_rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
    for track in list(old_rig.animation_data.nla_tracks):old_rig.animation_data.nla_tracks.remove(track)
    a=bpy.data.actions['standing_skeletal.3'];old_rig.animation_data.action=a;old_rig.animation_data.action_slot=a.slots[0];bpy.context.scene.frame_set(0);bpy.context.view_layer.update()
    names={b.name.rsplit('.',1)[0]:b.name for b in old_rig.pose.bones}
    guide={n:(old_rig.matrix_world@old_rig.pose.bones[k].matrix.translation).copy() for n,k in names.items()}
    guide_ends={n:(old_rig.matrix_world@old_rig.pose.bones[k].tail).copy() for n,k in names.items()}
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    body=max(meshes,key=lambda o:len(o.data.vertices))
    # Replace legacy Windows-path datablocks with the supplied texture files.
    # Pack fresh images so the editable artifact has no external dependency.
    for image in list(bpy.data.images):
        path=work/'textures'/image.filepath.replace(chr(92),'/').rsplit('/',1)[-1]
        if not path.is_file():continue
        replacement=bpy.data.images.load(str(path),check_existing=False)
        replacement.colorspace_settings.name=image.colorspace_settings.name
        replacement.pack()
        for material in bpy.data.materials:
            if material.use_nodes:
                for node in material.node_tree.nodes:
                    if node.type=='TEX_IMAGE' and node.image==image:node.image=replacement
        bpy.data.images.remove(image)
    # Original eye Add Shader is not a glTF material. Preserve its existing atlas.
    for material in bpy.data.materials:
        if not material.use_nodes:continue
        if not any(n.type=='BSDF_PRINCIPLED' for n in material.node_tree.nodes):
            atlas=next(n.image for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image)
            material.node_tree.nodes.clear();shader=material.node_tree.nodes.new('ShaderNodeBsdfPrincipled');shader.inputs['Roughness'].default_value=.3
            texture=material.node_tree.nodes.new('ShaderNodeTexImage');texture.image=atlas;output=material.node_tree.nodes.new('ShaderNodeOutputMaterial')
            material.node_tree.links.new(texture.outputs['Color'],shader.inputs['Base Color']);material.node_tree.links.new(shader.outputs['BSDF'],output.inputs['Surface'])
    for material in bpy.data.materials:
        if not material.use_nodes:continue
        normal=next((n for n in material.node_tree.nodes if n.type=='NORMAL_MAP'),None)
        texture=next((n for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and 'normal' in n.image.name.lower()),None)
        shader=next((n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if normal and texture and shader:
            texture.image.colorspace_settings.name='Non-Color';normal.inputs['Strength'].default_value=1
            for link in list(material.node_tree.links):
                if link.to_node==normal:material.node_tree.links.remove(link)
            material.node_tree.links.new(texture.outputs['Color'],normal.inputs['Color'])
            material.node_tree.links.new(normal.outputs['Normal'],shader.inputs['Normal'])
    # Freeze visible standing geometry, then discard ALL old modifiers, groups,
    # constraints, actions and the armature. No old skin weights survive.
    depsgraph=bpy.context.evaluated_depsgraph_get()
    for obj in meshes:
        data=bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph),preserve_all_data_layers=True,depsgraph=depsgraph)
        world=obj.matrix_world.copy();obj.parent=None;obj.matrix_world=world
        obj.modifiers.clear();obj.data=data;obj.vertex_groups.clear()
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    floor=min(v.co.z for v in body.data.vertices)
    for obj in meshes:
        for vertex in obj.data.vertices:vertex.co.z-=floor
    for point in list(guide.values())+list(guide_ends.values()):point.z-=floor
    for obj in list(bpy.data.objects):
        if obj not in meshes:bpy.data.objects.remove(obj,do_unlink=True)
    for action in list(bpy.data.actions):bpy.data.actions.remove(action)
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
if DOG=='ushiro':
    def midpoint(a,b):return (guide[a]+guide[b])/2
    heads={'Hips':guide['pelvis_jnt'],'Spine':midpoint('pelvis_jnt','spine_1_jnt'),'Spine1':guide['spine_1_jnt'],'Spine2':midpoint('spine_1_jnt','spine_2_jnt'),'Spine3':guide['spine_2_jnt'],'Spine4':guide['chest_jnt'],'Neck01':guide['neck_base_jnt'],'Neck02':guide['neck_mid_jnt'],'Neck03':midpoint('neck_mid_jnt','head_jnt'),'Head':guide['head_jnt']}
    parents={name:previous for previous,name in zip(heads,list(heads)[1:])}
    ends={'Head':guide_ends['head_jnt']}
    for side,initial in [('Left','L'),('Right','R')]:
        for chain,parent in [([('Shoulder','clavicle'),('Arm','shoulder'),('ForeArm','elbow'),('Hand','wrist'),('HandMiddle1','hand')],'Spine4'),([('Pelvis',None),('UpLeg','hip'),('Leg','knee'),('Foot','ankle'),('ToeBase','foot')],'Hips')]:
            for name,old_name in chain:
                key=side+name;heads[key]=(guide['pelvis_jnt']+guide[initial+'_hip_jnt'])/2 if old_name is None else guide[f'{initial}_{old_name}_jnt']
                parents[key]=parent;parent=key
            ends[parent]=guide_ends[f'{initial}_{chain[-1][1]}_jnt']
        ear_base=guide[initial+'_ear_base_jnt'];ear_tip=guide[initial+'_ear_tip_jnt']
        for suffix,point in [('Ear',ear_base),('Ear2',(ear_base+ear_tip)/2),('Ear3',ear_tip)]:
            name=side+suffix;heads[name]=point;parents[name]='Head' if suffix=='Ear' else side+('Ear' if suffix=='Ear2' else 'Ear2')
        ends[side+'Ear3']=guide_ends[initial+'_ear_tip_jnt']
    tail=[guide[f'tail_{i}_jnt'] for i in range(1,8)]+[guide_ends['tail_7_jnt']]
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
if DOG=='ushiro':
    bm=bmesh.new();bm.from_mesh(proxy.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
    bmesh.ops.holes_fill(bm,edges=[e for e in bm.edges if e.is_boundary],sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(proxy.data);bm.free()
mod=proxy.modifiers.new('Closed weighting volume','REMESH');mod.mode='VOXEL';mod.voxel_size=.008
bpy.ops.object.modifier_apply(modifier=mod.name)
if DOG=='ushiro':
    # Voxelisation can create detached closed specks. Solve on the connected
    # body volume containing the surface nearest the pelvis; visible geometry
    # is never removed and still receives interpolated skin weights.
    bm=bmesh.new();bm.from_mesh(proxy.data)
    pelvis=Vector(heads['Hips']);seed=min(bm.verts,key=lambda v:(v.co-pelvis).length_squared)
    connected={seed};stack=[seed]
    while stack:
        vertex=stack.pop()
        for edge in vertex.link_edges:
            neighbor=edge.other_vert(vertex)
            if neighbor not in connected:connected.add(neighbor);stack.append(neighbor)
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if v not in connected],context='VERTS')
    bm.to_mesh(proxy.data);bm.free()
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
    neck_y,neck_z=((- .30,.45) if DOG=='dachshund-sculpt' else (float(heads['Neck01'].y),float(heads['Neck01'].z)-.10))
    w=max(0,min(1,(-y+neck_y)/.15))*max(0,min(1,(z-neck_z)/.15));w=w*w*(3-2*w)
    if w:
        head=body.vertex_groups['Head'];old=0
        for g in list(vertex.groups):
            if g.group==head.index:old=g.weight
            else:body.vertex_groups[g.group].add([vertex.index],g.weight*(1-w),'REPLACE')
        head.add([vertex.index],old*(1-w)+w,'REPLACE')
    if DOG=='dachshund-sculpt' and y>=tail[0][1] and abs(vertex.co.x)<.06 and z>.32:
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
source.animation_data.action=bpy.data.actions['idle 50'];source.animation_data.action_slot=source.animation_data.action.slots[0];scene.frame_set(0)
base={n:(source.matrix_world@source.pose.bones['Head' if n=='Muzzle' else n].matrix).copy() for n in heads}
rest={n:b.matrix_local.copy() for n,b in arm.bones.items()}
# IK solves the real short limb lengths. Donor feet supply contact timing/stride.
controls={};ratios={};sole={}
for side in ['Left','Right']:
    for upper,lower,foot in [('Arm','ForeArm','Hand'),('UpLeg','Leg','Foot')]:
        end=side+foot;first=side+upper;middle=side+lower
        target=bpy.data.objects.new(end+' IK',None);bpy.context.collection.objects.link(target)
        ik=rig.pose.bones[middle].constraints.new('IK');ik.target=target;ik.chain_count=2;ik.use_stretch=False
        # Blender's default bend plane follows the modelled rest knee/elbow.
        orient=rig.pose.bones[end].constraints.new('COPY_ROTATION');orient.target=target;orient.owner_space='WORLD';orient.target_space='WORLD'
        controls[end]=(target,ik,orient,middle)
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
new_actions=[]
for clip in CLIPS:
    action=bpy.data.actions[clip];source.animation_data.action=action;source.animation_data.action_slot=action.slots[0]
    start,end=action.frame_range;frames=sorted(set([float(start),float(end)]+[float(f) for f in range(math.ceil(start),math.floor(end)+1)]))
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
        for n,(target,ik,orient,middle) in controls.items():
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
        bpy.context.view_layer.update()
        if clip not in BASE_CLIPS:
            # Solve actual skin/ground contact, including belly and rump. The
            # donor's pelvis height cannot encode a different dog's body depth.
            previous=None;last_move=None
            while True:
                depsgraph=bpy.context.evaluated_depsgraph_get()
                skin=body.evaluated_get(depsgraph).data
                coordinates=np.empty(len(skin.vertices)*3,dtype=np.float32)
                skin.vertices.foreach_get('co',coordinates)
                points=coordinates.reshape((-1,3));index=int(np.argmin(points[:,2]));minimum=float(points[index,2])
                if not math.isfinite(minimum):raise FloatingPointError(f'Invalid skin coordinates: {DOG} {clip} {frame}')
                if minimum>=-GROUND_EPSILON:break
                if previous is not None and abs(previous-minimum)<1e-8:
                    if last_move=='rigid':raise RuntimeError(f'Ground solve stalled after rigid projection: {DOG} {clip} {frame}: {minimum}')
                    # A saturated limb cannot move the colliding skin point.
                    # Project the complete constrained pose onto the plane,
                    # moving the pelvis and all four IK targets together.
                    root_motion.z-=minimum
                    rig.pose.bones['Hips'].location=rest['Hips'].to_3x3().inverted()@root_motion
                    for target,_,_,_ in controls.values():target.location.z-=minimum
                    previous=minimum;last_move='rigid';bpy.context.view_layer.update();continue
                previous=minimum
                vertex=body.data.vertices[index]
                group=body.vertex_groups[max(vertex.groups,key=lambda g:g.weight).group].name
                paw=next((name for name in controls if group==name or group in {b.name for b in arm.bones[name].children_recursive}),None)
                last_move='paw' if paw else 'pelvis'
                if paw:controls[paw][0].location.z-=minimum
                else:
                    root_motion.z-=minimum
                    rig.pose.bones['Hips'].location=rest['Hips'].to_3x3().inverted()@root_motion
                bpy.context.view_layer.update()
        evaluated=rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
        poses.append((frame,{n:pb.matrix.copy() for n,pb in evaluated.pose.bones.items()}))
    # Bake evaluated IK to local rotations, with fixed rest offsets and scales.
    for _,ik,orient,_ in controls.values():ik.influence=0;orient.influence=0
    for frame,world in poses:
        for n,bone in arm.bones.items():
            kwargs={} if bone.parent is None else dict(parent_matrix=world[bone.parent.name],parent_matrix_local=bone.parent.matrix_local)
            basis=bone.convert_local_to_pose(world[n],bone.matrix_local,invert=True,**kwargs)
            loc,quat,scale=basis.decompose();pb=rig.pose.bones[n];pb.location=loc;pb.rotation_quaternion=quat;pb.scale=(1,1,1)
            if bone.parent is None:pb.keyframe_insert('location',frame=frame-start)
            pb.keyframe_insert('rotation_quaternion',frame=frame-start)
    for _,ik,orient,_ in controls.values():ik.influence=1;orient.influence=1
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
rig.animation_data.action=new_actions[0][0];rig.animation_data.action_slot=rig.animation_data.action.slots[0];scene.frame_set(0)
for obj in meshes:obj.hide_viewport=False
for image in bpy.data.images:
    if image.has_data and not image.packed_file:image.pack()
OUT.mkdir(parents=True,exist_ok=True);EDIT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(EDIT/('dachshund.blend' if DOG=='dachshund-sculpt' else 'ushiro.blend')),compress=True)
for obj in meshes:obj.hide_viewport=True
bpy.ops.export_scene.gltf(filepath=str(OUT/('dog.glb' if DOG=='dachshund-sculpt' else 'ushiro.glb')),export_format='GLB',export_animations=True,export_skins=True,export_animation_mode='ACTIONS',export_force_sampling=False)
print('EXPORTED',DOG,len(CLIPS),'CLIPS',flush=True);os._exit(0)
