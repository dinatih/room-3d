"""Rebuild Jumper's inventory GLB from the pinned upstream URDF and binary STLs."""
import concurrent.futures
import json
import math
from pathlib import Path
import struct
import subprocess
import xml.etree.ElementTree as ET
import numpy as np
from scipy.spatial import ConvexHull
from scipy.spatial.transform import Rotation
from scipy.optimize import least_squares

ROOT = Path(__file__).resolve().parents[1]
REV = '78966f45de6f2b6de3f7cea017f32a39f8b993e6'
TREE_PATH = Path('/tmp/room-jumper-tree.json')
if not TREE_PATH.exists():
    subprocess.run(['curl', '-L', '--fail', '--silent', f'https://api.github.com/repos/KingKongRobotics/jumper/git/trees/{REV}?recursive=1', '-o', str(TREE_PATH)], check=True)
TREE = json.loads(TREE_PATH.read_text())
CACHE = Path('/tmp/room-jumper')
OUT = ROOT / 'public/items/jumper'
CACHE.mkdir(exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
paths = [e['path'] for e in TREE['tree'] if e['path'].startswith('assets/jumper/urdf/jumper/') and e['path'].endswith(('.stl', '.urdf'))] + ['LICENSE', 'NOTICE', 'out/bundle_example/jumper/locomotion.json']
OFFICIAL = {'hello': 'gesture_hello', 'bow': 'gesture_bow', 'paw': 'gesture_paw', 'salute': 'gesture_salute', 'maze': 'dance_maze'}
for motion, config in OFFICIAL.items():
    paths += [f'out/bundle_example/jumper/{motion}.motion.trajectory.json', f'out/bundle_example/jumper/{config}.json']
def download(path):
    dest = CACHE / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        subprocess.run(['curl', '-L', '--fail', '--silent', f'https://raw.githubusercontent.com/KingKongRobotics/jumper/{REV}/{path}', '-o', str(dest)], check=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    list(pool.map(download, paths))
robot = ET.parse(CACHE / 'assets/jumper/urdf/jumper/urdf/jumper.urdf').getroot()
gltf = dict(asset=dict(version='2.0', generator='room-3d Jumper URDF importer', copyright='Copyright 2026 KingKong Robotics. Apache-2.0'), scene=0, scenes=[dict(nodes=[0])], nodes=[dict(name='Jumper')], meshes=[], materials=[], accessors=[], bufferViews=[], buffers=[])
blob = bytearray()
points = []
hulls = {}
node_ids = {}
config = json.loads((CACHE/'out/bundle_example/jumper/locomotion.json').read_text())
neutral = config['default_joint_pos']
joints = {j.get('name'): j for j in robot.findall('joint') if j.get('type') == 'revolute'}
by_child = {j.find('child').get('link'): j for j in robot.findall('joint')}
def joint_rotation(joint, angle):
    axis = np.array(list(map(float, joint.find('axis').get('xyz').split())))
    return Rotation.from_rotvec(axis / np.linalg.norm(axis) * angle)
def local_matrix(name, pose):
    joint = by_child.get(name)
    if joint is None: return np.eye(4)
    matrix = transform(joint.find('origin'))
    if joint.get('type') == 'revolute': matrix[:3,:3] = matrix[:3,:3] @ joint_rotation(joint, pose[joint.get('name')]).as_matrix()
    return matrix
def worlds(pose, root_rotation=None):
    result = {}
    def walk(name, parent):
        result[name] = parent @ local_matrix(name, pose)
        for joint in children.get(name, []): walk(joint.find('child').get('link'), result[name])
    root = np.eye(4)
    if root_rotation is not None: root[:3,:3] = root_rotation.as_matrix()
    walk('base_link', root)
    return result
materials = {}
def accessor(array, kind, component):
    array = np.ascontiguousarray(array)
    while len(blob) % 4: blob.append(0)
    offset = len(blob)
    blob.extend(array.tobytes())
    view = len(gltf['bufferViews'])
    gltf['bufferViews'].append(dict(buffer=0, byteOffset=offset, byteLength=array.nbytes))
    entry = dict(bufferView=view, componentType=component, count=len(array), type=kind)
    if kind == 'VEC3':
        entry.update(min=array.min(axis=0).tolist(), max=array.max(axis=0).tolist())
    gltf['accessors'].append(entry)
    return len(gltf['accessors'])-1

def transform(origin):
    m = np.eye(4)
    if origin is None: return m
    r,p,y = map(float, origin.get('rpy', '0 0 0').split())
    cr,sr,cp,sp,cy,sy = math.cos(r),math.sin(r),math.cos(p),math.sin(p),math.cos(y),math.sin(y)
    m[:3,:3] = [[cy*cp,cy*sp*sr-sy*cr,cy*sp*cr+sy*sr],[sy*cp,sy*sp*sr+cy*cr,sy*sp*cr-cy*sr],[-sp,cp*sr,cp*cr]]
    m[:3,3] = list(map(float, origin.get('xyz', '0 0 0').split()))
    return m
links = {e.get('name'): e for e in robot.findall('link')}
children = {}
child_names = set()
for joint in robot.findall('joint'):
    children.setdefault(joint.find('parent').get('link'), []).append(joint)
    child_names.add(joint.find('child').get('link'))
# URDF metres/Z-up -> application centimetres/Y-up, front toward +Z.
conversion = np.array([[0,100,0,0],[0,0,100,0],[100,0,0,0],[0,0,0,1]], dtype=float)

def visit(name, world, parent):
    node_id = len(gltf['nodes'])
    node_ids[name] = node_id
    local = local_matrix(name, neutral)
    gltf['nodes'].append(dict(name=name, children=[], translation=local[:3,3].tolist(), rotation=Rotation.from_matrix(local[:3,:3]).as_quat().tolist()))
    gltf['nodes'][parent].setdefault('children', []).append(node_id)
    for visual in links[name].findall('visual'):
        mesh = visual.find('geometry/mesh')
        filename = Path(mesh.get('filename')).name
        raw = (CACHE / 'assets/jumper/urdf/jumper/meshes/visual' / filename).read_bytes()
        count = struct.unpack_from('<I', raw, 80)[0]
        assert len(raw) == 84 + count*50, filename
        triangles = np.frombuffer(raw, dtype=np.dtype([('normal','<f4',(3,)),('vertices','<f4',(3,3)),('attr','<u2')]), offset=84)
        vertices = triangles['vertices'].reshape(-1,3).astype(float)
        vertices *= np.array(list(map(float, mesh.get('scale','1 1 1').split())))
        mat = transform(visual.find('origin'))
        vertices = vertices @ mat[:3,:3].T + mat[:3,3]
        normals = np.repeat(triangles['normal'],3,axis=0).astype(float) @ np.linalg.inv(mat[:3,:3])
        lengths = np.linalg.norm(normals,axis=1)[:,None]
        # Some source STL facets have zero normals; recompute them from geometry.
        missing = lengths[:,0] == 0
        if missing.any():
            faces = vertices.reshape(-1,3,3)
            face_normals = np.repeat(np.cross(faces[:,1]-faces[:,0], faces[:,2]-faces[:,0]),3,axis=0)
            normals[missing] = face_normals[missing]
            lengths = np.linalg.norm(normals,axis=1)[:,None]
        # Degenerate source triangles have no normal and retain the zero vector.
        np.divide(normals, lengths, out=normals, where=lengths != 0)
        assert np.isfinite(vertices).all() and np.isfinite(normals).all(), filename
        packed, indices = np.unique(np.concatenate([vertices,normals],axis=1).astype('<f4'), axis=0, return_inverse=True)
        hulls[name] = packed[ConvexHull(packed[:,:3]).vertices,:3]
        neutral_world = conversion @ worlds(neutral)[name]
        points.append(packed[:,:3] @ neutral_world[:3,:3].T + neutral_world[:3,3])
        rgba = tuple(map(float, visual.find('material/color').get('rgba').split()))
        if rgba not in materials:
            materials[rgba] = len(gltf['materials'])
            gltf['materials'].append(dict(pbrMetallicRoughness=dict(baseColorFactor=rgba, metallicFactor=0, roughnessFactor=0.65)))
        mesh_id = len(gltf['meshes'])
        gltf['meshes'].append(dict(name=name, primitives=[dict(attributes=dict(POSITION=accessor(packed[:,:3], 'VEC3',5126), NORMAL=accessor(packed[:,3:],'VEC3',5126)), indices=accessor(indices.astype('<u4'),'SCALAR',5125), material=materials[rgba])]))
        gltf['nodes'].append(dict(name=name+'_visual', mesh=mesh_id))
        gltf['nodes'][node_id]['children'].append(len(gltf['nodes'])-1)
    for joint in children.get(name,[]):
        visit(joint.find('child').get('link'), world @ transform(joint.find('origin')), node_id)
basis = len(gltf['nodes'])
gltf['nodes'].append(dict(name='RobotBasis', children=[], rotation=Rotation.from_matrix(conversion[:3,:3]/100).as_quat().tolist(), scale=[100,100,100]))
gltf['nodes'][0]['children'] = [basis]
for name in sorted(links.keys()-child_names): visit(name,np.eye(4),basis)
all_points = np.concatenate(points)
low,high = all_points.min(axis=0),all_points.max(axis=0)
gltf['nodes'][0]['translation'] = [float(-(low[0]+high[0])/2),float(-low[1]),float(-(low[2]+high[2])/2)]
dims = dict(zip(['w','h','d'], map(lambda x:round(float(x),2),high-low)))
# Animation clips use local joint pivots, never baked world-space mesh positions.
gltf['animations'] = []
report = []
def add_clip(name, poses, times, roots=None, loop=False, provenance='official'):
    animation = dict(name=name, samplers=[], channels=[], extras=dict(provenance=provenance, loop=loop))
    times_id = accessor(np.asarray(times,dtype='<f4'), 'SCALAR', 5126)
    gltf['accessors'][times_id].update(min=[float(times[0])], max=[float(times[-1])])
    def channel(node, path, values, kind):
        array = np.asarray(values,dtype='<f4')
        assert np.isfinite(array).all(), (name,path)
        output = accessor(array, kind,5126)
        animation['channels'].append(dict(sampler=len(animation['samplers']), target=dict(node=node,path=path)))
        animation['samplers'].append(dict(input=times_id, output=output, interpolation='LINEAR'))
    for joint_name,joint in joints.items():
        origin = Rotation.from_matrix(transform(joint.find('origin'))[:3,:3])
        quats = np.array([(origin * joint_rotation(joint,pose[joint_name])).as_quat() for pose in poses])
        for i in range(1,len(quats)):
            if quats[i-1] @ quats[i] < 0: quats[i] *= -1
        channel(node_ids[joint.find('child').get('link')], 'rotation',quats,'VEC4')
    if roots is None: roots = [Rotation.identity()] * len(poses)
    root_quats = np.array([r.as_quat() for r in roots])
    for i in range(1,len(root_quats)):
        if root_quats[i-1] @ root_quats[i] < 0: root_quats[i] *= -1
    channel(node_ids['base_link'], 'rotation',root_quats,'VEC4')
    translations = []
    for pose, root_rotation in zip(poses,roots):
        matrices = worlds(pose, root_rotation)
        minimum = min(float((vertices @ matrices[link][:3,:3].T + matrices[link][:3,3])[:,2].min()) for link,vertices in hulls.items())
        translations.append([gltf['nodes'][0]['translation'][0], -minimum*100, gltf['nodes'][0]['translation'][2]])
    channel(0,'translation',translations,'VEC3')
    gltf['animations'].append(animation)
    report.append(dict(name=name, duration=float(times[-1]), frames=len(times), provenance=provenance, loop=loop))

add_clip('idle',[neutral,neutral],[0,1],loop=True,provenance='official standing pose')
for motion, config_name in OFFICIAL.items():
    trajectory = json.loads((CACHE/f'out/bundle_example/jumper/{motion}.motion.trajectory.json').read_text())
    settings = json.loads((CACHE/f'out/bundle_example/jumper/{config_name}.json').read_text())['reference']
    assert len(trajectory['q']) == settings['n_frames']
    assert set(trajectory['joint_order']) == set(joints)
    poses = [dict(zip(trajectory['joint_order'],frame)) for frame in trajectory['q']]
    # Source root_quat is MuJoCo wxyz; scipy/glTF use xyzw.
    roots = [Rotation.from_quat([q[1],q[2],q[3],q[0]]) for q in trajectory['root_quat']]
    assert len(roots) == len(poses)
    times = np.arange(len(poses)) / settings['rec_hz']
    add_clip(motion, poses,times,roots,loop=motion=='maze')

# Reconstructed diagonal gait: 7.2 cm stride and 2 Hz from the upstream
# locomotion configuration. Foot trajectories are solved against real pivots
# and upstream joint limits; these are visual clips, not policy recordings.
stride = next(t for t in config['observation']['terms'] if t['name']=='gait_phase')['params']['stride']
frequency = next(t for t in config['observation']['terms'] if t['name']=='gait_phase')['params']['freq_min']
legs = ['LM','RM','LR','RR']
base_worlds = worlds(neutral)
feet = {leg: base_worlds[leg+'_foot_tip_link'][:3,3].copy() for leg in legs}
ik_max_error = 0.0
for motion,direction in [('walk',0),('turn-left',1),('turn-right',-1)]:
    radius = np.mean([np.linalg.norm(feet[leg][:2]) for leg in legs])
    cycles = 1 if not direction else round(2*math.pi*radius/stride)
    duration = cycles/frequency
    times = np.linspace(0,duration,round(duration*50)+1)
    poses,roots = [],[]
    seeds = {leg: np.array([neutral[f'{leg}_J{i}_joint'] for i in range(3)]) for leg in legs}
    for time in times:
        pose = dict(neutral)
        for leg in legs:
            phase = (time*frequency + (0 if leg in ['LM','RR'] else 0.5)) % 1
            # Half-cycle stance moves backwards; swing returns with a smooth lift.
            travel = (0.5-2*phase) if phase<0.5 else (-0.5+2*(phase-0.5))
            target = feet[leg].copy()
            if direction:
                angle = direction*travel*2*math.pi/cycles
                target[:2] = Rotation.from_euler('z', angle).apply(target)[:2]
            else: target[0] += stride*travel
            if phase >= 0.5: target[2] += stride/4 * math.sin(2*math.pi*(phase-0.5))**2
            names = [f'{leg}_J{i}_joint' for i in range(3)]
            bounds = np.array([config['joint_limits'][name] for name in names]).T
            def residual(angles):
                candidate = dict(neutral)
                candidate.update(zip(names,angles))
                return worlds(candidate)[leg+'_foot_tip_link'][:3,3]-target
            solution = least_squares(residual,seeds[leg],bounds=bounds,gtol=1e-12,ftol=1e-12,xtol=1e-12)
            error = np.linalg.norm(solution.fun)
            assert solution.success and error<1e-5, (motion,leg,time,error)
            ik_max_error = max(ik_max_error,float(error))
            pose.update(zip(names,solution.x))
            seeds[leg] = solution.x
        poses.append(pose)
        roots.append(Rotation.from_euler('z', direction*2*math.pi*time/duration))
    add_clip(motion,poses,times,roots,loop=True,provenance='reconstructed foot-path IK')

(OUT/'animations.json').write_text(json.dumps(dict(revision=REV, clips=report, max_ik_error_m=ik_max_error),indent=2)+'\n')
gltf['buffers'] = [dict(byteLength=len(blob))]
encoded = json.dumps(gltf,separators=(',',':')).encode()
encoded += b' ' * (-len(encoded)%4)
blob.extend(b'\0' * (-len(blob)%4))
(OUT/'jumper.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(encoded)+len(blob))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(blob),0x004e4942)+blob)
for name in ['LICENSE','NOTICE']: (OUT/name).write_bytes((CACHE/name).read_bytes())
(OUT/'README.md').write_text(f'''# Jumper — KingKong Robotics\n\nSource: https://github.com/KingKongRobotics/jumper\nRevision: `{REV}`\n\nConverted from the official URDF visual meshes to GLB with `scripts/temp_jumper.py`.\nOriginal colours and official neutral standing pose preserved. Metres/Z-up converted to centimetres/Y-up, centered horizontally and grounded. Local joint pivots and axes retained. Official clips: hello, bow, paw, salute, maze (dance), sampled at their declared recording rates. Root orientation is retained; source trajectories contain no root translation, so vertical placement follows the lowest mesh point. Gestures play once; dance loops. Reconstructed clips: walk, turn-left, turn-right, using diagonal foot trajectories and bounded inverse kinematics, based on the official stride/frequency settings. Walk previews in place; turning previews rotate through a full circle. These three clips are visual reconstructions, not the learned locomotion policy. See animations.json for durations and provenance. Rebuild requires Python numpy and scipy; source downloads are pinned to the revision above.\n\nDimensions in this pose: {dims} cm.\n\nCopyright 2026 KingKong Robotics. Distributed under Apache-2.0; see LICENSE and upstream NOTICE alongside the model.\n''')
source = ROOT/'src/features/inventory/inventoryData.ts'
text = source.read_text()
if "id: 'jumper-robot'" not in text:
    entry = """\n  {\n    id: 'jumper-robot',\n    name: 'Jumper — robot crabe',\n    brand: 'KingKong Robotics',\n    category: 'tech',\n    qty: 1,\n    dims: %s,\n    glbPath: 'items/jumper/jumper.glb',\n    url: 'https://github.com/KingKongRobotics/jumper',\n    description: 'Robot crabe à 22 degrés de liberté. Assemblage 3D officiel avec ses couleurs d’origine.',\n    notes: 'Pose de référence URDF, sans animation. Dimensions mesurées sur le modèle. Modèle sous licence Apache-2.0.',\n  },\n""" % ('{ w: %(w)s, d: %(d)s, h: %(h)s }' % dims)
    source.write_text(text.replace('export const INVENTORY: InventoryItem[] = [','export const INVENTORY: InventoryItem[] = ['+entry))
print(json.dumps(dict(revision=REV, meshes=len(gltf['meshes']), dimensions=dims, bytes=(OUT/'jumper.glb').stat().st_size)))

import re
text = source.read_text()
text = re.sub(r"(id: 'jumper-robot',[\s\S]*?dims: )\{[^}]+\}", lambda m: m[1] + '{ w: %(w)s, d: %(d)s, h: %(h)s }' % dims, text, count=1)
text = text.replace('Pose de référence URDF, sans animation. Dimensions mesurées sur le modèle.', 'Animations : repos, marche et virages recréés ; salut, révérence, patte, salut militaire et danse officiels. Dimensions mesurées en position debout.')
source.write_text(text)
