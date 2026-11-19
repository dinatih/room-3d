"""Rebuild Ushiro from measured joints and authored skin, using the Pitbull hierarchy.

blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-ushiro.py -- --draft --base-only
The donor's Arm is the ELBOW, ForeArm the WRIST, Pelvis the HIP and UpLeg the KNEE.
Bone names must never be interpreted as anatomical landmarks without inspecting them.
"""
from pathlib import Path
import argparse, json, math, os, shutil, sys, tempfile, zipfile
import bpy
import numpy as np
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--base-only', action='store_true')
parser.add_argument('--draft', action='store_true')
parser.add_argument('--sample-fps', type=int, default=math.lcm(25,30,60,120))
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
OUT = ROOT / 'artifacts/ushiro/rebuild'
OUT.mkdir(parents=True, exist_ok=True)
BASE = ['idle 50', 'walk_fwd 29', 'run_fwd 13']
BASE_SAMPLE_FPS = args.sample_fps
if BASE_SAMPLE_FPS<=0:raise ValueError('Sample frequency must be positive')
CLIPS = BASE if args.base_only else [e['value'] for e in json.loads((ROOT / 'src/features/inventory/dogAnimationOptions.json').read_text())['animated-pitbull-dog']]
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

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
graph = bpy.context.evaluated_depsgraph_get()
source_weights = {}
for obj in meshes:
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
target = {'Reference': Vector(), 'Hips': points['pelvis_jnt'].copy(),
          'Spine': points['pelvis_jnt'].lerp(points['spine_1_jnt'], .5), 'Spine1': points['spine_1_jnt'].copy(),
          'Spine2': points['spine_1_jnt'].lerp(points['spine_2_jnt'], .5), 'Spine3': points['spine_2_jnt'].copy(),
          'Spine4': points['chest_jnt'].copy(), 'Neck01': points['neck_base_jnt'].copy(),
          'Neck02': points['neck_mid_jnt'].copy(), 'Neck03': points['neck_mid_jnt'].lerp(points['head_jnt'], .5),
          'Head': points['head_jnt'].copy(), 'Jaw': points['jaw_jnt'].copy()}
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
        # The source has a long humerus/short radius, and a short femur/long
        # tibia. Normalize each two-link chain to the donor's anatomical ratio
        # while preserving its total Shiba length. This also brings the upper
        # arm close to scapular length and keeps the thigh longer than the shin.
        pair = 1 if chain[0]=='Shoulder' else 0
        original_total = lengths[pair]+lengths[pair+1]
        donor_lengths = [(dp[side+b]-dp[side+a]).length for a,b in zip(chain,chain[1:])]
        for i in [pair,pair+1]: lengths[i]=original_total*donor_lengths[i]/(donor_lengths[pair]+donor_lengths[pair+1])
        for index, (a, b, oa, ob) in enumerate(zip(chain, chain[1:], old_chain, old_chain[1:])):
            a, b = side + a, side + b
            target[b] = target[a] + (dp[b] - dp[a]).normalized() * lengths[index]
        # Keep the source's authored paw resting on the same plane. This adjusts
        # the whole limb's attachment, never the lengths of its segments.
        paw = side + ('Hand' if chain[0] == 'Shoulder' else 'Foot')
        original_paw = f'{initial}_' + ('hand_jnt' if chain[0] == 'Shoulder' else 'foot_jnt')
        dz = points[original_paw].z - target[paw].z
        for name, old_name in zip(chain, old_chain):
            name = side + name; target[name].z += dz; mapping[old_name] = name; anchors[name] = old_name
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
    for limb in limbs:
        if name in limb['chain'][:-1]:
            i = limb['chain'].index(name)
            before = points[limb['original'][i+1]] - points[limb['original'][i]]
            after = target[limb['chain'][i+1]] - target[name]
            direction = before.normalized()
            stretch = Matrix.Identity(3)
            for row in range(3):
                for col in range(3): stretch[row][col] += (after.length/before.length-1)*direction[row]*direction[col]
            return before.rotation_difference(after).to_matrix() @ stretch
    return Matrix.Identity(3)

original_tail_end = old['tail_7_jnt'] @ Vector((0, (standing_tail_end-standing_points['tail_7_jnt']).length, 0))
deforms = {}
for name, anchor in anchors.items():
    matrix = deformation_matrix(name)
    deforms[name] = (matrix, points[anchor], target[name])
deforms['Spine'] = (Matrix.Identity(3), points['pelvis_jnt'], target['Hips'])
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
            if old_name=='breathe_jnt':
                span=target['breathe l'].x-target['breathe r'].x
                left=min(1.,max(0.,(point.x-target['breathe r'].x)/span))
                for lateral,share in [('breathe l',left),('breathe r',1-left)]:
                    combined[lateral]=combined.get(lateral,0)+weight/total*share
            else: combined[name] = combined.get(name, 0) + weight / total
        vertex.co = result
        for name, weight in combined.items(): groups.setdefault(name, []).append((vertex.index, weight))
    for name, weights in groups.items():
        group = obj.vertex_groups.new(name=name)
        for index, weight in weights: group.add([index], weight, 'REPLACE')

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
for source_action in bpy.data.actions:
    for layer in source_action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                quaternion_curves={}
                for curve in bag.fcurves:
                    for key in curve.keyframe_points: key.interpolation='LINEAR'
                    if curve.data_path.endswith('rotation_quaternion'):
                        quaternion_curves.setdefault(curve.data_path,{})[curve.array_index]=curve
                for curves in quaternion_curves.values():
                    previous=None
                    count=len(curves[0].keyframe_points)
                    if any(len(c.keyframe_points)!=count for c in curves.values()): raise RuntimeError('Inconsistent donor quaternion keys')
                    for i in range(count):
                        values=[curves[c].keyframe_points[i].co.y for c in range(4)]
                        if previous is not None and sum(a*b for a,b in zip(previous,values)) < 0:
                            values=[-v for v in values]
                            for c in range(4): curves[c].keyframe_points[i].co.y=values[c]
                        previous=values
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
        result.append((coords, {n:(np.array([i for i,_ in weights]), np.array([w for _,w in weights])) for n,weights in influences.items()}, dominant))
    return result

def skin_points(cache, world, bind):
    result = []
    matrices = {n:np.array(m @ bind[n].inverted(), dtype=np.float64) for n,m in world.items()}
    for coords, influences, _ in cache:
        deformed = np.zeros((len(coords), 3), dtype=np.float64)
        for name, (indices, weights) in influences.items():
            deformed[indices] += (coords[indices] @ matrices[name].T)[:, :3] * weights[:, None]
        result.append(deformed)
    return result

donor_meshes = [o for o in donor_objects if o.type=='MESH' and o.vertex_groups]
donor_body = max(donor_meshes, key=lambda o:len(o.data.vertices))
body = max(meshes, key=lambda o:len(o.data.vertices))
source_cache = skin_cache([donor_body], donor, donor_rest)
target_cache = skin_cache(meshes, rig, rest)
body_index = meshes.index(body)
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
fixed_segments=set()
for limb in limbs:
    fixed_segments.update(limb['chain'][1:])
    fixed_segments.update(b.name for b in arm.bones[limb['chain'][-1]].children_recursive)
donor_unit_scale=donor.matrix_world.to_scale().x
root_translation_scale=Vector(((target['LeftPelvis']-target['RightPelvis']).length/(dp['LeftPelvis']-dp['RightPelvis']).length,
    torso_ratio,sum(limb['ratio'] for limb in limbs)/len(limbs)))

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

def retarget_bases(source_bases, preserve_breed_shape=True):
    result={}
    for name in rest:
        if name=='Muzzle': result[name]=Matrix.Identity(4); continue
        loc,q,scale=source_bases[name].decompose()
        # A Shiba's pricked pinnae and coiled tail do not share the donor's
        # floppy-ear/straight-tail reference shape. In the three base gaits,
        # keep the pinnae and intrinsic coil; Tail01 still carries the wag.
        preserve=preserve_breed_shape and (name in {f'Tail{i:02d}' for i in range(2,8)} or name in {'LeftEar','LeftEar2','LeftEar3','RightEar','RightEar2','RightEar3'})
        if preserve: q=Matrix.Identity(3).to_quaternion();loc=Vector()
        result[name]=q.to_matrix().to_4x4()
        # Blender's imported donor armature has a uniform object scale. Convert
        # its local translations into world units before proportion scaling.
        if name in fixed_segments or preserve:translation=Vector()
        elif preserve_breed_shape:
            # Locomotion's vertical displacement follows limb proportions,
            # not the shorter trunk ratio. Apply anatomical axis scaling in
            # the donor's world bind frame, then return to bone-local space.
            orientation=donor_rest[name].to_quaternion()
            reference_loc=idle_bases[name].to_translation()
            world=orientation@((loc-reference_loc)*donor_unit_scale)
            scaled=Vector(tuple(world[i]*root_translation_scale[i] for i in range(3)))
            translation=reference_loc*(donor_unit_scale*torso_ratio)+orientation.inverted()@scaled
        else:translation=loc*(donor_unit_scale*torso_ratio)
        result[name].translation=translation
    return result

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

def ground_limbs(fk, goals):
    """Fixed-length analytic IK with a shared angle-preserving pelvis height."""
    fk_skin=skin_points(target_cache,fk,rest)[body_index]
    ends={limb['end']:fk[limb['end']].translation+Vector((0,0,goals[limb['end']]-float(fk_skin[limb['target_sole'],2].min()))) for limb in limbs}
    rotations={n:m.to_quaternion() for n,m in fk.items()}
    offsets={b.name:fk[b.parent.name].inverted()@fk[b.name].translation for b in arm.bones if b.parent}
    root_positions={b.name:fk[b.name].translation.copy() for b in arm.bones if not b.parent}
    previous_error=math.inf
    tolerance=(max(v.co.z for v in body.data.vertices)-min(v.co.z for v in body.data.vertices))*1e-5
    while True:
        lower,upper=-math.inf,math.inf;terms=[]
        for limb in limbs:
            start=fk[limb['upper']].translation;end=ends[limb['end']]
            a,b=limb['lengths'];horizontal2=(end.x-start.x)**2+(end.y-start.y)**2
            if horizontal2>(a+b)**2+1e-10:raise RuntimeError('Unreachable horizontal paw target')
            dz=end.z-start.z;inner=math.sqrt(max(0.,(a-b)**2-horizontal2));outer=math.sqrt(max(0.,(a+b)**2-horizontal2))
            lower=max(lower,dz+inner);upper=min(upper,dz+outer)
            distance=(fk[limb['end']].translation-start).length
            terms.append((1/(2*a*b),dz,dz*dz+horizontal2-distance*distance))
        if lower>upper+tolerance:raise RuntimeError('No common pelvis height for continuous paw arcs')
        coefficients=[sum(k*k for k,d,c in terms),-3*sum(k*k*d for k,d,c in terms),
                      sum(k*k*(2*d*d+c) for k,d,c in terms),-sum(k*k*d*c for k,d,c in terms)]
        candidates=[lower,upper]
        candidates.extend(float(r.real) for r in np.roots(coefficients) if abs(r.imag)<1e-9 and lower<=r.real<=upper)
        shift=min(candidates,key=lambda z:sum((k*(z*z-2*d*z+c))**2 for k,d,c in terms))
        roots={n:p+Vector((0,0,shift)) for n,p in root_positions.items()}
        for limb in limbs:
            un,ln,en=[limb[n] for n in ['upper','lower','end']]
            start=fk[un].translation+Vector((0,0,shift));end=ends[en]
            axis=end-start;distance=axis.length;axis.normalize();a,b=limb['lengths']
            along=(a*a-b*b+distance*distance)/(2*distance);bend2=a*a-along*along
            if bend2 < -tolerance:raise RuntimeError('Paw outside anatomical reach')
            old_upper=fk[ln].translation-fk[un].translation;old_lower=fk[en].translation-fk[ln].translation
            pole=old_upper-axis*old_upper.dot(axis)
            if pole.length<1e-9:raise RuntimeError('Undefined elbow/knee bend plane')
            joint=start+axis*along+pole.normalized()*math.sqrt(max(0.,bend2))
            rotations[un]=old_upper.rotation_difference(joint-start)@fk[un].to_quaternion()
            rotations[ln]=old_lower.rotation_difference(end-joint)@fk[ln].to_quaternion()
        solved=from_rotations(rotations,roots,offsets);skin=skin_points(target_cache,solved,rest)[body_index]
        errors={limb['end']:goals[limb['end']]-float(skin[limb['target_sole'],2].min()) for limb in limbs}
        error=max(abs(v) for v in errors.values())
        if error<=tolerance:return solved,dict(pelvisShift=shift,pawError=error,
            clearanceBefore={limb['end']:float(fk_skin[limb['target_sole'],2].min()) for limb in limbs},clearanceWanted=goals)
        if error>=previous_error-1e-10:raise RuntimeError('Paw skin contact stopped converging: '+str(errors))
        previous_error=error
        for name,residual in errors.items():ends[name].z+=residual

# Calibrate the *bind offsets*, not the animation, so the donor's actual idle
# posture rests on all four Shiba paws without forcing any elbow straight.
idle=bpy.data.actions['idle 50']; donor.animation_data.action=idle; donor.animation_data.action_slot=idle.slots[0]
scene.frame_set(0); bpy.context.view_layer.update()
idle_bases={pb.name:pb.matrix_basis.copy() for pb in donor.pose.bones}
idle_world={pb.name:(donor.matrix_world@pb.matrix).copy() for pb in donor.pose.bones}
idle_skin=skin_points(source_cache,idle_world,donor_rest)[0]
for limb in limbs:limb['contact_height']=float(idle_skin[limb['source_sole'],2].min())
reference_adjustments={limb['end']:0. for limb in limbs}
previous_error=math.inf
while True:
    neutral=forward(retarget_bases(idle_bases))
    skin=skin_points(target_cache,neutral,rest)[body_index]
    clearance={limb['end']:float(skin[limb['target_sole'],2].min()) for limb in limbs}
    error=max(abs(v) for v in clearance.values())
    if error < 1e-7: break
    if error >= previous_error-1e-10: raise RuntimeError('Neutral paw calibration stopped converging')
    previous_error=error
    shifts={}
    for limb in limbs:
        shift=Vector((0,0,-clearance[limb['end']]))
        reference_adjustments[limb['end']]+=shift.z
        root=limb['chain'][0]
        for bone in [arm.bones[root],*arm.bones[root].children_recursive]: shifts[bone.name]=shift
    for obj in meshes:
        for vertex in obj.data.vertices:
            offset=Vector()
            for group in vertex.groups:
                name=obj.vertex_groups[group.group].name
                if name in shifts: offset+=shifts[name]*group.weight
            vertex.co+=offset
    bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    for name,shift in shifts.items():
        bone=arm.edit_bones[name]; matrix=bone.matrix.copy(); matrix.translation+=shift; bone.matrix=matrix; target[name]+=shift
    bpy.ops.object.mode_set(mode='OBJECT')
    rest={b.name:b.matrix_local.copy() for b in arm.bones}
    rest_local={b.name:(rest[b.parent.name].inverted()@rest[b.name] if b.parent else rest[b.name]) for b in arm.bones}
    target_cache=skin_cache(meshes,rig,rest)

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
    elif clip_name in BASE:
        count=round((end-start)/scene.render.fps*BASE_SAMPLE_FPS)
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
            fk=forward(retarget_bases(source_bases));skin=skin_points(target_cache,fk,rest)[body_index]
            source_skin=skin_points(source_cache,source_world,donor_rest)[0]
            rows.append(dict(frame=frame,fk={limb['end']:float(skin[limb['target_sole'],2].min()) for limb in limbs},
                source={limb['end']:float(source_skin[limb['source_sole'],2].min())-limb['contact_height'] for limb in limbs}))
        clearances=swing_clearances(rows)
    action = bpy.data.actions.new('Rebuilt|'+clip_name); rig.animation_data_create(); rig.animation_data.action = action
    previous_quaternions = {}; contacts=[]
    for sample_index,(frame, source_bases, source_world) in enumerate(samples):
        bases=retarget_bases(source_bases,preserve_breed_shape=clip_name in BASE)
        world=forward(bases)
        if clip_name in BASE:
            world,contact=ground_limbs(world,clearances[sample_index]); contacts.append(dict(frame=frame,**contact))
        else:
            minimum=min(float(skin[:,2].min()) for skin in skin_points(target_cache,world,rest))
            if minimum < 0:
                for matrix in world.values(): matrix.translation.z-=minimum
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
rig.animation_data.action = next(action for action,name in new_actions if name=='idle 50')
rig.animation_data.action_slot = rig.animation_data.action.slots[0]; scene.frame_set(0)
for image in bpy.data.images:
    if image.has_data and not image.packed_file: image.pack()
bpy.data.orphans_purge(do_recursive=True)
blend_path = OUT / 'candidate.blend' if args.draft else ROOT / 'artifacts/ushiro/ushiro.blend'
glb_path = Path('/tmp/ushiro-candidate.glb') if args.draft else ROOT / 'public/characters/ushiro/ushiro.glb'
bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), compress=True)
bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format='GLB', export_animations=True, export_skins=True, export_animation_mode='ACTIONS', export_force_sampling=False)
(OUT / 'joint-mapping.json').write_text(json.dumps(dict(mapping=mapping, joints={n:list(p) for n,p in target.items()}, torsoRatio=torso_ratio, locomotionTranslationScale=list(root_translation_scale), neutralPawAdjustments=reference_adjustments), indent=2)+'\n')
(OUT / 'contact-report.json').write_text(json.dumps(contact_report,indent=2)+'\n')
print('EXPORTED', str(glb_path), len(CLIPS), flush=True)
shutil.rmtree(work)
os._exit(0)
