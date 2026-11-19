"""Rebuild Ulotte HD (dachshund-sculpt) with true 1-to-1 Pitbull anatomical joint correspondence,
clean torso-isolated skin weights, fixed-length analytic IK, and local cervical ground clearance.

Usage:
  blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-ulotte.py -- --draft --priority-only --sample-fps 25
  blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-ulotte.py
"""
from pathlib import Path
import argparse, json, math, os, runpy, sys, tempfile, zipfile
import bpy
import numpy as np
from mathutils import Vector, Matrix, Quaternion

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
sel = parser.add_mutually_exclusive_group()
sel.add_argument('--base-only', action='store_true')
sel.add_argument('--priority-only', action='store_true')
sel.add_argument('--clips', nargs='+')
parser.add_argument('--draft', action='store_true')
parser.add_argument('--output-dir', type=Path, default=Path('/tmp/ulotte-rebuild-draft'))
parser.add_argument('--sample-fps', type=int, default=120)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])

BASE_CLIPS = ['idle 50', 'walk_fwd 29', 'run_fwd 13']
PRIORITY_CLIPS = BASE_CLIPS + [
    'walk_fwd_sniff 46',
    'idle_shake_1. 137',
    'idle_shake_2. 81',
    'idle_to_idle_lay 111',
    'idle_lay_pose 2',
    'idle_lay_to_idle 71',
    'interact_bed_lay_exist 270',
    'interact_bed_sleep_exist 221',
    'pee 43',
    'poop 75',
    'idle_bark_04_warning 47',
]
HIGH_RATE = set(BASE_CLIPS + [
    'walk_fwd_sniff 46', 'idle_shake_1. 137', 'idle_shake_2. 81',
    'idle_to_idle_lay 111', 'idle_lay_to_idle 71',
])

all_catalog = [e['value'] for e in json.loads((ROOT / 'src/features/inventory/dogAnimationOptions.json').read_text())['animated-pitbull-dog']]
if args.base_only:
    CLIPS = BASE_CLIPS
elif args.priority_only:
    CLIPS = PRIORITY_CLIPS
elif args.clips:
    if len(set(args.clips)) != len(args.clips):
        raise ValueError('Duplicate clips')
    if set(args.clips) - set(all_catalog):
        raise ValueError('Unknown clips: ' + str(set(args.clips) - set(all_catalog)))
    CLIPS = args.clips
else:
    CLIPS = all_catalog

OUT_GLB = (args.output_dir / 'dog.glb') if args.draft else (ROOT / 'public/characters/dachshund-sculpt/dog.glb')
OUT_BLEND = (args.output_dir / 'dachshund.blend') if args.draft else (ROOT / 'artifacts/dachshund-sculpt/dachshund.blend')
OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
OUT_BLEND.parent.mkdir(parents=True, exist_ok=True)

# 1. Load source dachshund sculpt and prepare black shaded coat
bpy.ops.wm.read_factory_settings(use_empty=True)
with tempfile.TemporaryDirectory() as directory:
    with zipfile.ZipFile(Path.home() / '3D Resources/animals/dachshund-sculpt.zip') as archive:
        src_path = Path(directory) / 'source.glb'
        src_path.write_bytes(archive.read('source/CocoSculpt.glb'))
    bpy.ops.import_scene.gltf(filepath=str(src_path))

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
body = bpy.data.objects['CocoSculpt']
floor = min((body.matrix_world @ v.co).z for v in body.data.vertices)
for obj in meshes:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for v in obj.data.vertices:
        v.co.z -= floor

bpy.context.view_layer.objects.active = body
mod = body.modifiers.new('60k presentation mesh', 'DECIMATE')
mod.ratio = 60000 / len(body.data.vertices)
bpy.ops.object.modifier_apply(modifier=mod.name)

# Preserve Ulotte's black shaded coat vertex colours (separate eyes untouched)
for attribute in body.data.color_attributes:
    for entry in attribute.data:
        r, g, b, a = entry.color
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        entry.color = (lum * 0.055, lum * 0.055, lum * 0.055, a)
for material in body.data.materials:
    material.use_nodes = True
    material.node_tree.nodes.clear()
    shader = material.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    shader.inputs['Roughness'].default_value = 0.6
    shader.inputs['Metallic'].default_value = 0.0
    colour = material.node_tree.nodes.new('ShaderNodeVertexColor')
    colour.layer_name = body.data.color_attributes[0].name
    output = material.node_tree.nodes.new('ShaderNodeOutputMaterial')
    material.node_tree.links.new(colour.outputs['Color'], shader.inputs['Base Color'])
    material.node_tree.links.new(shader.outputs['BSDF'], output.inputs['Surface'])

# 2. Build true 1-to-1 Pitbull-compatible anatomical skeleton (46 bones)
# Measured directly on CocoSculpt cross-sections:
#   Shoulder = top of scapula | Shoulder01 = shoulder joint | Arm = elbow | ForeArm = wrist | Hand = paw base
#   Pelvis   = hip joint      | UpLeg      = knee (stifle)  | Leg = hock  | Foot    = paw base
heads = {
    'Hips':   (0.0,  0.615, 0.495),
    'Spine':  (0.0,  0.455, 0.505),
    'Spine1': (0.0,  0.295, 0.505),
    'Spine2': (0.0,  0.135, 0.505),
    'Spine3': (0.0, -0.025, 0.505),
    'Spine4': (0.0, -0.185, 0.500),
    'Neck01': (0.0, -0.305, 0.510),
    'Neck02': (0.0, -0.400, 0.560),
    'Neck03': (0.0, -0.485, 0.635),
    'Head':   (0.0, -0.575, 0.715),
}
spine_names = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Spine3', 'Spine4']
parents = {child: parent for parent, child in zip(list(heads), list(heads)[1:])}
ends = {'Head': (0.0, -0.800, 0.665)}

for side, sign in [('Left', 1.0), ('Right', -1.0)]:
    front_chain = [
        ('Shoulder',    (0.075, -0.155, 0.515)),
        ('Shoulder01',  (0.115, -0.205, 0.310)),
        ('Arm',         (0.110, -0.095, 0.190)),
        ('ForeArm',     (0.102, -0.125, 0.082)),
        ('Hand',        (0.105, -0.160, 0.032)),
        ('HandMiddle1', (0.105, -0.205, 0.024)),
    ]
    rear_chain = [
        ('Pelvis',  (0.100, 0.615, 0.440)),
        ('UpLeg',   (0.118, 0.595, 0.275)),
        ('Leg',     (0.132, 0.728, 0.165)),
        ('Foot',    (0.134, 0.680, 0.040)),
        ('ToeBase', (0.134, 0.630, 0.025)),
    ]
    for chain, root_parent in [(front_chain, 'Spine4'), (rear_chain, 'Hips')]:
        parent = root_parent
        for part, pt in chain:
            key = side + part
            heads[key] = (pt[0] * sign, pt[1], pt[2])
            parents[key] = parent
            parent = key
        ends[parent] = (heads[parent][0], heads[parent][1] - 0.040, heads[parent][2])

    for i, pt in enumerate([(0.12, -0.47, 0.76), (0.17, -0.43, 0.66), (0.17, -0.40, 0.55)], 1):
        name = side + ('Ear' if i == 1 else f'Ear{i}')
        heads[name] = (sign * pt[0], pt[1], pt[2])
        parents[name] = 'Head' if i == 1 else side + ('Ear' if i == 2 else 'Ear2')
    ends[side + 'Ear3'] = (sign * 0.16, -0.39, 0.51)

tail_pts = [
    (0.0, 0.78, 0.422), (0.0, 0.85, 0.388), (0.0, 0.92, 0.379), (0.0, 0.99, 0.382),
    (0.0, 1.06, 0.394), (0.0, 1.13, 0.415), (0.0, 1.20, 0.444), (0.0, 1.23, 0.462),
]
for i in range(7):
    name = f'Tail{i+1:02d}'
    heads[name] = tail_pts[i]
    ends[name] = tail_pts[i + 1]
    parents[name] = 'Hips' if i == 0 else f'Tail{i:02d}'

# Non-deforming nose marker for scene animal camera
heads['Muzzle'] = ends['Head']
parents['Muzzle'] = 'Head'
ends['Muzzle'] = (ends['Head'][0], ends['Head'][1] - 0.02, ends['Head'][2])

children = {p: c for c, p in parents.items() if not c.startswith(('Left', 'Right', 'Tail')) and c != 'Muzzle'}
for side in ['Left', 'Right']:
    for seq in [
        ('Shoulder', 'Shoulder01', 'Arm', 'ForeArm', 'Hand', 'HandMiddle1'),
        ('Pelvis', 'UpLeg', 'Leg', 'Foot', 'ToeBase'),
        ('Ear', 'Ear2', 'Ear3'),
    ]:
        for a, b in zip(seq, seq[1:]):
            children[side + a] = side + b

arm = bpy.data.armatures.new('dachshund-sculpt anatomical skeleton')
rig = bpy.data.objects.new('dachshund-sculptRig', arm)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name, pt in heads.items():
    eb = arm.edit_bones.new(name)
    eb.head = Vector(pt)
    eb.tail = Vector(ends[name] if name in ends else heads[children[name]])
    eb.align_roll(Vector((1, 0, 0)))
    eb.use_deform = (name != 'Muzzle')
for name, parent in parents.items():
    eb = arm.edit_bones[name]
    eb.parent = arm.edit_bones[parent]
    eb.use_connect = (eb.head - eb.parent.tail).length < 1e-6
bpy.ops.object.mode_set(mode='OBJECT')
rig.show_in_front = True

# 3. Automatic heat weights on closed voxel proxy + clean anatomical torso isolation
proxy = body.copy()
proxy.data = body.data.copy()
bpy.context.collection.objects.link(proxy)
bpy.ops.object.select_all(action='DESELECT')
proxy.select_set(True)
bpy.context.view_layer.objects.active = proxy
rm = proxy.modifiers.new('Closed weighting volume', 'REMESH')
rm.mode = 'VOXEL'
rm.voxel_size = 0.008
bpy.ops.object.modifier_apply(modifier=rm.name)
rig.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
if any(not v.groups for v in proxy.data.vertices):
    raise RuntimeError('Heat weighting failed on dachshund proxy')

bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.context.view_layer.objects.active = body
dt = body.modifiers.new('Surface weights', 'DATA_TRANSFER')
dt.object = proxy
dt.use_vert_data = True
dt.data_types_verts = {'VGROUP_WEIGHTS'}
dt.vert_mapping = 'POLYINTERP_NEAREST'
bpy.ops.object.datalayout_transfer(modifier=dt.name)
bpy.ops.object.modifier_apply(modifier=dt.name)
bpy.data.objects.remove(proxy, do_unlink=True)

for obj in meshes:
    obj.parent = rig
    sk = obj.modifiers.new('Skin', 'ARMATURE')
    sk.object = rig
    if obj != body:
        obj.vertex_groups.new(name='Head').add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')

# Clean anatomical weight masks:
# (a) Eliminate limb weight bleed across the ribcage/abdomen/sternum midline
# (b) Rigid skull/eyes mask on Head
# (c) Arclength weights on Tail01..Tail07
spine_pts = [Vector(heads[n]) for n in spine_names]
def spine_projection_weights(point):
    best = None
    for idx in range(len(spine_names) - 1):
        a, b = spine_pts[idx], spine_pts[idx + 1]
        d = b - a
        t = min(1.0, max(0.0, (point - a).dot(d) / d.length_squared))
        dist2 = (point - a.lerp(b, t)).length_squared
        if best is None or dist2 < best[0]:
            best = (dist2, spine_names[idx], spine_names[idx + 1], t)
    _, na, nb, t = best
    return [(na, 1.0 - t), (nb, t)]

limb_all = {
    side + p for side in ('Left', 'Right')
    for p in ('Shoulder', 'Shoulder01', 'Arm', 'ForeArm', 'Hand', 'HandMiddle1', 'Pelvis', 'UpLeg', 'Leg', 'Foot', 'ToeBase')
}
limb_distal = {
    side + p for side in ('Left', 'Right')
    for p in ('Arm', 'ForeArm', 'Hand', 'HandMiddle1', 'UpLeg', 'Leg', 'Foot', 'ToeBase')
}
front_limb_set = {side + p for side in ('Left', 'Right') for p in ('Shoulder', 'Shoulder01', 'Arm', 'ForeArm', 'Hand', 'HandMiddle1')}
rear_limb_set = {side + p for side in ('Left', 'Right') for p in ('Pelvis', 'UpLeg', 'Leg', 'Foot', 'ToeBase')}

vg_by_name = {g.name: g for g in body.vertex_groups}
vg_name_by_idx = {g.index: g.name for g in body.vertex_groups}

def smoothstep(edge0, edge1, x):
    t = min(1.0, max(0.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)

for vertex in body.data.vertices:
    co = vertex.co
    x, y, z = co.x, co.y, co.z
    ws = {vg_name_by_idx[g.group]: g.weight for g in vertex.groups if g.weight > 0.0}

    # 1. Pure torso/abdomen/sternum isolation from limb weights
    # Keep distal limb weights (Arm/ForeArm/Leg) strictly off the torso, while allowing
    # proximal shoulder/hip sockets (Shoulder/Shoulder01/Pelvis) a gentle organic fade.
    front_prox_fade = 1.0 - smoothstep(-0.05, 0.06, y)
    front_dist_fade = 1.0 - smoothstep(-0.06, 0.00, y)
    rear_prox_fade = smoothstep(0.42, 0.54, y)
    rear_dist_fade = smoothstep(0.47, 0.56, y)
    # Remove distal limb weights along the dorsal back (z > 0.44) and ventral midline (|x| < 0.075, z > 0.16)
    midline_mask = (1.0 - smoothstep(0.055, 0.095, abs(x))) * smoothstep(0.15, 0.21, z)
    dorsal_mask = smoothstep(0.42, 0.51, z)
    distal_keep = 1.0 - max(midline_mask, dorsal_mask)

    removed = 0.0
    for name in list(ws):
        keep = 1.0
        if name in front_limb_set:
            keep = min(keep, front_dist_fade if name in limb_distal else front_prox_fade)
        if name in rear_limb_set:
            keep = min(keep, rear_dist_fade if name in limb_distal else rear_prox_fade)
        if name in limb_distal:
            keep = min(keep, distal_keep)
        if keep < 1.0:
            old_w = ws[name]
            new_w = old_w * keep
            removed += old_w - new_w
            if new_w < 1e-5:
                del ws[name]
            else:
                ws[name] = new_w

    if removed > 0.0:
        for sname, share in spine_projection_weights(co):
            ws[sname] = ws.get(sname, 0.0) + removed * share

    # 2. Rigid skull mask matching detached eyes
    w_head = smoothstep(0.0, 0.15, -y - 0.30) * smoothstep(0.0, 0.15, z - 0.45)
    if w_head > 0.0:
        old_h = ws.get('Head', 0.0)
        for name in list(ws):
            if name != 'Head':
                ws[name] *= (1.0 - w_head)
        ws['Head'] = old_h * (1.0 - w_head) + w_head

    # 3. Clean arclength weights for tail
    if y >= tail_pts[0][1] and abs(x) < 0.065 and z > 0.32:
        ws = {}
        idx = next((i for i in range(6) if y < tail_pts[i + 1][1]), 6)
        if idx == 6:
            ws['Tail07'] = 1.0
        else:
            t = min(1.0, max(0.0, (y - tail_pts[idx][1]) / (tail_pts[idx + 1][1] - tail_pts[idx][1])))
            ws[f'Tail{idx+1:02d}'] = 1.0 - t
            ws[f'Tail{idx+2:02d}'] = t

    # Write cleaned weights back
    for g in list(vertex.groups):
        body.vertex_groups[g.group].remove([vertex.index])
    for name, w in ws.items():
        if w > 1e-6:
            vg_by_name[name].add([vertex.index], w, 'REPLACE')

# Lightly smooth weights within local anatomical regions (spine, shoulder socket, hip socket)
# strictly excluding distal limb bones (Arm, ForeArm, Leg) so belly/chest never re-bleed.
edges_all = np.array([tuple(e.vertices) for e in body.data.edges], dtype=int)
for region_set, iters in [
    (set(spine_names), 4),
    ({'Spine3', 'Spine4', 'Neck01', 'LeftShoulder', 'LeftShoulder01', 'RightShoulder', 'RightShoulder01'}, 6),
    ({'Hips', 'Spine', 'LeftPelvis', 'RightPelvis'}, 6),
]:
    r_names = [g.name for g in body.vertex_groups if g.name in region_set]
    if not r_names:
        continue
    r_gidx = {g.index: r_names.index(g.name) for g in body.vertex_groups if g.name in r_names}
    rw = np.zeros((len(body.data.vertices), len(r_names)), dtype=np.float64)
    for v in body.data.vertices:
        for g in v.groups:
            if g.group in r_gidx:
                rw[v.index, r_gidx[g.group]] = g.weight
    rmass = rw.sum(axis=1)
    redges = edges_all[(rmass[edges_all[:, 0]] > 0) & (rmass[edges_all[:, 1]] > 0)]
    rl, rr = np.concatenate([redges[:, 0], redges[:, 1]]), np.concatenate([redges[:, 1], redges[:, 0]])
    rdeg = np.bincount(rl, minlength=len(rw))
    ract = rdeg > 0
    for _ in range(iters):
        sums = np.zeros_like(rw)
        np.add.at(sums, rl, rw[rr])
        rw[ract] = 0.5 * rw[ract] + 0.5 * sums[ract] / rdeg[ract, None]
        tots = rw.sum(axis=1)
        rw[ract] *= (rmass[ract] / tots[ract])[:, None]
    for col, name in enumerate(r_names):
        grp = body.vertex_groups[name]
        grp.remove(list(range(len(rw))))
        for idx in np.flatnonzero(rw[:, col]):
            grp.add([int(idx)], float(rw[idx, col]), 'REPLACE')

bpy.ops.object.select_all(action='DESELECT')
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)
bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
if any(not v.groups for v in body.data.vertices):
    raise RuntimeError('Unweighted dachshund vertices')

# 4. Import Pitbull donor and prepare continuous animation curves
before = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/characters/animated-pitbull-dog/dog.glb'))
donor_objects = set(bpy.data.objects) - before
donor = next(o for o in donor_objects if o.type == 'ARMATURE')
for o in donor_objects:
    if o.type == 'MESH':
        o.hide_viewport = True
for track in list(donor.animation_data.nla_tracks):
    donor.animation_data.nla_tracks.remove(track)

scene = bpy.context.scene
scene.render.fps = 24
runpy.run_path(str(ROOT / 'scripts/dog-animation-curves.py'))['make_actions_continuous'](bpy.data.actions)

# Rest transforms
donor.animation_data.action = None
for pb in donor.pose.bones:
    pb.matrix_basis = Matrix.Identity(4)
bpy.context.view_layer.update()
donor_rest = {b.name: (donor.matrix_world @ b.matrix_local).copy() for b in donor.data.bones}
rest = {b.name: b.matrix_local.copy() for b in arm.bones}
rest_local = {b.name: (rest[b.parent.name].inverted() @ rest[b.name] if b.parent else rest[b.name]) for b in arm.bones}
rest_offsets = {b.name: (rest[b.parent.name].inverted() @ rest[b.name].translation) for b in arm.bones if b.parent}

# Fast numpy skin evaluator (matches Blender/glTF linear blend skinning exactly!)
def build_skin_cache(obj, bind, subset=None):
    all_verts = obj.data.vertices
    if subset is None:
        vlist = list(all_verts)
        idx_map = {v.index: i for i, v in enumerate(vlist)}
    else:
        vlist = [all_verts[int(i)] for i in subset]
        idx_map = {v.index: i for i, v in enumerate(vlist)}
    coords = np.array([list(obj.matrix_world @ v.co) + [1.0] for v in vlist], dtype=np.float64)
    influences = {}
    dominant = []
    for pos, v in enumerate(vlist):
        dominant.append(obj.vertex_groups[max(v.groups, key=lambda g: g.weight).group].name)
        for g in v.groups:
            name = obj.vertex_groups[g.group].name
            influences.setdefault(name, []).append((pos, g.weight))
    local = {}
    for name, ws in influences.items():
        idxs = np.array([i for i, _ in ws], dtype=int)
        facs = np.array([w for _, w in ws], dtype=np.float64)
        inv_b = np.array(bind[name].inverted(), dtype=np.float64)
        local[name] = (idxs, (coords[idxs] @ inv_b.T) * facs[:, None])
    return coords, local, dominant

def eval_skin(cache, world):
    coords, local, _ = cache
    out = np.zeros((len(coords), 3), dtype=np.float64)
    for name, (idxs, lpts) in local.items():
        mat = np.array(world[name], dtype=np.float64)[:3, :]
        out[idxs] += lpts @ mat.T
    return out

donor_body = max((o for o in donor_objects if o.type == 'MESH' and o.vertex_groups), key=lambda o: len(o.data.vertices))
source_cache = build_skin_cache(donor_body, donor_rest)
target_cache = build_skin_cache(body, rest)

# Build a fast ~5k-vertex contact proxy subset of body (all lowest surface points per
# spatial bin + strided surface coverage) for inner solver iterations; full 71k mesh is
# verified after convergence so accuracy is 100% identical at ~10x speed.
all_co = target_cache[0][:, :3]
fast_set = set(range(0, len(all_co), 14))
# Include lowest-Z and extreme-X/Y vertices in fine spatial bins
bins = {}
for idx, (vx, vy, vz) in enumerate(all_co):
    key = (int(vx * 35), int(vy * 35))
    if key not in bins or vz < all_co[bins[key], 2]:
        bins[key] = idx
fast_set.update(bins.values())
# Always include dense coverage of paws, elbows, knees, and muzzle/head
important_bones = {'Head', 'Neck01', 'Neck02', 'Neck03'}
for side in ('Left', 'Right'):
    important_bones.update(side + p for p in ('Arm', 'ForeArm', 'Hand', 'HandMiddle1', 'UpLeg', 'Leg', 'Foot', 'ToeBase'))
for idx, dom in enumerate(target_cache[2]):
    if dom in important_bones and (idx % 8 == 0):
        fast_set.add(idx)
fast_indices = np.array(sorted(fast_set), dtype=int)
fast_cache = build_skin_cache(body, rest, subset=fast_indices)
print(f'CONTACT_CACHE full={len(all_co)} fast={len(fast_indices)}', flush=True)

# Measure donor idle baseline (frame 0 of idle 50)
idle_action = bpy.data.actions['idle 50']
donor.animation_data.action = idle_action
donor.animation_data.action_slot = idle_action.slots[0]
scene.frame_set(0)
bpy.context.view_layer.update()
base_world = {pb.name: (donor.matrix_world @ pb.matrix).copy() for pb in donor.pose.bones}
base_skin = eval_skin(source_cache, base_world)

# Measure true front (chest/brisket) and rear (pelvis/belly) ground clearances for Pitbull vs Ulotte.
# A dachshund's deep brisket hangs ~9 cm lower than its pelvis, so when both chest and rump
# rest on the ground (lying/sleeping), Spine4 MUST stay higher than Hips by (chest_depth - pelvis_depth).
donor_trunk_bones = set(spine_names) | {'breathe l', 'breathe r', 'breathe crotch'}
donor_trunk_verts = np.array([i for i, n in enumerate(source_cache[2]) if n in donor_trunk_bones], dtype=int)
ulotte_trunk_verts = np.array([i for i, n in enumerate(target_cache[2]) if n in set(spine_names)], dtype=int)
donor_front_verts = np.array([i for i, n in enumerate(source_cache[2]) if n in {'Spine3', 'Spine4'}], dtype=int)
donor_rear_verts = np.array([i for i, n in enumerate(source_cache[2]) if n in {'Hips', 'Spine', 'Spine1'}], dtype=int)
donor_head_drivers = {'Head'} | {b.name for b in donor.data.bones['Head'].children_recursive}
donor_head_verts = np.array([i for i, n in enumerate(source_cache[2]) if n in donor_head_drivers], dtype=int)
ulotte_front_verts = np.array([i for i, n in enumerate(target_cache[2]) if n in {'Spine3', 'Spine4'}], dtype=int)
ulotte_rear_verts = np.array([i for i, n in enumerate(target_cache[2]) if n in {'Hips', 'Spine', 'Spine1'}], dtype=int)

donor_clearance = float(base_skin[donor_trunk_verts, 2].min())
ulotte_clearance = float(target_cache[0][ulotte_trunk_verts, 2].min())
clearance_ratio = ulotte_clearance / donor_clearance

donor_front_clear_rest = float(base_skin[donor_front_verts, 2].min())
donor_rear_clear_rest = float(base_skin[donor_rear_verts, 2].min())
ulotte_front_clear_rest = float(target_cache[0][ulotte_front_verts, 2].min())
ulotte_rear_clear_rest = float(target_cache[0][ulotte_rear_verts, 2].min())
ulotte_chest_depth = rest['Spine4'].translation.z - ulotte_front_clear_rest
ulotte_pelvis_depth = rest['Hips'].translation.z - ulotte_rear_clear_rest
front_clear_ratio = ulotte_front_clear_rest / max(1e-6, donor_front_clear_rest)
rear_clear_ratio = ulotte_rear_clear_rest / max(1e-6, donor_rear_clear_rest)
print(f'CLEARANCE pitbull=({donor_front_clear_rest:.3f},{donor_rear_clear_rest:.3f}) ulotte=({ulotte_front_clear_rest:.3f},{ulotte_rear_clear_rest:.3f}) depths=({ulotte_chest_depth:.3f},{ulotte_pelvis_depth:.3f})', flush=True)

# Head/neck surface (for local cervical clearance without lifting feet!)
head_drivers = {'Neck01', 'Neck02', 'Neck03', 'Head'} | {b.name for b in arm.bones['Head'].children_recursive}
head_surface = np.array([i for i, n in enumerate(target_cache[2]) if n in head_drivers], dtype=int)
fast_head_surface = np.array([i for i, n in enumerate(fast_cache[2]) if n in head_drivers], dtype=int)
body_height = float(target_cache[0][:, 2].max() - target_cache[0][:, 2].min())
# Half of 0.01 cm at 30 cm display height -> tight margin for interpolation
skin_tol = body_height * (0.01 / 30.0) / 2.0
geom_tol = body_height * 1e-5

# Configure the 4 anatomical 2-bone IK chains matching Pitbull 1-to-1:
#   Front: Shoulder01 (shoulder) -> Arm (elbow) -> ForeArm (wrist) -> Hand (paw)
#   Rear:  Pelvis (hip) -> UpLeg (knee) -> Leg (hock) -> Foot (paw)
limbs = []
for side in ['Left', 'Right']:
    for front, (un, ln, en, paw) in [
        (True,  (side + 'Shoulder01', side + 'Arm', side + 'ForeArm', side + 'Hand')),
        (False, (side + 'Pelvis', side + 'UpLeg', side + 'Leg', side + 'Foot')),
    ]:
        a = (rest[ln].translation - rest[un].translation).length
        b = (rest[en].translation - rest[ln].translation).length
        da = (base_world[ln].translation - base_world[un].translation).length
        db = (base_world[en].translation - base_world[ln].translation).length
        ratio = (a + b) / (da + db)
        z_span = abs(rest[un].translation.z - rest[en].translation.z)
        dz_span = abs(base_world[un].translation.z - base_world[en].translation.z)
        z_ratio = z_span / dz_span
        parent_body = 'Spine4' if front else 'Hips'
        # Pure anatomical rest-world sagittal bend pole (+Y backward for elbows, -Y forward for knees).
        rest_pole_world = Vector((0.0, 1.0 if front else -1.0, 0.0))

        # Sole vertices (distal from wrist/hock so paw pads & toes define contact)
        distal_donor = {en} | {bn.name for bn in donor.data.bones[en].children_recursive}
        distal_ulotte = {en} | {bn.name for bn in arm.bones[en].children_recursive}
        src_sole = np.array([i for i, n in enumerate(source_cache[2]) if n in distal_donor], dtype=int)
        tgt_sole = np.array([i for i, n in enumerate(target_cache[2]) if n in distal_ulotte], dtype=int)
        fast_sole = np.array([i for i, n in enumerate(fast_cache[2]) if n in distal_ulotte], dtype=int)
        # Paw-only vertices (Hand/HandMiddle1 or Foot/ToeBase) for foot clearance audit
        paw_ulotte = {paw} | {bn.name for bn in arm.bones[paw].children_recursive}
        tgt_paw = np.array([i for i, n in enumerate(target_cache[2]) if n in paw_ulotte], dtype=int)
        if not len(src_sole) or not len(tgt_sole) or not len(tgt_paw) or not len(fast_sole):
            raise RuntimeError('Empty sole surface for ' + en)
        limbs.append(dict(
            side=side, front=front, upper=un, lower=ln, end=en, paw=paw,
            lengths=(a, b), ratio=ratio, z_ratio=z_ratio,
            body_parent=parent_body, rest_pole_world=rest_pole_world,
            source_sole=src_sole, target_sole=tgt_sole, fast_sole=fast_sole, target_paw=tgt_paw,
            contact_height=float(base_skin[src_sole, 2].min()),
        ))

mean_limb_ratio = sum(l['ratio'] for l in limbs) / len(limbs)
pelvis_width_ratio = (rest['LeftPelvis'].translation - rest['RightPelvis'].translation).length / (base_world['LeftPelvis'].translation - base_world['RightPelvis'].translation).length
ulotte_spine_vec = rest['Spine4'].translation - rest['Hips'].translation
donor_base_spine_vec = base_world['Spine4'].translation - base_world['Hips'].translation
torso_len = ulotte_spine_vec.length
torso_length_ratio = torso_len / donor_base_spine_vec.length
# Scale per-vertebra spine bending inversely with dachshund torso elongation so
# a 1.94x longer spine achieves the same proportional vertical arch instead of a rainbow.
spine_bend_scale = min(0.55, max(0.25, clearance_ratio / torso_length_ratio))
print(f'RATIOS width={pelvis_width_ratio:.3f} limb={mean_limb_ratio:.3f} clearance={clearance_ratio:.3f} torso_len={torso_len:.3f} spine_bend={spine_bend_scale:.3f}', flush=True)

def fk_from_rotations(rotations, hip_pos):
    world = {}
    for bone in arm.bones:
        n = bone.name
        if bone.parent:
            pt = world[bone.parent.name] @ rest_offsets[n]
        else:
            pt = hip_pos.copy()
        m = rotations[n].to_matrix().to_4x4()
        m.translation = pt
        world[n] = m
    return world

def limb_pole(limb, world, axis, source_upper):
    """C1-smooth, globally singularity-free anatomical bend pole.

    Smoothly converges to the anatomical sagittal pole anat_perp whenever the
    limb approaches full extension (src_sin -> 0) or donor hyperextension
    (dot(cand, anat_perp) <= 0), eliminating all backward bends and 180° flips.
    """
    body_rot = world[limb['body_parent']].to_quaternion() @ rest[limb['body_parent']].to_quaternion().inverted()
    anat_pole = body_rot @ limb['rest_pole_world']
    anat_perp = anat_pole - axis * anat_pole.dot(axis)
    if anat_perp.length > 1e-6:
        anat_perp.normalize()
    src_perp = source_upper - axis * source_upper.dot(axis)
    src_sin = src_perp.length / max(1e-9, source_upper.length)
    if src_sin > 1e-4 and anat_perp.length > 1e-6:
        cand = src_perp.normalized()
        d = cand.dot(anat_perp)
        w = smoothstep(0.05, 0.30, src_sin) * smoothstep(-0.15, 0.45, d)
        blended = cand * w + anat_perp * (1.0 - w)
        if blended.length > 1e-6:
            return blended.normalized()
    if anat_perp.length > 1e-6:
        return anat_perp
    if src_perp.length > 1e-9:
        return src_perp.normalized()
    raise RuntimeError('Undefined limb bend plane: ' + limb['lower'])

distal_foot_bones = {
    side + part
    for side in ('Left', 'Right')
    for part in ('ForeArm', 'Hand', 'HandMiddle1', 'Leg', 'Foot', 'ToeBase')
}

def build_initial_pose(source_world, is_gait_cycle, source_skin=None):
    """Construct Ulotte's proportion-adapted FK + analytic limb reach pose from donor world matrices.

    Returns (fk, front_lying_blend, rear_lying_blend).
    """
    # 1. Compute damped relative vertebral rotations FIRST so we know the EXACT curved
    #    spine chord vector (Hips -> Spine4) before solving spine_pitch_corr. Otherwise,
    #    cumulative vertebral bends along Ulotte's 0.80 m back overshoot Spine4.z by 5-8 cm.
    spine_children = set(spine_names[1:])
    damped_spine_rel = {}
    for n in spine_names[1:]:
        p = arm.bones[n].parent.name
        wd = source_world[n].to_quaternion() @ base_world[n].to_quaternion().inverted()
        d_parent_wd = source_world[p].to_quaternion() @ base_world[p].to_quaternion().inverted()
        rel_world = d_parent_wd.inverted() @ wd
        if rel_world.w < 0.0:
            rel_world.negate()
        eul = rel_world.to_euler('XYZ')
        damped_eul = eul.copy()
        damped_eul.x *= spine_bend_scale
        damped_eul.y *= spine_bend_scale
        damped_eul.z *= 0.65
        damped_rel = damped_eul.to_quaternion()
        damped_spine_rel[n] = (rest[p].to_quaternion().inverted() @ (damped_rel @ rest[p].to_quaternion())) @ rest_local[n].to_quaternion()

    # Evaluate the exact curved spine chord in Hips rest-aligned space
    cur_pos = Vector((0.0, 0.0, 0.0))
    cur_q = rest['Hips'].to_quaternion()
    for n in spine_names[1:]:
        cur_pos = cur_pos + (cur_q @ rest_offsets[n])
        cur_q = cur_q @ damped_spine_rel[n]
    curved_spine = cur_pos
    curved_len = curved_spine.length

    # 2. Target front (brisket) and rear (pelvis/belly) ground heights independently
    donor_spine = source_world['Spine4'].translation - source_world['Hips'].translation
    front_lying = 0.0
    rear_lying = 0.0
    head_rest_blend = 0.0
    if source_skin is not None and not is_gait_cycle:
        d_front_c = max(0.0, float(source_skin[donor_front_verts, 2].min()))
        d_rear_c = max(0.0, float(source_skin[donor_rear_verts, 2].min()))
        d_head_c = max(0.0, float(source_skin[donor_head_verts, 2].min()))
        front_lying = 1.0 - smoothstep(0.02, 0.14, d_front_c)
        rear_lying = 1.0 - smoothstep(0.02, 0.14, d_rear_c)
        head_rest_blend = (1.0 - smoothstep(0.01, 0.10, d_head_c)) * front_lying
        u_spine4_z = ulotte_chest_depth + d_front_c * front_clear_ratio
        u_hips_z = ulotte_pelvis_depth + d_rear_c * rear_clear_ratio
        desired_rise = u_spine4_z - u_hips_z
    else:
        desired_rise = ulotte_spine_vec.z + (donor_spine.z - donor_base_spine_vec.z) * clearance_ratio
        u_hips_z = None

    desired_rise = max(-0.85 * curved_len, min(0.85 * curved_len, desired_rise))
    horiz_xy = Vector((donor_spine.x, donor_spine.y, 0.0))
    if horiz_xy.length < 1e-6:
        horiz_xy = Vector((0.0, -1.0, 0.0))
    else:
        horiz_xy.normalize()
    desired_spine = horiz_xy * math.sqrt(max(0.0, curved_len * curved_len - desired_rise * desired_rise)) + Vector((0.0, 0.0, desired_rise))
    hip_delta_q = source_world['Hips'].to_quaternion() @ base_world['Hips'].to_quaternion().inverted()
    pitched_spine = hip_delta_q @ curved_spine
    spine_pitch_corr = pitched_spine.rotation_difference(desired_spine)

    # 3. Compute global bone orientations cleanly
    rotations = {}
    lying_max = max(front_lying, rear_lying)
    for bone in arm.bones:
        n = bone.name
        if n == 'Muzzle':
            rotations[n] = rotations['Head'] @ (rest['Head'].to_quaternion().inverted() @ rest['Muzzle'].to_quaternion())
            continue
        wd = source_world[n].to_quaternion() @ base_world[n].to_quaternion().inverted()
        if n == 'Hips':
            q_hips = spine_pitch_corr @ wd @ rest[n].to_quaternion()
            # Wide-pelvis dachshunds resting on a flat floor cannot roll 58° sideways
            # without jamming one thigh underground and lifting the belly +12 cm up.
            # Gently damp roll around the spine chord when lying, preserving full yaw & pitch.
            if lying_max > 0.0:
                s_dir = desired_spine.normalized()
                cur_up = (q_hips @ rest[n].to_quaternion().inverted()) @ Vector((0.0, 0.0, 1.0))
                up_perp = cur_up - s_dir * cur_up.dot(s_dir)
                ref_up = Vector((0.0, 0.0, 1.0)) - s_dir * s_dir.z
                if up_perp.length > 1e-5 and ref_up.length > 1e-5:
                    unroll_q = up_perp.normalized().rotation_difference(ref_up.normalized())
                    q_hips = Quaternion().slerp(unroll_q, 0.65 * lying_max) @ q_hips
            rotations[n] = q_hips
        elif n in spine_children:
            rotations[n] = rotations[bone.parent.name] @ damped_spine_rel[n]
        elif n in ('LeftShoulder', 'RightShoulder'):
            # Keep scapular glide subtle (~25% of Pitbull's large scapula swing) so the
            # barrel-chested dachshund ribcage never develops a 55° horizontal shear crease.
            parent_q = rotations['Spine4']
            local_rest_q = rest_local[n].to_quaternion()
            donor_rel = source_world['Spine4'].to_quaternion().inverted() @ source_world[n].to_quaternion()
            base_rel = base_world['Spine4'].to_quaternion().inverted() @ base_world[n].to_quaternion()
            rel_delta = base_rel.inverted() @ donor_rel
            damped = Quaternion().slerp(rel_delta, 0.25)
            rotations[n] = parent_q @ local_rest_q @ damped
        elif n.startswith('Tail'):
            idx = int(n[-2:])
            parent_q = rotations[bone.parent.name]
            local_rest_q = rest_local[n].to_quaternion()
            if idx == 1:
                rotations[n] = spine_pitch_corr @ wd @ rest[n].to_quaternion()
            else:
                donor_rel = source_world[bone.parent.name].to_quaternion().inverted() @ source_world[n].to_quaternion()
                base_rel = base_world[bone.parent.name].to_quaternion().inverted() @ base_world[n].to_quaternion()
                rel_delta = base_rel.inverted() @ donor_rel
                damped = Quaternion().slerp(rel_delta, 0.45)
                rotations[n] = parent_q @ local_rest_q @ damped
        elif n.startswith(('LeftEar', 'RightEar')):
            parent_q = rotations[bone.parent.name]
            local_rest_q = rest_local[n].to_quaternion()
            donor_rel = source_world[bone.parent.name].to_quaternion().inverted() @ source_world[n].to_quaternion()
            base_rel = base_world[bone.parent.name].to_quaternion().inverted() @ base_world[n].to_quaternion()
            rel_delta = base_rel.inverted() @ donor_rel
            damped = Quaternion().slerp(rel_delta, 0.35)
            rotations[n] = parent_q @ local_rest_q @ damped
        elif n in ('Neck01', 'Neck02', 'Neck03', 'Head'):
            # Apply ONLY horizontal yaw difference between Ulotte's Spine4 and donor's Spine4.
            u_ref_wd = rotations['Spine4'] @ rest['Spine4'].to_quaternion().inverted()
            d_ref_wd = source_world['Spine4'].to_quaternion() @ base_world['Spine4'].to_quaternion().inverted()
            fc = u_ref_wd @ d_ref_wd.inverted()
            yaw_only = Quaternion((0.0, 0.0, 1.0), fc.to_euler('XYZ').z)
            q_neck = yaw_only @ wd @ rest[n].to_quaternion()
            # When lying AND Pitbull rests its head on the floor (sleep), smoothly pitch
            # Ulotte's taller rest neck down so her chin rests gently on the floor too.
            if head_rest_blend > 0.0:
                body_right = u_ref_wd @ Vector((1.0, 0.0, 0.0))
                body_right.z = 0.0
                if body_right.length > 1e-6:
                    body_right.normalize()
                    # Pitch forward-down around body right (+X -> -Y goes toward -Z for positive angle)
                    pitch_ang = (0.42 if n != 'Head' else 0.25) * head_rest_blend
                    q_neck = Quaternion(body_right, pitch_ang) @ q_neck
            rotations[n] = q_neck
        elif n in distal_foot_bones:
            # Distal paws/metatarsals (ForeArm..HandMiddle1, Leg..ToeBase) align with the GROUND
            # plane in world space — apply ONLY horizontal yaw correction, NEVER vertical pitch/roll
            # frame_corr (which previously tilted lying metatarsals straight down into the floor!).
            is_rear = any(n.startswith(s + p) for s in ('Left', 'Right') for p in ('Leg', 'Foot', 'ToeBase'))
            ref = 'Hips' if is_rear else 'Spine4'
            u_ref_wd = rotations[ref] @ rest[ref].to_quaternion().inverted()
            d_ref_wd = source_world[ref].to_quaternion() @ base_world[ref].to_quaternion().inverted()
            fc = u_ref_wd @ d_ref_wd.inverted()
            yaw_only = Quaternion((0.0, 0.0, 1.0), fc.to_euler('XYZ').z)
            rotations[n] = yaw_only @ wd @ rest[n].to_quaternion()
        else:
            is_rear = any(n.startswith(s + p) for s in ('Left', 'Right') for p in ('Pelvis', 'UpLeg'))
            ref = 'Hips' if is_rear else 'Spine4'
            u_ref_wd = rotations[ref] @ rest[ref].to_quaternion().inverted()
            d_ref_wd = source_world[ref].to_quaternion() @ base_world[ref].to_quaternion().inverted()
            frame_corr = u_ref_wd @ d_ref_wd.inverted()
            rotations[n] = frame_corr @ wd @ rest[n].to_quaternion()

    # 4. Root Hips position scaled by dachshund proportions
    hip_delta = source_world['Hips'].translation - base_world['Hips'].translation
    if is_gait_cycle:
        hip_pos = rest['Hips'].translation + Vector((0.0, 0.0, hip_delta.z * clearance_ratio))
    else:
        hip_z = u_hips_z if u_hips_z is not None else (rest['Hips'].translation.z + hip_delta.z * clearance_ratio)
        hip_pos = Vector((
            rest['Hips'].translation.x + hip_delta.x * pelvis_width_ratio,
            rest['Hips'].translation.y + hip_delta.y * mean_limb_ratio,
            hip_z,
        ))
    fk = fk_from_rotations(rotations, hip_pos)

    # 5. Analytic 2-bone limb reach
    yaw_corrs = {}
    frame_corrs = {}
    for ref in ('Spine4', 'Hips'):
        u_ref_wd = fk[ref].to_quaternion() @ rest[ref].to_quaternion().inverted()
        d_ref_wd = source_world[ref].to_quaternion() @ base_world[ref].to_quaternion().inverted()
        fc = u_ref_wd @ d_ref_wd.inverted()
        frame_corrs[ref] = fc
        yaw_corrs[ref] = Quaternion((0.0, 0.0, 1.0), fc.to_euler('XYZ').z)

    body_fwd = (fk['Spine4'].to_quaternion() @ rest['Spine4'].to_quaternion().inverted()) @ Vector((0.0, -1.0, 0.0))
    body_fwd.z = 0.0
    if body_fwd.length > 1e-6:
        body_fwd.normalize()
    else:
        body_fwd = Vector((0.0, -1.0, 0.0))
    body_right = Vector((0.0, 0.0, 1.0)).cross(body_fwd)
    if body_right.length > 1e-6:
        body_right.normalize()
    else:
        body_right = Vector((1.0, 0.0, 0.0))

    for limb in limbs:
        un, ln, en = limb['upper'], limb['lower'], limb['end']
        start = fk[un].translation
        a, b = limb['lengths']
        # Use yaw-only transform when lying so donor ground-level limb reach isn't tilted
        # downward into the floor by body pitch differences; use full body frame when standing.
        lie_l = front_lying if limb['front'] else rear_lying
        fc = frame_corrs[limb['body_parent']].slerp(yaw_corrs[limb['body_parent']], lie_l)
        donor_reach = fc @ (source_world[en].translation - source_world[un].translation)
        if donor_reach.length < 1e-9:
            raise RuntimeError('Zero donor limb reach: ' + en)
        # Preserve full upward lift angle for elevated limbs (e.g. pee 43) instead of
        # compressing positive Z by standing z_ratio.
        up_t = smoothstep(0.0, 0.08, donor_reach.z)
        z_scale = limb['z_ratio'] * (1.0 - up_t) + limb['ratio'] * up_t
        scaled_reach = Vector((
            donor_reach.x * limb['ratio'],
            donor_reach.y * limb['ratio'],
            donor_reach.z * z_scale,
        ))
        side_sign = 1.0 if limb['side'] == 'Left' else -1.0
        if limb['front'] and front_lying > 0.0:
            scaled_reach += body_fwd * (0.105 * front_lying) + body_right * (0.025 * side_sign * front_lying)
        min_d = abs(a - b) + 1e-4
        max_d = a + b - 1e-4
        dist = min(max_d, max(min_d, scaled_reach.length))
        axis = scaled_reach.normalized()
        along = (a * a - b * b + dist * dist) / (2.0 * dist)
        source_upper = fc @ (source_world[ln].translation - source_world[un].translation)
        pole = limb_pole(limb, fk, axis, source_upper)
        joint = start + axis * along + pole * math.sqrt(max(0.0, a * a - along * along))
        end_pos = start + axis * dist
        old_u = fk[ln].translation - start
        old_l = fk[en].translation - fk[ln].translation
        rotations[un] = old_u.rotation_difference(joint - start) @ fk[un].to_quaternion()
        rotations[ln] = old_l.rotation_difference(end_pos - joint) @ fk[ln].to_quaternion()
    return fk_from_rotations(rotations, hip_pos), front_lying, rear_lying

def clear_head_contact(world, skin, tol, cache=None, h_surf=None):
    """Lift muzzle/head locally via Neck01..Neck03 IK without lifting the pelvis or feet."""
    if cache is None: cache = fast_cache
    if h_surf is None: h_surf = fast_head_surface
    minimum = float(skin[h_surf, 2].min())
    if minimum >= -tol:
        return world, skin, 0.0
    baseline = world
    start = baseline['Neck01'].translation
    joint0 = baseline['Neck02'].translation
    head0 = baseline['Head'].translation
    a = (joint0 - start).length
    b = (head0 - joint0).length
    horiz2 = (head0.x - start.x) ** 2 + (head0.y - start.y) ** 2
    outer = math.sqrt(max(0.0, (a + b) ** 2 - horiz2))
    inner = math.sqrt(max(0.0, (a - b) ** 2 - horiz2))
    upper = start.z - inner if inner > 0 and head0.z < start.z else start.z + outer
    rotations = {n: m.to_quaternion() for n, m in baseline.items()}
    hip_pos = baseline['Hips'].translation.copy()
    requested = 0.0
    actual = 0.0
    prev_err = math.inf
    best = (world, skin, 0.0)
    while minimum < -tol:
        requested -= minimum
        end = head0.copy()
        end.z = min(head0.z + requested, upper)
        lift = end.z - head0.z
        if lift <= actual + 1e-8:
            nose = world['Muzzle'].translation
            pivot = world['Head'].translation
            fwd = nose - pivot
            h_vec = Vector((fwd.x, fwd.y, 0.0))
            if h_vec.length > 1e-5:
                ang = min(0.65, math.atan2(-minimum, h_vec.length))
                pitch_axis = h_vec.cross(Vector((0.0, 0.0, 1.0))).normalized()
                dq = Quaternion(pitch_axis, ang)
                for n in ('Head', 'Muzzle', 'LeftEar', 'LeftEar2', 'LeftEar3', 'RightEar', 'RightEar2', 'RightEar3'):
                    rotations[n] = dq @ rotations[n]
                world = fk_from_rotations(rotations, hip_pos)
                skin = eval_skin(cache, world)
                new_min = float(skin[h_surf, 2].min())
                if new_min > minimum + 1e-7:
                    minimum = new_min
                    best = (world, skin, actual + lift)
                    continue
            return best
        reach = end - start
        dist = reach.length
        axis = reach.normalized()
        along = (a * a - b * b + dist * dist) / (2.0 * dist)
        pole = joint0 - start - axis * (joint0 - start).dot(axis)
        if pole.length < 1e-6:
            body_rot = baseline['Spine4'].to_quaternion() @ rest['Spine4'].to_quaternion().inverted()
            pole = axis.cross(body_rot @ Vector((1.0, 0.0, 0.0)))
        if pole.length < 1e-6:
            return best
        joint = start + axis * along + pole.normalized() * math.sqrt(max(0.0, a * a - along * along))
        rotations['Neck01'] = (joint0 - start).rotation_difference(joint - start) @ baseline['Neck01'].to_quaternion()
        distal_q = (head0 - joint0).rotation_difference(end - joint)
        for n in ('Neck02', 'Neck03'):
            rotations[n] = distal_q @ baseline[n].to_quaternion()
        world = fk_from_rotations(rotations, hip_pos)
        skin = eval_skin(cache, world)
        minimum = float(skin[h_surf, 2].min())
        actual = lift
        if -minimum >= prev_err - 1e-8:
            return best
        prev_err = -minimum
        best = (world, skin, actual)
    return world, skin, actual

def ground_limbs(fk, goals, allow_reversed_height=True, front_lying=0.0, rear_lying=0.0):
    """Fixed-length analytic IK with shared pelvis height + local cervical clearance.

    When lying down (front_lying / rear_lying > 0), anchors Hips near the target ground-resting
    height so folded limbs rest beside/in front of the body rather than lifting the belly back up.
    """
    fk_skin = eval_skin(fast_cache, fk)
    ends = {
        l['end']: fk[l['end']].translation + Vector((0.0, 0.0, goals[l['end']] - float(fk_skin[l['fast_sole'], 2].min())))
        for l in limbs
    }
    rotations = {n: m.to_quaternion() for n, m in fk.items()}
    base_hip = fk['Hips'].translation.copy()
    body_fwd = (fk['Spine4'].to_quaternion() @ rest['Spine4'].to_quaternion().inverted()) @ Vector((0.0, -1.0, 0.0))
    body_fwd.z = 0.0
    if body_fwd.length > 1e-6:
        body_fwd.normalize()
    else:
        body_fwd = Vector((0.0, -1.0, 0.0))
    lying_max = max(front_lying, rear_lying)
    # Keep torso anchored to its proportional clearance height: gentle anchor when
    # standing/sniffing (preventing elbows collapsing to the floor in walk_fwd_sniff)
    # and strong anchor when lying/squatting so folded limbs rest beside the torso.
    anchor_w = (4.5 if allow_reversed_height else 0.0) + 16.0 * lying_max
    front_slides = {'Left': 0.0, 'Right': 0.0}
    minimum_shift = -math.inf
    prev_error = math.inf
    best_feasible = None

    for _iter in range(36):
        intervals = [(minimum_shift, math.inf)]
        terms = []
        for l in limbs:
            start = fk[l['upper']].translation
            end = ends[l['end']]
            a, b = l['lengths']
            horiz2 = (end.x - start.x) ** 2 + (end.y - start.y) ** 2
            dz = end.z - start.z
            bound_start = start
            lengths = [a, b]
            if l['front']:
                bound_start = fk[l['side'] + 'Shoulder'].translation
                lengths.append((start - bound_start).length)
            b_horiz2 = (end.x - bound_start.x) ** 2 + (end.y - bound_start.y) ** 2
            inner_l = max(0.0, 2.0 * max(lengths) - sum(lengths))
            outer_l = sum(lengths)
            if b_horiz2 > outer_l ** 2:
                scale = (outer_l - 1e-4) / math.sqrt(b_horiz2)
                end = Vector((
                    bound_start.x + (end.x - bound_start.x) * scale,
                    bound_start.y + (end.y - bound_start.y) * scale,
                    end.z,
                ))
                ends[l['end']] = end
                horiz2 = (end.x - start.x) ** 2 + (end.y - start.y) ** 2
                b_horiz2 = (end.x - bound_start.x) ** 2 + (end.y - bound_start.y) ** 2
            b_dz = end.z - bound_start.z
            inner = math.sqrt(max(0.0, inner_l ** 2 - b_horiz2))
            outer = math.sqrt(max(0.0, outer_l ** 2 - b_horiz2))
            if allow_reversed_height:
                allowed = [(b_dz - outer, b_dz - inner), (b_dz + inner, b_dz + outer)] if inner > 0 else [(b_dz - outer, b_dz + outer)]
            else:
                allowed = [(b_dz + inner, b_dz + outer)]
            intervals = [(max(lo, c), min(hi, d)) for lo, hi in intervals for c, d in allowed if max(lo, c) <= min(hi, d) + geom_tol]
            dist0 = (fk[l['end']].translation - start).length
            terms.append((1.0 / (2.0 * a * b), dz, dz * dz + horiz2 - dist0 * dist0))

        if not intervals:
            shift = minimum_shift if math.isfinite(minimum_shift) else 0.0
        else:
            coeffs = [
                sum(k * k for k, d, c in terms),
                -3.0 * sum(k * k * d for k, d, c in terms),
                sum(k * k * (2.0 * d * d + c) for k, d, c in terms) + 0.5 * anchor_w * anchor_w,
                -sum(k * k * d * c for k, d, c in terms),
            ]
            cands = [v for iv in intervals for v in iv]
            cands.extend(
                float(r.real) for r in np.roots(coeffs)
                if abs(r.imag) < 1e-9 and any(lo <= r.real <= hi for lo, hi in intervals)
            )
            shift = min(cands, key=lambda z: sum((k * (z * z - 2.0 * d * z + c)) ** 2 for k, d, c in terms) + (anchor_w * z) ** 2)

        hip_pos = base_hip + Vector((0.0, 0.0, shift))
        for n, m in fk.items():
            rotations[n] = m.to_quaternion()

        for l in limbs:
            un, ln, en = l['upper'], l['lower'], l['end']
            start = fk[un].translation + Vector((0.0, 0.0, shift))
            end = ends[en].copy()
            a, b = l['lengths']
            if l['front']:
                scapula = l['side'] + 'Shoulder'
                shoulder = fk[scapula].translation + Vector((0.0, 0.0, shift))
                orig = start - shoulder
                sl = orig.length
                reach = end - shoulder
                dist = reach.length
                if dist > a + b + sl - 1e-4:
                    end = shoulder + reach.normalized() * (a + b + sl - 1e-4)
                    reach = end - shoulder
                    dist = reach.length
                axis_s = reach.normalized()
                lo = max(abs(a - b) + 1e-4, abs(dist - sl))
                hi = min(a + b - 1e-4, dist + sl)
                cur_d = (end - start).length
                if lo <= cur_d <= hi:
                    rotations[scapula] = fk[scapula].to_quaternion()
                elif lo <= hi + geom_tol:
                    rad = min(hi, max(lo, cur_d))
                    along_s = (sl * sl + dist * dist - rad * rad) / (2.0 * dist)
                    pole_s = orig - axis_s * orig.dot(axis_s)
                    if pole_s.length > 1e-6:
                        start = shoulder + axis_s * along_s + pole_s.normalized() * math.sqrt(max(0.0, sl * sl - along_s * along_s))
                        rotations[scapula] = orig.rotation_difference(start - shoulder) @ fk[scapula].to_quaternion()

            vec = end - start
            dist = vec.length
            if dist < 1e-6:
                continue
            min_d = abs(a - b) + 1e-4
            max_d = a + b - 1e-4
            if dist > max_d:
                end = start + vec.normalized() * max_d
                dist = max_d
            elif dist < min_d:
                end = start + vec.normalized() * min_d
                dist = min_d
            axis = (end - start).normalized()
            along = (a * a - b * b + dist * dist) / (2.0 * dist)
            old_u = fk[ln].translation - fk[un].translation
            old_l = fk[en].translation - fk[ln].translation
            direction = limb_pole(l, fk, axis, old_u)
            joint = start + axis * along + direction * math.sqrt(max(0.0, a * a - along * along))
            rotations[un] = old_u.rotation_difference(joint - start) @ fk[un].to_quaternion()
            rotations[ln] = old_l.rotation_difference(end - joint) @ fk[ln].to_quaternion()

        solved = fk_from_rotations(rotations, hip_pos)
        skin = eval_skin(fast_cache, solved)
        solved, skin, head_lift = clear_head_contact(solved, skin, skin_tol, fast_cache, fast_head_surface)

        errors = {l['end']: goals[l['end']] - float(skin[l['fast_sole'], 2].min()) for l in limbs}
        error = max(abs(v) for v in errors.values())
        minimum = float(skin[:, 2].min())

        if minimum < -skin_tol:
            idx = int(np.argmin(skin[:, 2]))
            driver = fast_cache[2][idx]
            paw_limb = next((l for l in limbs if driver in {l['end'], l['paw'], l['side'] + ('HandMiddle1' if l['front'] else 'ToeBase')}), None)
            elbow_limb = next((l for l in limbs if l['front'] and driver in {l['upper'], l['lower']}), None)
            if paw_limb:
                ends[paw_limb['end']].z -= minimum
            elif elbow_limb and front_lying > 0.2 and front_slides[elbow_limb['side']] < 0.07:
                step = min(0.07 - front_slides[elbow_limb['side']], max(0.015, -minimum * 1.5))
                front_slides[elbow_limb['side']] += step
                ends[elbow_limb['end']] = ends[elbow_limb['end']] + body_fwd * step
            else:
                minimum_shift = max(minimum_shift, shift - minimum)
                for name, res in errors.items():
                    if res > 0:
                        ends[name].z += res
            prev_error = math.inf
            continue

        supported = not any(val == 0.0 for val in goals.values()) or minimum <= skin_tol * 4.0
        if supported and (best_feasible is None or error < best_feasible[1]):
            best_feasible = (solved, error)
        if error <= skin_tol:
            break
        if error >= prev_error - 1e-7:
            if best_feasible is not None:
                solved = best_feasible[0]
            break
        prev_error = error
        for name, res in errors.items():
            ends[name].z += res

    if best_feasible is not None and error > skin_tol:
        solved = best_feasible[0]

    # Exact full-mesh (71k vertices) verification & local polish
    full_skin = eval_skin(target_cache, solved)
    solved, full_skin, _ = clear_head_contact(solved, full_skin, skin_tol, target_cache, head_surface)
    min_z = float(full_skin[:, 2].min())
    if min_z < -skin_tol:
        hip_pos = solved['Hips'].translation + Vector((0.0, 0.0, -min_z))
        solved = fk_from_rotations({n: m.to_quaternion() for n, m in solved.items()}, hip_pos)
    return solved

def compute_swing_clearances(rows):
    """Smooth target-native swing arc with exact zero during donor stance phases."""
    count = len(rows) - 1
    if count <= 0:
        return [{l['end']: 0.0 for l in limbs} for _ in rows]
    step = (rows[-1]['frame'] - rows[0]['frame']) / count
    out = [{} for _ in rows]
    for l in limbs:
        name = l['end']
        src = np.array([r['source'][name] for r in rows[:-1]])
        hts = np.array([r['fk'][name] for r in rows[:-1]])
        contact = src <= 1e-4
        if not np.any(contact):
            for i in range(len(rows)):
                out[i][name] = max(0.0, float(rows[i]['source'][name]) * l['z_ratio'])
            continue
        for i in range(count):
            if contact[i]:
                out[i][name] = 0.0
                continue
            prev_i = i - 1
            while not contact[prev_i % count]:
                prev_i -= 1
            next_i = i + 1
            while not contact[next_i % count]:
                next_i += 1
            def cross(left):
                a, b = left % count, (left + 1) % count
                denom = src[b] - src[a]
                frac = 0.0 if abs(denom) < 1e-9 else -src[a] / denom
                return (left + frac) * step, hts[a] + frac * (hts[b] - hts[a])
            t0, z0 = cross(prev_i)
            t1, z1 = cross(next_i - 1)
            t = (i * step - t0) / max(1e-9, t1 - t0)
            blend = t * t * (3.0 - 2.0 * t)
            out[i][name] = max(0.0, float(hts[i] - (z0 + (z1 - z0) * blend)))
        out[-1][name] = out[0][name]
    return out

# 5. Bake all requested clips cleanly
GAIT_CLIPS = set(BASE_CLIPS + ['walk_fwd_sniff 46'])
new_actions = []
for clip_name in CLIPS:
    src_action = bpy.data.actions[clip_name]
    donor.animation_data.action = src_action
    donor.animation_data.action_slot = src_action.slots[0]
    start, end = src_action.frame_range
    if end == start:
        frames = [float(start)]
    elif clip_name in PRIORITY_CLIPS:
        freq = args.sample_fps if clip_name in HIGH_RATE else min(60, args.sample_fps)
        count = max(1, round((end - start) / scene.render.fps * freq))
        frames = [float(start + (end - start) * i / count) for i in range(count + 1)]
    else:
        frames = sorted({float(start), float(end)} | {float(f) for f in range(math.ceil(start), math.floor(end) + 1)})

    samples = []
    for frame in frames:
        scene.frame_set(int(frame), subframe=frame % 1)
        bpy.context.view_layer.update()
        sw = {pb.name: (donor.matrix_world @ pb.matrix).copy() for pb in donor.pose.bones}
        samples.append((frame - start, sw))

    is_gait = clip_name in BASE_CLIPS
    src_skins = [eval_skin(source_cache, sw) for _, sw in samples]
    if clip_name in GAIT_CLIPS and len(samples) > 1:
        rows = []
        for (f_rel, sw), src_skin in zip(samples, src_skins):
            fk, _, _ = build_initial_pose(sw, is_gait_cycle=is_gait, source_skin=src_skin)
            fk_skin = eval_skin(fast_cache, fk)
            rows.append(dict(
                frame=f_rel,
                fk={l['end']: float(fk_skin[l['fast_sole'], 2].min()) for l in limbs},
                source={l['end']: float(src_skin[l['source_sole'], 2].min()) - l['contact_height'] for l in limbs},
            ))
        clearances = compute_swing_clearances(rows)
    else:
        clearances = None

    action = bpy.data.actions.new('Rebuilt|' + clip_name)
    rig.animation_data_create()
    rig.animation_data.action = action
    prev_quats = {}
    for s_idx, (f_rel, sw) in enumerate(samples):
        src_skin = src_skins[s_idx]
        fk, front_lying, rear_lying = build_initial_pose(sw, is_gait_cycle=is_gait, source_skin=src_skin)
        if clearances is not None:
            goals = clearances[s_idx]
        else:
            fk_skin_init = eval_skin(fast_cache, fk)
            goals = {}
            for l in limbs:
                src_clear = max(0.0, float(src_skin[l['source_sole'], 2].min()) - l['contact_height'])
                scaled_g = src_clear * l['z_ratio']
                high_t = smoothstep(0.10, 0.22, src_clear)
                fk_g = max(0.0, float(fk_skin_init[l['fast_sole'], 2].min()))
                goals[l['end']] = scaled_g * (1.0 - high_t) + fk_g * high_t
        solved = ground_limbs(
            fk, goals,
            allow_reversed_height=(clip_name not in BASE_CLIPS),
            front_lying=front_lying,
            rear_lying=rear_lying,
        )

        for bone in arm.bones:
            n = bone.name
            if n == 'Muzzle':
                continue
            kwargs = {} if bone.parent is None else dict(parent_matrix=solved[bone.parent.name], parent_matrix_local=rest[bone.parent.name])
            basis = bone.convert_local_to_pose(solved[n], rest[n], invert=True, **kwargs)
            loc, q, _ = basis.decompose()
            if n in prev_quats and q.dot(prev_quats[n]) < 0.0:
                q.negate()
            prev_quats[n] = q.copy()
            pb = rig.pose.bones[n]
            pb.rotation_mode = 'QUATERNION'
            pb.rotation_quaternion = q
            pb.scale = (1.0, 1.0, 1.0)
            pb.location = loc if bone.parent is None else Vector()
            pb.keyframe_insert('rotation_quaternion', frame=f_rel)
            if bone.parent is None:
                pb.keyframe_insert('location', frame=f_rel)
            elif loc.length > 1e-4:
                raise RuntimeError(f'Non-zero local offset on child bone {n} in {clip_name}: {loc}')

    action.use_fake_user = True
    new_actions.append((action, clip_name))
    print('BAKED', clip_name, len(samples), flush=True)

# 6. Clean up scene, set LINEAR interpolation, save .blend and export .glb
for obj in list(bpy.data.objects):
    if obj not in meshes and obj != rig:
        bpy.data.objects.remove(obj, do_unlink=True)
for armature in list(bpy.data.armatures):
    if armature != arm:
        bpy.data.armatures.remove(armature)
for action in list(bpy.data.actions):
    if action not in [a for a, _ in new_actions]:
        bpy.data.actions.remove(action)
for action, name in new_actions:
    action.name = name
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    for key in curve.keyframe_points:
                        key.interpolation = 'LINEAR'

rig.animation_data.action = next(a for a, n in new_actions if n == ('idle 50' if 'idle 50' in CLIPS else CLIPS[0]))
rig.animation_data.action_slot = rig.animation_data.action.slots[0]
scene.frame_set(0)
for obj in meshes:
    obj.hide_viewport = False
for image in bpy.data.images:
    if image.has_data and not image.packed_file:
        image.pack()
bpy.data.orphans_purge(do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND), compress=True)
bpy.ops.export_scene.gltf(
    filepath=str(OUT_GLB),
    export_format='GLB',
    export_extras=True,
    export_animations=True,
    export_skins=True,
    export_animation_mode='ACTIONS',
    export_force_sampling=False,
)
print('EXPORTED', str(OUT_GLB), len(CLIPS), 'CLIPS', flush=True)
os._exit(0)
