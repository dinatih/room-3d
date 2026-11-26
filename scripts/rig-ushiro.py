"""Rebuild Ushiro from measured joints and authored skin, using the Pitbull hierarchy.

blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-ushiro.py -- --draft --base-only
The donor's Arm is the ELBOW, ForeArm the WRIST, Pelvis the HIP and UpLeg the KNEE.
Bone names must never be interpreted as anatomical landmarks without inspecting them.
"""
from pathlib import Path
import argparse, json, math, os, shutil, sys, tempfile, zipfile, runpy
import bpy
import numpy as np
from mathutils import Vector, Matrix, Euler

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
selection=parser.add_mutually_exclusive_group()
selection.add_argument('--base-only', action='store_true')
selection.add_argument('--reference-only', action='store_true')
selection.add_argument('--clips', nargs='+')
parser.add_argument('--draft', action='store_true')
parser.add_argument('--sample-fps', type=int, default=math.lcm(25,30,60,120))
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
OUT = ROOT / 'sources_backup/artifacts/ushiro/rebuild'
OUT.mkdir(parents=True, exist_ok=True)
REPORTS=OUT/'draft' if args.draft else OUT
REPORTS.mkdir(parents=True,exist_ok=True)
BASE = ['idle 50', 'walk_fwd 29', 'run_fwd 13']
REFERENCES = BASE + [
    'walk_fwd_sniff 46', 'idle_shake_1. 137', 'idle_shake_2. 81',
    'idle_to_idle_lay 111', 'idle_lay_pose 2', 'idle_lay_to_idle 71',
    'interact_bed_lay_exist 270', 'interact_bed_sleep_exist 221',
    'pee 43', 'poop 75', 'idle_bark_04_warning 47',
]
BASE_SAMPLE_FPS = args.sample_fps
if BASE_SAMPLE_FPS<=0:raise ValueError('Sample frequency must be positive')
CLIPS = BASE if args.base_only else [e['value'] for e in json.loads((ROOT / 'src/features/inventory/dogAnimationOptions.json').read_text())['animated-pitbull-dog']]
if args.reference_only: CLIPS = REFERENCES
if args.clips: CLIPS=args.clips
if len(set(CLIPS))!=len(CLIPS):raise ValueError('Duplicate clips')
known={e['value'] for e in json.loads((ROOT/'src/features/inventory/dogAnimationOptions.json').read_text())['animated-pitbull-dog']}
if set(CLIPS)-known:raise ValueError('Unknown clips: '+str(set(CLIPS)-known))
HIGH_RATE=set(BASE+['idle_shake_1. 137','idle_shake_2. 81','track_bark_harvest 75','canter_fwd 53'])
work = Path(tempfile.mkdtemp(prefix='ushiro-anatomy-'))
with zipfile.ZipFile(Path.home() / '3D Resources/animals/shiba-inu-texture-updated.zip') as archive:
    archive.extractall(work)
bpy.ops.wm.open_mainfile(filepath=str(work / 'source/Shibaa.blend'))
original = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
for track in list(original.animation_data.nla_tracks): original.animation_data.nla_tracks.remove(track)
old_names = {b.name.rsplit('.', 1)[0]: b.name for b in original.pose.bones}
standing = bpy.data.actions['standing_skeletal.3']
original.animation_data.action = standing; original.animation_data.action_slot = standing.slots[0]
bpy.context.scene.frame_set(0); bpy.context.view_layer.update()
standing_points = {n: (original.matrix_world @ original.pose.bones[k].matrix).translation.copy() for n, k in old_names.items()}
standing_pelvis = original.matrix_world @ original.pose.bones[old_names['pelvis_jnt']].matrix
standing_tail_end = original.matrix_world @ original.pose.bones[old_names['tail_7_jnt']].tail
original.animation_data.action = None
for pb in original.pose.bones: pb.matrix_basis.identity()
bpy.context.view_layer.update()
old = {n: (original.matrix_world @ original.pose.bones[k].matrix).copy() for n, k in old_names.items()}
points = {n: m.translation.copy() for n, m in old.items()}

# Restore supplied, portable textures before freezing the source geometry.
for image in list(bpy.data.images):
    path = work / 'textures' / image.filepath.replace(chr(92), '/').rsplit('/', 1)[-1]
    if not path.is_file(): continue
    replacement = bpy.data.images.load(str(path), check_existing=False)
    replacement.colorspace_settings.name = image.colorspace_settings.name; replacement.pack()
    for material in bpy.data.materials:
        if material.use_nodes:
            for node in material.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image == image: node.image = replacement
    bpy.data.images.remove(image)
for material in bpy.data.materials:
    if not material.use_nodes: continue
    if not any(n.type == 'BSDF_PRINCIPLED' for n in material.node_tree.nodes):
        atlas = next(n.image for n in material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image)
        material.node_tree.nodes.clear()
        shader = material.node_tree.nodes.new('ShaderNodeBsdfPrincipled'); shader.inputs['Roughness'].default_value = .3
        texture = material.node_tree.nodes.new('ShaderNodeTexImage'); texture.image = atlas
        output = material.node_tree.nodes.new('ShaderNodeOutputMaterial')
        material.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])
        material.node_tree.links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    normal = next((n for n in material.node_tree.nodes if n.type == 'NORMAL_MAP'), None)
    texture = next((n for n in material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image and 'normal' in n.image.name.lower()), None)
    shader = next(n for n in material.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    if normal and texture:
        texture.image.colorspace_settings.name = 'Non-Color'; normal.inputs['Strength'].default_value = 1
        for link in list(material.node_tree.links):
            if link.to_node == normal: material.node_tree.links.remove(link)
        material.node_tree.links.new(texture.outputs['Color'], normal.inputs['Color'])
        material.node_tree.links.new(normal.outputs['Normal'], shader.inputs['Normal'])

# Author-supplied alpha cards are flexible fur/whiskers, not body contacts.
# Their transparent corners must not lift the pelvis when the dog lies down.
fur_faces=0;alpha_planes={}
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH':continue
    obj['groundContactSurface']=True
    uv=obj.data.uv_layers.active
    if not uv:continue
    images={}
    for index,material in enumerate(obj.data.materials):
        shader=next((n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if not shader or not shader.inputs['Base Color'].links:continue
        texture=shader.inputs['Base Color'].links[0].from_node
        if texture.type!='TEX_IMAGE' or texture.image.channels!=4:continue
        image=texture.image
        if image not in alpha_planes:
            pixels=np.empty(len(image.pixels),dtype=np.float32);image.pixels.foreach_get(pixels)
            alpha_planes[image]=pixels[3::4].copy();del pixels
        images[index]=(image,alpha_planes[image])
        clip=material.node_tree.nodes.new('ShaderNodeMath');clip.operation='ROUND';clip.label='Authored texture alpha'
        material.node_tree.links.new(texture.outputs['Alpha'],clip.inputs[0]);material.node_tree.links.new(clip.outputs[0],shader.inputs['Alpha'])
    parent=list(range(len(obj.data.vertices)))
    def root(index):
        while parent[index]!=index:parent[index]=parent[parent[index]];index=parent[index]
        return index
    for edge in obj.data.edges:
        a,b=map(root,edge.vertices)
        if a!=b:parent[b]=a
    components={}
    for vertex in obj.data.vertices:components.setdefault(root(vertex.index),[]).append(vertex.index)
    main=max(components,key=lambda key:len(components[key]));transparent=set();clear_faces=set()
    for polygon in obj.data.polygons:
        if polygon.material_index not in images:continue
        image,alpha=images[polygon.material_index];width,height=image.size
        alphas=[]
        for loop_index in polygon.loop_indices:
            point=uv.data[loop_index].uv;x=int((point.x%1)*width);y=int((point.y%1)*height)
            alphas.append(alpha[y*width+x])
        # ROUND in the material exports glTF MASK with its standard 0.5
        # cutoff. A polygon touching discarded texels is a soft alpha fringe.
        if any(alpha<0.5 for alpha in alphas):
            clear_faces.add(polygon.index);transparent.add(root(polygon.vertices[0]))
    cards={polygon.index for polygon in obj.data.polygons if root(polygon.vertices[0]) in transparent-{main} or polygon.index in clear_faces}
    if not cards:continue
    fur_faces+=len(cards)
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    for vertex in obj.data.vertices:vertex.select=False
    for edge in obj.data.edges:edge.select=False
    for polygon in obj.data.polygons:polygon.select=polygon.index in cards
    before=set(bpy.data.objects)
    bpy.context.tool_settings.mesh_select_mode=(False,False,True)
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.separate(type='SELECTED');bpy.ops.object.mode_set(mode='OBJECT')
    detail=next(o for o in set(bpy.data.objects)-before if o.type=='MESH')
    detail.name='Ushiro whiskers and fur cards';detail['groundContactSurface']=False
print('SEPARATED_FUR_FACES',fur_faces,flush=True)

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
graph = bpy.context.evaluated_depsgraph_get()
source_weights = {}
source_smoothing = {}
for obj in meshes:
    corrective = next((m for m in obj.modifiers if m.type=='CORRECTIVE_SMOOTH'),None)
    if corrective: source_smoothing[obj.name]=(corrective.factor,corrective.iterations)
    source_weights[obj.name] = [[(obj.vertex_groups[g.group].name.rsplit('.', 1)[0], g.weight) for g in v.groups] for v in obj.data.vertices]
    evaluated = bpy.data.meshes.new_from_object(obj.evaluated_get(graph), preserve_all_data_layers=True, depsgraph=graph)
    if len(evaluated.vertices) != len(source_weights[obj.name]): raise RuntimeError('Source modifier changes topology')
    world = obj.matrix_world.copy(); obj.parent = None; obj.matrix_world = world
    obj.modifiers.clear(); obj.data = evaluated
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.vertex_groups.clear()
for obj in list(bpy.data.objects):
    if obj not in meshes: bpy.data.objects.remove(obj, do_unlink=True)
for action in list(bpy.data.actions): bpy.data.actions.remove(action)

before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/characters/animated-pitbull-dog/dog.glb'))
donor_objects = set(bpy.data.objects) - before
donor = next(o for o in donor_objects if o.type == 'ARMATURE')
for track in list(donor.animation_data.nla_tracks): donor.animation_data.nla_tracks.remove(track)
donor.animation_data.action = None
for pb in donor.pose.bones: pb.matrix_basis.identity()
bpy.context.view_layer.update()
donor_rest = {b.name: (donor.matrix_world @ b.matrix_local).copy() for b in donor.data.bones}
dp = {n: m.translation.copy() for n, m in donor_rest.items()}
# A native control named pelvis is not necessarily homologous to donor Hips.
# Locate Hips from the actual left/right hip joints and the donor's measured
# pelvis offset. The native control is far anterior to its hip sockets.
native_hip_center=(points['L_hip_jnt']+points['R_hip_jnt'])/2
donor_hip_center=(dp['LeftPelvis']+dp['RightPelvis'])/2
pelvis_width_ratio=(points['L_hip_jnt']-points['R_hip_jnt']).length/(dp['LeftPelvis']-dp['RightPelvis']).length
pelvis_length_ratio=(points['chest_jnt'].y-native_hip_center.y)/(dp['Spine4'].y-donor_hip_center.y)
limb_ratios=[]
for side,initial in [('Left','L'),('Right','R')]:
    for originals,drivers in [(['shoulder','elbow','wrist'],['Shoulder01','Arm','ForeArm']),(['hip','knee','ankle'],['Pelvis','UpLeg','Leg'])]:
        native_length=sum((points[f'{initial}_{b}_jnt']-points[f'{initial}_{a}_jnt']).length for a,b in zip(originals,originals[1:]))
        donor_length=sum((dp[side+b]-dp[side+a]).length for a,b in zip(drivers,drivers[1:]))
        limb_ratios.append(native_length/donor_length)
pelvis_offset=dp['Hips']-donor_hip_center
fitted_hips=native_hip_center+Vector((pelvis_offset.x*pelvis_width_ratio,pelvis_offset.y*pelvis_length_ratio,pelvis_offset.z*sum(limb_ratios)/len(limb_ratios)))
# Build a smooth, anatomically horizontal vertebral path from fitted_hips to the
# thoracic center (matching the true anatomical spine inside the torso rather than
# jumping +33° from fitted_hips up to pelvis_jnt and the dorsal withers at chest_jnt).
spine_names=['Hips','Spine','Spine1','Spine2','Spine3','Spine4']
thoracic_spine4=Vector((points['chest_jnt'].x, points['chest_jnt'].y, fitted_hips.z + 0.015))
native_neck_base=Vector((points['neck_base_jnt'].x, points['neck_base_jnt'].y, points['neck_base_jnt'].z - 0.025))
target = {'Reference': Vector(), 'Hips': fitted_hips,
          'Spine': fitted_hips.lerp(thoracic_spine4, 0.15), 'Spine1': fitted_hips.lerp(thoracic_spine4, 0.36),
          'Spine2': fitted_hips.lerp(thoracic_spine4, 0.57), 'Spine3': fitted_hips.lerp(thoracic_spine4, 0.78),
          'Spine4': thoracic_spine4.copy(), 'Neck01': native_neck_base,
          'Neck02': points['neck_mid_jnt'].copy(), 'Neck03': points['neck_mid_jnt'].lerp(points['head_jnt'], .5),
          'Head': points['head_jnt'].copy(), 'Jaw': points['jaw_jnt'].copy()}
# Match each donor vertebral station to the smooth spine arc length so flexion
# distributes evenly along the torso without an artificial +33° Hips->Spine kink.
spine_path=[fitted_hips, thoracic_spine4]
path_lengths=[(b-a).length for a,b in zip(spine_path,spine_path[1:])]
donor_lengths=[(dp[b]-dp[a]).length for a,b in zip(spine_names,spine_names[1:])]
for index,name in enumerate(spine_names):
    distance=sum(donor_lengths[:index])/sum(donor_lengths)*sum(path_lengths)
    for a,b,length in zip(spine_path,spine_path[1:],path_lengths):
        if distance<=length+1e-7:
            target[name]=a.lerp(b,min(1.,distance/length));break
        distance-=length
mapping = {'root': 'Reference', 'COG_jnt': 'Hips', 'pelvis_jnt': 'Hips', 'central_corrective': 'breathe crotch',
           'spine_1_jnt': 'Spine1', 'spine_2_jnt': 'Spine3', 'chest_jnt': 'Spine4',
           'neck_base_jnt': 'Neck01', 'neck_mid_jnt': 'Neck02', 'neck_fat_jnt': 'Neck01',
           'head_jnt': 'Head', 'jaw_jnt': 'Jaw', 'nose_jnt': 'Head'}
anchors = {v: k for k, v in mapping.items() if k not in ['root','COG_jnt','central_corrective','neck_fat_jnt','nose_jnt']}
limbs = []
for side, initial in [('Left', 'L'), ('Right', 'R')]:
    chains = [(['Shoulder','Shoulder01','Arm','ForeArm','Hand','HandIndex1'], ['clavicle','shoulder','elbow','wrist','hand',None]),
              (['Pelvis','UpLeg','Leg','Foot','ToeBase'], ['hip','knee','ankle','foot',None])]
    for chain, originals in chains:
        prefix = initial + ('F' if chain[0] == 'Shoulder' else 'B')
        old_chain = [f'{initial}_{name}_jnt' if name else f'{prefix}_toes_jnt' for name in originals]
        first = side + chain[0]; target[first] = points[old_chain[0]].copy()
        lengths = [(points[b]-points[a]).length for a,b in zip(old_chain,old_chain[1:])]
        # Fit the rig to the native pivots and sculpture. Never change a
        # segment ratio or scale the upper-arm mesh to match the donor.
        for name,old_name in zip(chain,old_chain):
            name=side+name;target[name]=points[old_name].copy();mapping[old_name]=name;anchors[name]=old_name
        # Shibaa.blend places L/R_elbow_jnt 6 cm below the anatomical chest-elbow
        # junction (halfway down the radius/ulna), making the humerus 35% too long
        # and driving elbows through the floor in every lying/sleeping clip.
        # Move Arm to the true anatomical elbow (measured on mesh cross-sections
        # at 60.5% of wrist->shoulder height, right at the lower chest margin).
        if chain[0] == 'Shoulder':
            sh_pt = points[f'{initial}_shoulder_jnt']
            el_pt = points[f'{initial}_elbow_jnt']
            wr_pt = points[f'{initial}_wrist_jnt']
            true_elbow = Vector((
                wr_pt.x + (sh_pt.x - wr_pt.x) * 0.45,
                el_pt.y + 0.006,
                wr_pt.z + (sh_pt.z - wr_pt.z) * 0.605,
            ))
            target[side + 'Arm'] = true_elbow
        # Keep every native anatomical pivot; retarget the movement with IK.
        limbs.append(dict(side=side, chain=[side + n for n in chain], original=old_chain))
    for part, suffix in [('pinkie','Pinky1'), ('ring','Ring1'), ('mid','Middle1'), ('index','Index2')]:
        name = side + 'Hand' + suffix; old_name = initial + 'F_' + part + '_jnt'
        target[name] = target[side+'HandIndex1'] + points[old_name] - points[initial+'F_toes_jnt']
        mapping[old_name] = name; anchors[name] = old_name
    for part, suffix in [('pinkie','Pinky1'), ('ring','Ring1'), ('mid','Middle1'), ('index','Index1')]:
        name = side + 'Foot' + suffix; old_name = initial + 'B_' + part + '_jnt'
        target[name] = target[side+'ToeBase'] + points[old_name] - points[initial+'B_toes_jnt']
        mapping[old_name] = name; anchors[name] = old_name
    for suffix, old_suffix in [('Ear','ear_base'), ('Ear3','ear_tip'), ('Eye','eye')]:
        name = side + suffix; old_name = initial + '_' + old_suffix + '_jnt'
        target[name] = points[old_name].copy(); mapping[old_name] = name; anchors[name] = old_name
    target[side+'Ear2'] = target[side+'Ear'].lerp(target[side+'Ear3'], .5)
    mapping[initial.lower()+'_leg_corrective'] = side+'Pelvis'
for i in range(1, 7):
    name = 'Tongue' + str(min(i, 4)); old_name = f'tongue_{i}_jnt'
    mapping[old_name] = name
    if i <= 4: target[name] = points[old_name].copy(); anchors[name] = old_name
for i in range(1, 8):
    name = f'Tail{i:02d}'; old_name = f'tail_{i}_jnt'
    # Use only the original tail curl, without freezing the standing clip's
    # asymmetrical head turn, sway and unequal paw positions into the bind pose.
    target[name] = old['pelvis_jnt'] @ (standing_pelvis.inverted() @ standing_points[old_name])
    mapping[old_name] = name; anchors[name] = old_name
tail_tip = old['pelvis_jnt'] @ (standing_pelvis.inverted() @ standing_tail_end)
torso_ratio = (target['Spine4'] - target['Hips']).length / (dp['Spine4'] - dp['Hips']).length
for b in donor.data.bones:
    if b.name in target: continue
    parent = b.parent.name if b.parent else None
    if parent is None: target[b.name] = Vector()
    else:
        if parent not in target: raise RuntimeError('Donor bones not in hierarchical order: '+b.name)
        target[b.name] = target[parent] + (dp[b.name] - dp[parent]) * torso_ratio
target['Muzzle'] = points['nose_jnt'].copy()

# Explicit mapping for facial groups. Their authored weights stay on the head
# and jaw instead of re-solving heat weights across touching body parts.
for old_name in points:
    if old_name in mapping: continue
    if old_name.startswith(('L_lower_lip','R_lower_lip')): mapping[old_name] = 'Jaw'
    elif old_name == 'breathe_jnt': mapping[old_name] = 'breathe l'
    else: mapping[old_name] = 'Head'

def deformation_matrix(name):
    if name.startswith('Tail'):
        i = int(name[-2:]); old_name = f'tail_{i}_jnt'
        old_end = points[f'tail_{i+1}_jnt'] if i < 7 else original_tail_end
        new_end = target[f'Tail{i+1:02d}'] if i < 7 else tail_tip
        return (old_end - points[old_name]).rotation_difference(new_end - target[name]).to_matrix()
    return Matrix.Identity(3)

original_tail_end = old['tail_7_jnt'] @ Vector((0, (standing_tail_end-standing_points['tail_7_jnt']).length, 0))
deforms = {}
for name, anchor in anchors.items():
    matrix = deformation_matrix(name)
    deforms[name] = (matrix, points[anchor], target[name] if name.startswith('Tail') else points[anchor])
deforms['Spine'] = (Matrix.Identity(3), points['pelvis_jnt'], points['pelvis_jnt'])
torso_groups={'COG_jnt','pelvis_jnt','spine_1_jnt','spine_2_jnt','chest_jnt','central_corrective'}
def torso_influences(point):
    # Distribute only the existing trunk weight. Limb, neck and facial masks
    # remain authored. COG mass must not rotate as a single pelvis block.
    candidates=[]
    for a,b in zip(spine_names,spine_names[1:]):
        direction=target[b]-target[a]
        t=min(1.,max(0.,(point-target[a]).dot(direction)/direction.length_squared))
        candidates.append(((point-target[a].lerp(target[b],t)).length_squared,a,b,t))
    _,a,b,t=min(candidates)
    return [(a,1-t),(b,t)]
maximum_non_tail_bind_displacement=0.
for obj in meshes:
    groups = {}
    for vertex, weights in zip(obj.data.vertices, source_weights[obj.name]):
        point = vertex.co.copy(); result = Vector(); total = sum(w for _, w in weights)
        if total <= 0: raise RuntimeError('Unweighted source vertex: '+obj.name+' '+str(vertex.index))
        combined = {}
        for old_name, weight in weights:
            name = mapping[old_name]
            # The corrective and all merged face weights share their parent's
            # deformation, rather than translating every merged pivot to it.
            deform_name = name if name in deforms else ('Jaw' if name == 'Jaw' else 'Head')
            q, anchor, destination = deforms[deform_name]
            result += (q @ (point-anchor) + destination) * (weight / total)
            if old_name in torso_groups:
                for driver,share in torso_influences(point):
                    combined[driver]=combined.get(driver,0)+weight/total*share
            elif old_name=='neck_fat_jnt':
                # Smoothly blend the throat/brisket ruff between thorax (Spine4)
                # and lower neck (Neck01) so head dips do not crease the brisket.
                z0=target['LeftShoulder01'].z;z1=target['Neck01'].z
                t=min(1.,max(0.,(point.z-z0)/max(1e-6,z1-z0)))
                t=t*t*(3-2*t)
                for driver,share in [('Spine4',1-t),('Neck01',t)]:
                    if share>0:combined[driver]=combined.get(driver,0)+weight/total*share
            elif old_name=='breathe_jnt':
                span=target['breathe l'].x-target['breathe r'].x
                left=min(1.,max(0.,(point.x-target['breathe r'].x)/span))
                for lateral,share in [('breathe l',left),('breathe r',1-left)]:
                    combined[lateral]=combined.get(lateral,0)+weight/total*share
            else: combined[name] = combined.get(name, 0) + weight / total
        # Re-split only the authored humerus+forearm mass across the true elbow plane
        # so vertices between the old low elbow (z=0.25) and true elbow (z=0.312) bend
        # with the forearm (Arm) instead of staying rigid with the humerus (Shoulder01).
        for side in ('Left', 'Right'):
            sh, el = side + 'Shoulder01', side + 'Arm'
            pair_w = combined.get(sh, 0.0) + combined.get(el, 0.0)
            if pair_w > 1e-6:
                ez = target[el].z
                t = min(1.0, max(0.0, (point.z - (ez - 0.035)) / 0.070))
                t = t * t * (3.0 - 2.0 * t)
                combined[sh] = pair_w * t
                combined[el] = pair_w * (1.0 - t)
                if combined[sh] < 1e-6: del combined[sh]
                if combined[el] < 1e-6: del combined[el]
        if not any(name.startswith('tail_') for name,_ in weights):
            maximum_non_tail_bind_displacement=max(maximum_non_tail_bind_displacement,(result-point).length)
        vertex.co = result
        for name, weight in combined.items(): groups.setdefault(name, []).append((vertex.index, weight))
    for name, weights in groups.items():
        group = obj.vertex_groups.new(name=name)
        for index, weight in weights: group.add([index], weight, 'REPLACE')

if maximum_non_tail_bind_displacement>1e-6:raise RuntimeError('Body sculpt changed during rig fitting')

# Smooth transferred body weights locally within anatomical regions so
# transitions across spine, shoulder/thorax, and hip/thigh stay organic without
# bleeding elbow (Arm) or lower-leg weights across the armpit or belly.
for obj in meshes:
    if obj.name not in source_smoothing: continue
    edges_all=np.array([tuple(e.vertices) for e in obj.data.edges],dtype=int)
    for region,iters in [
        (set(spine_names+['Neck01','Neck02','LeftShoulder','LeftShoulder01','RightShoulder','RightShoulder01']), 4),
        (set(['Hips','Spine','LeftPelvis','LeftUpLeg','RightPelvis','RightUpLeg']), 4),
    ]:
        driver_names=[g.name for g in obj.vertex_groups if g.name in region]
        if not driver_names: continue
        group_indices={g.index:driver_names.index(g.name) for g in obj.vertex_groups if g.name in driver_names}
        weights=np.zeros((len(obj.data.vertices),len(driver_names)),dtype=np.float64)
        for vertex in obj.data.vertices:
            for g in vertex.groups:
                if g.group in group_indices:weights[vertex.index,group_indices[g.group]]=g.weight
        mass=weights.sum(axis=1)
        edges=edges_all[(mass[edges_all[:,0]]>0)&(mass[edges_all[:,1]]>0)]
        left,right=np.concatenate([edges[:,0],edges[:,1]]),np.concatenate([edges[:,1],edges[:,0]])
        degree=np.bincount(left,minlength=len(weights));active=degree>0
        for _ in range(iters):
            sums=np.zeros_like(weights);np.add.at(sums,left,weights[right])
            weights[active]=0.5*weights[active]+0.5*sums[active]/degree[active,None]
            totals=weights.sum(axis=1);weights[active]*=(mass[active]/totals[active])[:,None]
        for column,name in enumerate(driver_names):
            group=obj.vertex_groups[name];group.remove(list(range(len(weights))))
            for index in np.flatnonzero(weights[:,column]):group.add([int(index)],float(weights[index,column]),'REPLACE')

floor = min(v.co.z for obj in meshes for v in obj.data.vertices)
for obj in meshes:
    for vertex in obj.data.vertices: vertex.co.z -= floor
for point in target.values(): point.z -= floor
arm = bpy.data.armatures.new('Ushiro anatomical donor-compatible skeleton')
rig = bpy.data.objects.new('UshiroRig', arm); bpy.context.collection.objects.link(rig)
bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
for b in donor.data.bones:
    new = arm.edit_bones.new(b.name)
    # A newly created EditBone has zero length. Give it a shaft *before*
    # assigning its frame, otherwise Blender loses the matrix's orientation.
    new.length = b.length * torso_ratio
    matrix = donor_rest[b.name].to_quaternion().to_matrix().to_4x4(); matrix.translation = target[b.name]
    new.matrix = matrix
for b in donor.data.bones:
    if b.parent: arm.edit_bones[b.name].parent = arm.edit_bones[b.parent.name]
marker = arm.edit_bones.new('Muzzle'); marker.head = target['Muzzle']; marker.tail = marker.head+Vector((0,-.02,0)); marker.parent = arm.edit_bones['Head']; marker.use_deform = False
bpy.ops.object.mode_set(mode='OBJECT'); rig.show_in_front = True
for bone in arm.bones:
    if bone.name=='Muzzle': continue
    if abs(bone.matrix_local.to_quaternion().dot(donor_rest[bone.name].to_quaternion())) < 1-1e-6:
        raise RuntimeError('Donor and target bind axes differ: '+bone.name)
for obj in meshes:
    obj.parent = rig; modifier = obj.modifiers.new('Skin', 'ARMATURE'); modifier.object = rig
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True)
    bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)

scene = bpy.context.scene; scene.render.fps = 24
# The supplied glTF uses STEP samplers at 25 Hz. Convert the source curves
# before contact solving, rather than interpolating between already solved,
# discontinuous poses (which drives toes through the ground between keys).
source_quaternion_corrections=runpy.run_path(str(ROOT/'scripts/dog-animation-curves.py'))['make_actions_continuous'](bpy.data.actions)
rest = {b.name: b.matrix_local.copy() for b in arm.bones}
rest_local = {b.name: (rest[b.parent.name].inverted() @ rest[b.name] if b.parent else rest[b.name]) for b in arm.bones}

def skin_cache(objects, skeleton, bind):
    """World-space bind vertices and authored weights, including eye meshes."""
    result = []
    for obj in objects:
        coords = np.array([list(obj.matrix_world @ v.co) + [1] for v in obj.data.vertices], dtype=np.float64)
        influences = {}
        dominant = []
        for vertex in obj.data.vertices:
            dominant.append(obj.vertex_groups[max(vertex.groups, key=lambda g:g.weight).group].name)
            for g in vertex.groups:
                name = obj.vertex_groups[g.group].name
                if name not in bind: raise RuntimeError('Unknown skin bone '+name)
                influences.setdefault(name, []).append((vertex.index, g.weight))
        local={}
        for name,weights in influences.items():
            indices=np.array([i for i,_ in weights]);factors=np.array([w for _,w in weights])
            local[name]=(indices,(coords[indices]@np.array(bind[name].inverted(),dtype=np.float64).T)*factors[:,None])
        result.append((coords,local,dominant))
    return result

def skin_points(cache, world, bind):
    result = []
    used={name for _,influences,_ in cache for name in influences}
    matrices = {n:np.array(world[n],dtype=np.float64)[:3,:] for n in used}
    for coords, influences, _ in cache:
        deformed = np.zeros((len(coords), 3), dtype=np.float64)
        for name, (indices, local) in influences.items():
            deformed[indices] += local @ matrices[name].T
        result.append(deformed)
    return result

donor_meshes = [o for o in donor_objects if o.type=='MESH' and o.vertex_groups]
donor_body = max(donor_meshes, key=lambda o:len(o.data.vertices))
body = max(meshes, key=lambda o:len(o.data.vertices))
source_cache = skin_cache([donor_body], donor, donor_rest)
target_cache = skin_cache(meshes, rig, rest)
body_index = meshes.index(body)
head_drivers={'Head'}|{b.name for b in arm.bones['Head'].children_recursive}
head_surface=np.array([i for i,n in enumerate(target_cache[body_index][2]) if n in head_drivers],dtype=int)
if not len(head_surface):raise RuntimeError('Empty head surface')
for limb in limbs:
    front = limb['chain'][0].endswith('Shoulder')
    limb['upper'], limb['lower'], limb['end'] = [limb['side']+n for n in (['Shoulder01','Arm','ForeArm'] if front else ['Pelvis','UpLeg','Leg'])]
    first, middle, end = [limb[n] for n in ['upper','lower','end']]
    limb['lengths'] = ((target[middle]-target[first]).length, (target[end]-target[middle]).length)
    limb['ratio'] = sum(limb['lengths']) / ((dp[middle]-dp[first]).length+(dp[end]-dp[middle]).length)
    distal = {end} | {b.name for b in donor.data.bones[end].children_recursive}
    limb['source_sole'] = np.array([i for i,n in enumerate(source_cache[0][2]) if n in distal], dtype=int)
    limb['target_sole'] = np.array([i for i,n in enumerate(target_cache[body_index][2]) if n in distal], dtype=int)
    if not len(limb['source_sole']) or not len(limb['target_sole']): raise RuntimeError('Empty paw surface '+end)
spine_stretch_bones=set(spine_names[1:])
neck_stretch_bones={'Neck01','Neck02','Neck03','Head'}
fixed_segments=set()
for limb in limbs:
    fixed_segments.update(limb['chain'][1:])
    fixed_segments.update(b.name for b in arm.bones[limb['chain'][-1]].children_recursive)
donor_unit_scale=donor.matrix_world.to_scale().x
root_translation_scale=Vector(((target['LeftPelvis']-target['RightPelvis']).length/(dp['LeftPelvis']-dp['RightPelvis']).length,
    torso_ratio,sum(limb['ratio'] for limb in limbs)/len(limbs)))

# Precompute donor rest segment lengths along spine/neck for clean proportional transfer
donor_seg_rest_len={}
for name in spine_stretch_bones | neck_stretch_bones:
    parent=arm.bones[name].parent.name
    donor_seg_rest_len[name]=(dp[name]-dp[parent]).length

# Anatomical rest-world sagittal bend poles (pure +Y backward for elbows, -Y forward for knees).
# Transformed at each frame by body_rot = fk[body_parent].q @ rest[body_parent].q.inv.
for limb in limbs:
    front=limb['chain'][0].endswith('Shoulder')
    limb['body_parent']='Spine4' if front else 'Hips'
    limb['rest_pole_world']=Vector((0., 1. if front else -1., 0.))

def forward(bases):
    world = {}
    for bone in arm.bones:
        name = bone.name
        world[name] = (world[bone.parent.name] if bone.parent else Matrix.Identity(4)) @ rest_local[name] @ bases[name]
    return world

def from_rotations(rotations, root_positions, offsets):
    """FK with explicit global orientations and immutable anatomical offsets."""
    result = {}
    for bone in arm.bones:
        name = bone.name
        if bone.parent:
            parent = bone.parent.name
            point = result[parent] @ offsets[name]
        else: point = root_positions[name]
        result[name] = rotations[name].to_matrix().to_4x4(); result[name].translation = point
    return result

def clear_head_contact(world,skin,tolerance):
    """Lift the head with neck IK before lifting the entire pelvis/torso.

    Keep the head orientation and the native neck's current segment lengths.
    The distal two neck segments move rigidly together, preserving their bend.
    """
    minimum=float(skin[head_surface,2].min())
    if minimum>=-tolerance:return world,skin,0.,None
    baseline=world
    start=baseline['Neck01'].translation;joint0=baseline['Neck02'].translation;head0=baseline['Head'].translation
    a=(joint0-start).length;b=(head0-joint0).length
    horizontal2=(head0.x-start.x)**2+(head0.y-start.y)**2
    outer=math.sqrt(max(0.,(a+b)**2-horizontal2));inner=math.sqrt(max(0.,(a-b)**2-horizontal2))
    upper=start.z-inner if inner>0 and head0.z<start.z else start.z+outer
    rotations={n:m.to_quaternion() for n,m in baseline.items()}
    offsets={bone.name:baseline[bone.parent.name].inverted()@baseline[bone.name].translation for bone in arm.bones if bone.parent}
    roots={bone.name:baseline[bone.name].translation.copy() for bone in arm.bones if not bone.parent}
    requested=0.;actual=0.;previous_error=math.inf;best=(world,skin,0.)
    while minimum < -tolerance:
        requested-=minimum
        end=head0.copy();end.z=min(head0.z+requested,upper)
        lift=end.z-head0.z
        if lift<=actual+1e-10:return world,skin,actual,'kinematic reach'
        reach=end-start;distance=reach.length;axis=reach.normalized()
        along=(a*a-b*b+distance*distance)/(2*distance)
        pole=joint0-start-axis*(joint0-start).dot(axis)
        if pole.length<1e-9:
            body_rotation=baseline['Hips'].to_quaternion()@rest['Hips'].to_quaternion().inverted()
            pole=axis.cross(body_rotation@Vector((1,0,0)))
        if pole.length<1e-9:raise RuntimeError('Undefined cervical bend plane')
        joint=start+axis*along+pole.normalized()*math.sqrt(max(0.,a*a-along*along))
        rotations['Neck01']=(joint0-start).rotation_difference(joint-start)@baseline['Neck01'].to_quaternion()
        distal=(head0-joint0).rotation_difference(end-joint)
        for name in ['Neck02','Neck03']:rotations[name]=distal@baseline[name].to_quaternion()
        world=from_rotations(rotations,roots,offsets);skin=skin_points(target_cache,world,rest)[body_index]
        minimum=float(skin[head_surface,2].min());actual=lift
        if -minimum>=previous_error-1e-10:return (*best,'skin constraints')
        previous_error=-minimum;best=(world,skin,actual)
    return world,skin,actual,None

def retarget_bases(source_bases, source_world):
    result={}
    for name in rest:
        if name=='Muzzle': result[name]=Matrix.Identity(4); continue
        loc,q,scale=source_bases[name].decompose()
        # Preserve intrinsic breed anatomy in every clip, including sleep and
        # shake. Tail01 still carries the donor's wag at the tail attachment.
        preserve= (name in {f'Tail{i:02d}' for i in range(2,8)} or name in {'LeftEar','LeftEar2','LeftEar3','RightEar','RightEar2','RightEar3'})
        if preserve: q=Matrix.Identity(3).to_quaternion();loc=Vector()
        elif name == 'Tail01':
            # Keep only the lateral wag (Z); strip the Pitbull donor's downward pitch (X)
            # because Ushiro's bind tail is already curled over the back.
            q=Euler((0.0,0.0,q.to_euler('XYZ').z),'XYZ').to_quaternion()
            loc=Vector()
        result[name]=q.to_matrix().to_4x4()
        # Blender's imported donor armature has a uniform object scale. Convert
        # its local translations into world units before proportion scaling.
        if name in fixed_segments or preserve or name=='Tail01' or name in spine_stretch_bones or name in neck_stretch_bones:
            translation=Vector()
        else:
            # Vertical displacement follows limb proportions,
            # not the shorter trunk ratio. Apply anatomical axis scaling in
            # the donor's world bind frame, then return to bone-local space.
            orientation=donor_rest[name].to_quaternion()
            reference_loc=idle_bases[name].to_translation()
            world=orientation@((loc-reference_loc)*donor_unit_scale)
            scaled=Vector(tuple(world[i]*root_translation_scale[i] for i in range(3)))
            translation=reference_loc*(donor_unit_scale*torso_ratio)+orientation.inverted()@scaled
        result[name].translation=translation
    return result

def retarget_body_chain(fk, source_world):
    """Transfer the donor's spline-IK spine & neck curvature while preserving native segment lengths.

    Each vertebra segment rotates by the donor segment's world-space swing and scales
    strictly within anatomical bounds ([0.92, 1.25] spine, 1.00 neck) — capturing
    spline-IK posture (sleep, sniff, shake) while making 0.14x collapse or 2.7x stretch impossible.
    """
    chain = spine_names[1:] + ['Neck01', 'Neck02', 'Neck03', 'Head']
    chain_set = set(chain)
    result = {}
    for bone in arm.bones:
        name = bone.name
        matrix = fk[name].copy()
        if name in chain_set:
            parent = bone.parent.name
            d_rest = donor_rest[name].translation - donor_rest[parent].translation
            d_posed = source_world[name].translation - source_world[parent].translation
            n_rest = rest[name].translation - rest[parent].translation
            seg_q = d_rest.rotation_difference(d_posed)
            if name in spine_stretch_bones:
                ratio = min(1.25, max(0.92, d_posed.length / max(1e-6, d_rest.length)))
            else:
                ratio = 1.0
            matrix.translation = result[parent].translation + (seg_q @ n_rest) * ratio
        elif bone.parent:
            parent = bone.parent.name
            matrix.translation = result[parent] @ (fk[parent].inverted() @ fk[name].translation)
        result[name] = matrix
    return result

def limb_pole(limb, fk, axis, source_upper):
    """Compute a C1-smooth, globally singularity-free anatomical bend pole.

    Blends smoothly toward the anatomical sagittal pole anat_perp whenever the
    donor limb nears full extension (src_sin -> 0) OR attempts to hyperextend
    backwards (dot(cand, anat_perp) <= 0), eliminating all 180-degree flips.
    """
    body_rot=fk[limb['body_parent']].to_quaternion()@rest[limb['body_parent']].to_quaternion().inverted()
    anat_pole=body_rot@limb['rest_pole_world']
    anat_perp=anat_pole-axis*anat_pole.dot(axis)
    if anat_perp.length>1e-6: anat_perp.normalize()
    src_perp=source_upper-axis*source_upper.dot(axis)
    src_sin=src_perp.length/max(1e-9,source_upper.length)
    if src_sin>1e-4 and anat_perp.length>1e-6:
        cand=src_perp.normalized()
        d=cand.dot(anat_perp)
        # C1 smoothstep weights: front elbows stay strictly backward (d in [-0.15, 0.45]);
        # rear knees allow natural lateral hip abduction in pee/shake (d in [-0.30, 0.25]).
        t_sin=min(1.,max(0.,(src_sin-0.05)/0.25)); t_sin=t_sin*t_sin*(3.-2.*t_sin)
        d0,d1=(-0.15,0.45) if limb['chain'][0].endswith('Shoulder') else (-0.30,0.25)
        t_dir=min(1.,max(0.,(d-d0)/(d1-d0))); t_dir=t_dir*t_dir*(3.-2.*t_dir)
        w=t_sin*t_dir
        blended=cand*w+anat_perp*(1.-w)
        if blended.length>1e-6: return blended.normalized()
    if anat_perp.length>1e-6: return anat_perp
    if src_perp.length>1e-9: return src_perp.normalized()
    raise RuntimeError('Undefined anatomical limb bend plane: '+limb['lower'])

def retarget_endpoints(fk, source_world, lying_blend=0.0):
    """Transfer limb reach without deforming the sculpt or stretching spine/limbs.

    When lying_blend > 0 (smooth C1 function of donor chest clearance), gently slides
    front wrists forward along the dog's heading so Ushiro's longer humerus rests its
    elbow cleanly on the floor in the sagittal plane without lifting the rump or popping.
    """
    rotations={n:m.to_quaternion() for n,m in fk.items()}
    offsets={b.name:fk[b.parent.name].inverted()@fk[b.name].translation for b in arm.bones if b.parent}
    roots={b.name:fk[b.name].translation.copy() for b in arm.bones if not b.parent}
    body_rot=fk['Spine4'].to_quaternion()@rest['Spine4'].to_quaternion().inverted()
    body_fwd=body_rot@Vector((0.,-1.,0.));body_fwd.z=0.
    if body_fwd.length>1e-6: body_fwd.normalize()
    else: body_fwd=Vector((0.,-1.,0.))
    for limb in limbs:
        un,ln,en=[limb[n] for n in ['upper','lower','end']]
        start=fk[un].translation
        reach=source_world[en].translation-source_world[un].translation
        if reach.length<1e-9: raise RuntimeError('Undefined donor limb reach: '+en)
        a,b=limb['lengths']
        scaled_reach=reach*limb['ratio']
        # Keep slight margin from exact singularity so elbow/knee plane stays well-defined
        min_d=abs(a-b)+1e-4;max_d=a+b-1e-4
        distance=min(max_d,max(min_d,scaled_reach.length))
        axis=scaled_reach.normalized()
        along=(a*a-b*b+distance*distance)/(2*distance)
        source_upper=source_world[ln].translation-source_world[un].translation
        pole=limb_pole(limb,fk,axis,source_upper)
        joint=start+axis*along+pole*math.sqrt(max(0.,a*a-along*along))
        end=start+axis*distance
        old_upper=fk[ln].translation-start;old_lower=fk[en].translation-fk[ln].translation
        rotations[un]=old_upper.rotation_difference(joint-start)@fk[un].to_quaternion()
        rotations[ln]=old_lower.rotation_difference(end-joint)@fk[ln].to_quaternion()
    return from_rotations(rotations,roots,offsets)

def swing_clearances(rows):
    """Remove contact-height drift from the target's own swing arc.

    Interpolate the two FK contact-height offsets with a monotone cubic.
    No endpoint velocity is subtracted: it belongs to the actual paw lift,
    not to the reference-pose height drift.
    """
    count=len(rows)-1;step=(rows[-1]['frame']-rows[0]['frame'])/count
    result=[{} for _ in rows]
    for limb in limbs:
        name=limb['end'];source=np.array([r['source'][name] for r in rows[:-1]])
        heights=np.array([r['fk'][name] for r in rows[:-1]]);contact=source<=0
        if not np.any(contact):raise RuntimeError('No support phase for '+name)
        for i in range(count):
            if contact[i]:result[i][name]=0.;continue
            previous=i-1
            while not contact[previous%count]:previous-=1
            following=i+1
            while not contact[following%count]:following+=1
            def crossing(left):
                a,b=left%count,(left+1)%count
                fraction=-source[a]/(source[b]-source[a])
                return (left+fraction)*step,heights[a]+fraction*(heights[b]-heights[a])
            start,z0=crossing(previous);end,z1=crossing(following-1)
            t=(i*step-start)/(end-start);blend=t*t*(3-2*t)
            result[i][name]=max(0.,float(heights[i]-(z0+(z1-z0)*blend)))
        result[-1][name]=result[0][name]
    return result

def ground_limbs(fk, goals, enforce_body_floor=True, allow_reversed_height=False):
    """Fixed-length analytic IK with scapular elevation and angle-preserving pelvis height.

    Never rotates an elbow or knee out of its anatomical bend plane to clear the ground.
    When an elbow contacts the floor in lying poses, glides the scapula upward along the
    thoracic wall first, then elevates the pelvis cleanly if needed.
    """
    fk_skin=skin_points(target_cache,fk,rest)[body_index]
    ends={limb['end']:fk[limb['end']].translation+Vector((0,0,goals[limb['end']]-float(fk_skin[limb['target_sole'],2].min()))) for limb in limbs}
    rotations={n:m.to_quaternion() for n,m in fk.items()}
    base_offsets={b.name:fk[b.parent.name].inverted()@fk[b.name].translation for b in arm.bones if b.parent}
    root_positions={b.name:fk[b.name].translation.copy() for b in arm.bones if not b.parent}
    previous_error=math.inf;minimum_shift=-math.inf;floor_constraint=None
    scapula_lifts={'Left':0.,'Right':0.};max_scapula_lift=0.018
    best_feasible=None
    body_height=max(v.co.z for v in body.data.vertices)-min(v.co.z for v in body.data.vertices)
    tolerance=body_height*1e-5
    # Half the exported 0.01 cm contact budget, leaving room for interpolation.
    skin_tolerance=body_height*(0.01/40)/2
    while True:
        intervals=[(minimum_shift,math.inf)];terms=[];height_ranges={}
        for limb in limbs:
            front=limb['chain'][0].endswith('Shoulder')
            lift=Vector((0,0,scapula_lifts[limb['side']])) if front else Vector()
            start=fk[limb['upper']].translation+lift;end=ends[limb['end']]
            a,b=limb['lengths'];horizontal2=(end.x-start.x)**2+(end.y-start.y)**2
            dz=end.z-start.z
            bound_start=start;lengths=[a,b]
            if front:
                bound_start=fk[limb['side']+'Shoulder'].translation+lift
                lengths.append((start-bound_start).length)
            bound_horizontal2=(end.x-bound_start.x)**2+(end.y-bound_start.y)**2
            inner_length=max(0.,2*max(lengths)-sum(lengths));outer_length=sum(lengths)
            if bound_horizontal2>outer_length**2+1e-10:raise RuntimeError('Unreachable horizontal paw target')
            bound_dz=end.z-bound_start.z
            inner=math.sqrt(max(0.,inner_length**2-bound_horizontal2));outer=math.sqrt(max(0.,outer_length**2-bound_horizontal2))
            allowed=[(bound_dz+inner,bound_dz+outer)]
            if allow_reversed_height:allowed=[(bound_dz-outer,bound_dz-inner),(bound_dz+inner,bound_dz+outer)] if inner>0 else [(bound_dz-outer,bound_dz+outer)]
            height_ranges[limb['end']]=allowed
            intervals=[(max(l,c),min(u,d)) for l,u in intervals for c,d in allowed if max(l,c)<=min(u,d)+tolerance]
            distance=(fk[limb['end']].translation-fk[limb['upper']].translation).length
            terms.append((1/(2*a*b),dz,dz*dz+horizontal2-distance*distance))
        if not intervals:raise RuntimeError('No common pelvis height: '+str(dict(clip=clip_name,frame=frame,minimumShift=minimum_shift,limbs=height_ranges,floor=floor_constraint)))
        coefficients=[sum(k*k for k,d,c in terms),-3*sum(k*k*d for k,d,c in terms),
                      sum(k*k*(2*d*d+c) for k,d,c in terms),-sum(k*k*d*c for k,d,c in terms)]
        candidates=[v for interval in intervals for v in interval]
        candidates.extend(float(r.real) for r in np.roots(coefficients) if abs(r.imag)<1e-9 and any(lower<=r.real<=upper for lower,upper in intervals))
        shift=min(candidates,key=lambda z:sum((k*(z*z-2*d*z+c))**2 for k,d,c in terms))
        roots={n:p+Vector((0,0,shift)) for n,p in root_positions.items()}
        offsets=dict(base_offsets)
        for side in ['Left','Right']:
            if scapula_lifts[side]>0:
                scapula=side+'Shoulder'
                parent=arm.bones[scapula].parent.name
                lifted_world=fk[scapula].translation+Vector((0,0,scapula_lifts[side]))
                offsets[scapula]=fk[parent].inverted()@lifted_world
        for limb in limbs:
            un,ln,en=[limb[n] for n in ['upper','lower','end']]
            front=limb['chain'][0].endswith('Shoulder')
            lift=Vector((0,0,scapula_lifts[limb['side']])) if front else Vector()
            start=fk[un].translation+lift+Vector((0,0,shift));end=ends[en]
            a,b=limb['lengths']
            if front:
                scapula=limb['side']+'Shoulder'
                shoulder=fk[scapula].translation+lift+Vector((0,0,shift))
                original=start-shoulder;scapula_length=original.length
                reach=end-shoulder;distance=reach.length;axis=reach.normalized()
                low=max(abs(a-b),abs(distance-scapula_length));high=min(a+b,distance+scapula_length)
                if low>high+tolerance:raise RuntimeError('Paw outside scapula/arm reach')
                cur_dist=(end-start).length
                if low<=cur_dist<=high:
                    rotations[scapula]=fk[scapula].to_quaternion()
                else:
                    radius=min(high,max(low,cur_dist))
                    along=(scapula_length**2+distance**2-radius**2)/(2*distance)
                    pole=original-axis*original.dot(axis)
                    if pole.length<1e-9:raise RuntimeError('Undefined scapular bend plane')
                    start=shoulder+axis*along+pole.normalized()*math.sqrt(max(0.,scapula_length**2-along**2))
                    rotations[scapula]=original.rotation_difference(start-shoulder)@fk[scapula].to_quaternion()
            axis=end-start;distance=axis.length
            if distance<1e-9:raise RuntimeError('Degenerate limb reach')
            axis.normalize()
            along=(a*a-b*b+distance*distance)/(2*distance);bend2=a*a-along*along
            if bend2 < -tolerance:raise RuntimeError('Paw outside anatomical reach')
            old_upper=fk[ln].translation-fk[un].translation;old_lower=fk[en].translation-fk[ln].translation
            direction=limb_pole(limb,fk,axis,old_upper)
            radius=math.sqrt(max(0.,bend2));center=start+axis*along
            joint=center+direction*radius
            rotations[un]=old_upper.rotation_difference(joint-start)@fk[un].to_quaternion()
            rotations[ln]=old_lower.rotation_difference(end-joint)@fk[ln].to_quaternion()
        solved=from_rotations(rotations,roots,offsets);skin=skin_points(target_cache,solved,rest)[body_index]
        solved,skin,head_lift,head_limited=clear_head_contact(solved,skin,skin_tolerance)
        errors={limb['end']:goals[limb['end']]-float(skin[limb['target_sole'],2].min()) for limb in limbs}
        error=max(abs(v) for v in errors.values())
        minimum=float(skin[:,2].min())
        if enforce_body_floor and minimum < -skin_tolerance:
            index=int(np.argmin(skin[:,2]));driver=target_cache[body_index][2][index]
            floor_constraint=dict(vertex=index,driver=driver,penetration=-minimum)
            contact_limb=next((limb for limb in limbs if limb['chain'][0].endswith('Shoulder') and driver in {limb['upper'],limb['lower']}),None)
            adjusted_local=False
            if contact_limb:
                side=contact_limb['side']
                a,b=contact_limb['lengths']
                if scapula_lifts[side]<max_scapula_lift-1e-6:
                    needed=min(max_scapula_lift,scapula_lifts[side]-minimum*1.05)
                    test_start=fk[side+'Shoulder'].translation+Vector((0,0,shift+needed))
                    sl=(fk[contact_limb['upper']].translation-fk[side+'Shoulder'].translation).length
                    if (ends[contact_limb['end']]-test_start).length<a+b+sl-1e-3:
                        scapula_lifts[side]=needed;adjusted_local=True
            if not adjusted_local:minimum_shift=max(minimum_shift,shift-minimum)
            previous_error=math.inf
            for name,residual in errors.items():ends[name].z+=residual
            continue
        contact=dict(pelvisShift=shift,pawError=error,headLift=head_lift,headContactLimit=head_limited,
            scapulaLifts=dict(scapula_lifts),floorConstraint=floor_constraint,
            clearanceBefore={limb['end']:float(fk_skin[limb['target_sole'],2].min()) for limb in limbs},clearanceWanted=goals,
            contactFit='converged')
        # Bone lengths, nonpenetration and minimum swing clearance are hard
        # constraints. Exact donor foot heights are a fit objective; retain
        # the best physically feasible pose when that objective stalls.
        supported=not any(value==0 for value in goals.values()) or minimum<=skin_tolerance
        if max(errors.values())<=skin_tolerance and supported and (best_feasible is None or error<best_feasible[1]['pawError']):
            best_feasible=(solved,contact)
        if error<=skin_tolerance:return solved,contact
        if error>=previous_error-1e-10:
            if best_feasible:
                best_feasible[1]['contactFit']='constrained'
                return best_feasible
            raise RuntimeError('Paw skin contact stopped converging without a feasible clearance: '+str(errors))
        previous_error=error
        for name,residual in errors.items():ends[name].z+=residual

# Measure the donor contact baseline without altering the fitted bind mesh.
# Contact correction belongs to the animation, not to the sculpted shoulder.
idle=bpy.data.actions['idle 50']; donor.animation_data.action=idle; donor.animation_data.action_slot=idle.slots[0]
scene.frame_set(0); bpy.context.view_layer.update()
idle_bases={pb.name:pb.matrix_basis.copy() for pb in donor.pose.bones}
idle_world={pb.name:(donor.matrix_world@pb.matrix).copy() for pb in donor.pose.bones}
idle_skin=skin_points(source_cache,idle_world,donor_rest)[0]
for limb in limbs:limb['contact_height']=float(idle_skin[limb['source_sole'],2].min())
donor_chest_verts=np.array([i for i,n in enumerate(source_cache[0][2]) if n in {'Spine3','Spine4'}],dtype=int)
def chest_lying_blend(source_skin):
    c=max(0.,float(source_skin[donor_chest_verts,2].min()))
    t=min(1.,max(0.,(c-0.02)/0.10))
    return 1.-t*t*(3.-2.*t)
new_actions = []
contact_report = {}
for clip_name in CLIPS:
    source_action = bpy.data.actions[clip_name]
    donor.animation_data.action = source_action; donor.animation_data.action_slot = source_action.slots[0]
    start, end = source_action.frame_range
    if end==start:
        # A one-frame source pose occupies one native 25 Hz frame; encode a
        # nonzero duration so it can be selected and played by Three.js.
        frames=[float(start),float(start+scene.render.fps/25)]
    elif clip_name in REFERENCES:
        sample_fps=BASE_SAMPLE_FPS if clip_name in HIGH_RATE else min(120,BASE_SAMPLE_FPS)
        count=round((end-start)/scene.render.fps*sample_fps)
        frames=[float(start+(end-start)*i/count) for i in range(count+1)]
    else:
        frames = sorted({float(start), float(end)} | {float(i) for i in range(math.ceil(start), math.floor(end)+1)})
    # Gather donor samples before attaching the new action to avoid evaluation
    # of partially authored curves during the bake.
    samples = []
    for frame in frames:
        scene.frame_set(int(frame), subframe=frame % 1); bpy.context.view_layer.update()
        samples.append((frame-start, {pb.name: pb.matrix_basis.copy() for pb in donor.pose.bones},
                        {pb.name:(donor.matrix_world@pb.matrix).copy() for pb in donor.pose.bones}))
    if clip_name in BASE:
        rows=[]
        for frame,source_bases,source_world in samples:
            fk=retarget_endpoints(retarget_body_chain(forward(retarget_bases(source_bases,source_world)),source_world),source_world);skin=skin_points(target_cache,fk,rest)[body_index]
            source_skin=skin_points(source_cache,source_world,donor_rest)[0]
            rows.append(dict(frame=frame,fk={limb['end']:float(skin[limb['target_sole'],2].min()) for limb in limbs},
                source={limb['end']:float(source_skin[limb['source_sole'],2].min())-limb['contact_height'] for limb in limbs}))
        clearances=swing_clearances(rows)
    action = bpy.data.actions.new('Rebuilt|'+clip_name); rig.animation_data_create(); rig.animation_data.action = action
    previous_quaternions = {}; contacts=[]
    for sample_index,(frame, source_bases, source_world) in enumerate(samples):
        bases=retarget_bases(source_bases,source_world)
        source_skin=None if clip_name in BASE else skin_points(source_cache,source_world,donor_rest)[0]
        lb=0. if clip_name in BASE else chest_lying_blend(source_skin)
        world=retarget_endpoints(retarget_body_chain(forward(bases),source_world),source_world,lying_blend=lb)
        if clip_name in BASE:
            world,contact=ground_limbs(world,clearances[sample_index]); contacts.append(dict(frame=frame,**contact))
        else:
            goals={limb['end']:max(0.,float(source_skin[limb['source_sole'],2].min())-limb['contact_height'])*limb['ratio'] for limb in limbs}
            world,contact=ground_limbs(world,goals,allow_reversed_height=True);contacts.append(dict(frame=frame,**contact))
        for bone in arm.bones:
            name=bone.name
            if name == 'Muzzle': continue
            kwargs={} if not bone.parent else dict(parent_matrix=world[bone.parent.name],parent_matrix_local=rest[bone.parent.name])
            basis=bone.convert_local_to_pose(world[name],rest[name],invert=True,**kwargs)
            loc,q,scale=basis.decompose()
            if name in previous_quaternions and q.dot(previous_quaternions[name]) < 0: q.negate()
            previous_quaternions[name]=q.copy()
            pb=rig.pose.bones[name]; pb.rotation_mode='QUATERNION'; pb.rotation_quaternion=q; pb.scale=(1,1,1); pb.location=loc
            pb.keyframe_insert('rotation_quaternion',frame=frame)
            if name not in fixed_segments: pb.keyframe_insert('location',frame=frame)
            elif loc.length > 1e-5: raise RuntimeError('Unexpected translating limb segment: '+name+' '+str(loc))
    contact_report[clip_name]=contacts
    action.use_fake_user = True; new_actions.append((action, clip_name))
    constrained=[c for c in contacts if c['contactFit']=='constrained']
    if constrained:print('CONSTRAINED_FOOT_FIT',clip_name,len(constrained),'max',max(c['pawError'] for c in constrained),flush=True)
    print('BAKED', clip_name, len(samples), flush=True)

for obj in list(bpy.data.objects):
    if obj not in meshes and obj != rig: bpy.data.objects.remove(obj, do_unlink=True)
for data in list(bpy.data.armatures):
    if data!=arm: bpy.data.armatures.remove(data)
for action in list(bpy.data.actions):
    if action not in [a for a,_ in new_actions]: bpy.data.actions.remove(action)
for action, name in new_actions:
    action.name = name
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points: key.interpolation = 'LINEAR'
rig.animation_data.action = next(action for action,name in new_actions if name==('idle 50' if 'idle 50' in CLIPS else CLIPS[0]))
rig.animation_data.action_slot = rig.animation_data.action.slots[0]; scene.frame_set(0)
for image in bpy.data.images:
    if image.has_data and not image.packed_file: image.pack()
bpy.data.orphans_purge(do_recursive=True)
blend_path = OUT / 'candidate.blend' if args.draft else ROOT / 'sources_backup/artifacts/ushiro/ushiro.blend'
glb_path = Path('/tmp/ushiro-candidate.glb') if args.draft else ROOT / 'public/characters/ushiro/ushiro.glb'
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), compress=True)
bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format='GLB', export_extras=True, export_animations=True, export_skins=True, export_animation_mode='ACTIONS', export_force_sampling=False)
(REPORTS / 'joint-mapping.json').write_text(json.dumps(dict(mapping=mapping, joints={n:list(p) for n,p in target.items()}, torsoRatio=torso_ratio, motionTranslationScale=list(root_translation_scale), maximumNonTailBindDisplacement=maximum_non_tail_bind_displacement, nativePelvisControl=list(points['pelvis_jnt']), nativeHipCenter=list(native_hip_center), fittedHips=list(fitted_hips), nonContactFurFaces=fur_faces, sourceQuaternionSignCorrections=source_quaternion_corrections, sourceCorrectiveSmoothing=source_smoothing), indent=2)+'\n')
(REPORTS / 'contact-report.json').write_text(json.dumps(contact_report,indent=2)+'\n')
print('EXPORTED', str(glb_path), len(CLIPS), flush=True)
shutil.rmtree(work)
os._exit(0)
