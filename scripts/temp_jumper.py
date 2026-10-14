"""Rebuild Jumper's inventory GLB from the pinned upstream URDF and binary STLs."""
import concurrent.futures
import json
import math
from pathlib import Path
import struct
import subprocess
import xml.etree.ElementTree as ET
import numpy as np

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
paths = [e['path'] for e in TREE['tree'] if e['path'].startswith('assets/jumper/urdf/jumper/') and e['path'].endswith(('.stl', '.urdf'))] + ['LICENSE', 'NOTICE']
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
conversion = np.array([[0,-100,0,0],[0,0,100,0],[100,0,0,0],[0,0,0,1]], dtype=float)

def visit(name, world, parent):
    node_id = len(gltf['nodes'])
    gltf['nodes'].append(dict(name=name, children=[]))
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
        mat = conversion @ world @ transform(visual.find('origin'))
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
        points.append(packed[:,:3])
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
for name in links.keys()-child_names: visit(name,np.eye(4),0)
all_points = np.concatenate(points)
low,high = all_points.min(axis=0),all_points.max(axis=0)
gltf['nodes'][0]['translation'] = [float(-(low[0]+high[0])/2),float(-low[1]),float(-(low[2]+high[2])/2)]
dims = dict(zip(['w','h','d'], map(lambda x:round(float(x),2),high-low)))
gltf['buffers'] = [dict(byteLength=len(blob))]
encoded = json.dumps(gltf,separators=(',',':')).encode()
encoded += b' ' * (-len(encoded)%4)
blob.extend(b'\0' * (-len(blob)%4))
(OUT/'jumper.glb').write_bytes(struct.pack('<III',0x46546c67,2,28+len(encoded)+len(blob))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(blob),0x004e4942)+blob)
for name in ['LICENSE','NOTICE']: (OUT/name).write_bytes((CACHE/name).read_bytes())
(OUT/'README.md').write_text(f'''# Jumper — KingKong Robotics\n\nSource: https://github.com/KingKongRobotics/jumper\nRevision: `{REV}`\n\nConverted from the official URDF visual meshes to GLB with `scripts/temp_jumper.py`.\nOriginal colours and zero joint pose preserved. Metres/Z-up converted to centimetres/Y-up, centered horizontally and grounded. Named link hierarchy retained; mesh coordinates are baked in model space. No motion clips included.\n\nDimensions in this pose: {dims} cm.\n\nCopyright 2026 KingKong Robotics. Distributed under Apache-2.0; see LICENSE and upstream NOTICE alongside the model.\n''')
source = ROOT/'src/features/inventory/inventoryData.ts'
text = source.read_text()
if "id: 'jumper-robot'" not in text:
    entry = """\n  {\n    id: 'jumper-robot',\n    name: 'Jumper — robot crabe',\n    brand: 'KingKong Robotics',\n    category: 'tech',\n    qty: 1,\n    dims: %s,\n    glbPath: 'items/jumper/jumper.glb',\n    url: 'https://github.com/KingKongRobotics/jumper',\n    description: 'Robot crabe à 22 degrés de liberté. Assemblage 3D officiel avec ses couleurs d’origine.',\n    notes: 'Pose de référence URDF, sans animation. Dimensions mesurées sur le modèle. Modèle sous licence Apache-2.0.',\n  },\n""" % ('{ w: %(w)s, d: %(d)s, h: %(h)s }' % dims)
    source.write_text(text.replace('export const INVENTORY: InventoryItem[] = [','export const INVENTORY: InventoryItem[] = ['+entry))
print(json.dumps(dict(revision=REV, meshes=len(gltf['meshes']), dimensions=dims, bytes=(OUT/'jumper.glb').stat().st_size)))
