"""Download official Unitree assets, then convert with Blender --background --python.

python3 scripts/import-unitree.py --download
blender --background --python scripts/import-unitree.py
python3 scripts/import-unitree.py --inspect

H2 only: append --robot h2 (after -- when invoking Blender).
"""
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path('/tmp/room-unitree')
ROS = 'https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/'
SELECTED = sys.argv[sys.argv.index('--robot') + 1] if '--robot' in sys.argv else None
MUJOCO = 'https://raw.githubusercontent.com/unitreerobotics/unitree_mujoco/main/'

if '--inspect' in sys.argv:
    import struct
    for robot in ([SELECTED] if SELECTED else ('g1', 'go2', 'h2')):
        path = ROOT / f'public/items/unitree-{robot}/unitree-{robot}.glb'
        data = path.read_bytes()
        length = struct.unpack_from('<I', data, 12)[0]
        gltf = json.loads(data[20:20 + length])
        nodes = gltf['nodes']
        joints = [n for n in nodes if 'jointAxis' in n.get('extras', {})]
        feet = [n['name'] for n in nodes if n.get('name', '').endswith('ankle_pitch_link_visual' if robot == 'h2' else ('ankle_roll_link_visual', 'calf_foot'))]
        print(robot, json.dumps({'joints': len(joints), 'feet': feet,
            'humanoidBones': [n['name'] for n in nodes if n.get('name', '').startswith('mixamorig')],
            'axes': {n['name']: n['extras']['jointAxis'] for n in joints},
            'colors': [m['pbrMetallicRoughness']['baseColorFactor'] for m in gltf['materials']]}))
    sys.exit(0)

def download(url, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, target)

if '--download' in sys.argv:
    if SELECTED == 'h2':
        download(ROS + 'robots/h2_description/H2.urdf', CACHE / 'h2.urdf')
        (ROOT / 'public/items/unitree-h2').mkdir(parents=True, exist_ok=True)
        (ROOT / 'public/items/unitree-h2/H2.urdf').write_text((CACHE / 'h2.urdf').read_text())
        h2 = ET.parse(CACHE / 'h2.urdf').getroot()
        for filename in sorted({m.attrib['filename'] for m in h2.findall('.//visual/geometry/mesh')}):
            download(ROS + 'robots/h2_description/' + filename, CACHE / 'h2' / filename)
        download(ROS + 'LICENSE', ROOT / 'public/items/unitree-h2/LICENSE')
        sys.exit(0)
    download(ROS + 'robots/g1_description/g1_29dof_rev_1_0.urdf', CACHE / 'g1.urdf')
    download(MUJOCO + 'unitree_robots/go2/go2.xml', CACHE / 'go2.xml')
    g1 = ET.parse(CACHE / 'g1.urdf').getroot()
    for filename in sorted({m.attrib['filename'] for m in g1.findall('.//visual/geometry/mesh')}):
        download(ROS + 'robots/g1_description/' + filename, CACHE / filename)
    go2 = ET.parse(CACHE / 'go2.xml').getroot()
    for mesh in go2.findall('asset/mesh'):
        filename = mesh.attrib['file']
        download(MUJOCO + 'unitree_robots/go2/assets/' + filename, CACHE / filename)
    for robot, source in [('g1', ROS), ('go2', MUJOCO)]:
        download(source + 'LICENSE', ROOT / f'public/items/unitree-{robot}/LICENSE')
    print('Official meshes downloaded')
    sys.exit(0)

import bpy
from mathutils import Matrix, Euler, Vector, Quaternion

def numbers(value):
    return tuple(map(float, value.split()))

def origin(element):
    if element is None:
        return Matrix.Identity(4)
    rotation = Euler(numbers(element.get('rpy', '0 0 0')), 'XYZ').to_matrix().to_4x4()
    return Matrix.Translation(numbers(element.get('xyz', '0 0 0'))) @ rotation

def material(name, rgba):
    # Repaint the light body panels, preserving black sensors, rubber and metal.
    if name != 'metal' and min(rgba[:3]) > 0.4:
        rgba = (0.65, 0.012, 0.02, rgba[3])
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = rgba
    shader.inputs['Roughness'].default_value = 0.5
    return mat

def mesh_object(filename, name, matrix, mat, parent):
    before = set(bpy.data.objects)
    path = str(CACHE / filename)
    if filename.lower().endswith('.stl'):
        bpy.ops.wm.stl_import(filepath=path)
    else:
        bpy.ops.wm.obj_import(filepath=path, forward_axis='Y', up_axis='Z')
    objects = set(bpy.data.objects) - before
    if not objects:
        raise ValueError(f'Empty mesh: {filename}')
    for obj in objects:
        obj.name = name
        obj.parent = parent
        obj.matrix_local = matrix
        obj.data.materials.clear()
        obj.data.materials.append(mat)

def pivot(name, parent, matrix, axis=None, rest_angle=0):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    obj.matrix_local = matrix
    if axis is not None:
        # glTF exporter converts local Blender Z-up coordinates to Y-up.
        obj['jointAxis'] = [axis[0], axis[2], -axis[1]]
        obj['restAngle'] = rest_angle
    return obj

def export(robot, source):
    bpy.context.view_layer.update()
    objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    points = [o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
    lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    # Blender Z up becomes glTF Y up; Unitree X forward becomes glTF +Z.
    from math import pi
    transform = Matrix.Identity(4) if robot == 'h2' else Matrix.Scale(100, 4) @ Matrix.Rotation(-pi / 2, 4, 'Z') @ Matrix.Translation((-(lo.x+hi.x)/2, -(lo.y+hi.y)/2, -lo.z))
    for obj in list(bpy.context.scene.objects):
        if obj.parent is None:
            obj.matrix_world = transform @ obj.matrix_world
    target = ROOT / f'public/items/unitree-{robot}'
    bpy.ops.export_scene.gltf(filepath=str(target / f'unitree-{robot}.glb'), export_format='GLB', export_animations=False, export_extras=True, export_draco_mesh_compression_enable=robot == 'h2')
    size = (hi - lo) * 100
    dims = {'w': round(size.x if robot == 'h2' else size.y, 2), 'd': round(size.y if robot == 'h2' else size.x, 2), 'h': round(size.z, 2)}
    (target / 'dimensions.json').write_text(json.dumps(dims, indent=2) + '\n')
    (target / 'README.md').write_text(f'# Unitree {robot.upper()}\n\nSource: {source}\n\nOfficial visual meshes assembled in Blender with the original joint hierarchy and axes. Light body panels repainted red; dark sensors and rubber preserved. Centimeters, glTF Y up, centered on X/Z and grounded at Y=0.\n\nProcedural visual animations authored for this project in src/features/scene/items/unitreeMotion.ts: idle, locomotion, greeting, bow and dance. These are not recordings or control policies from Unitree. Go2 resting joint angles come from the official MuJoCo home keyframe. No physics or autonomous navigation.\n\nSee LICENSE for upstream redistribution terms. Regenerate using scripts/import-unitree.py.\n')
    if robot == 'h2':
        (target / 'README.md').write_text(f'''# Unitree H2

Official source: {source}
Repository: https://github.com/unitreerobotics/unitree_ros/tree/master/robots/h2_description
Redistribution: BSD-3-Clause, see LICENSE.

The 34 official visual meshes retain the URDF motor hierarchy, pivots, axes and
31 angular limits. scripts/unitree-h2-character.py exports one bone per original
link and one rigid influence per piece. Intermediate motor housings follow their
own joints. No mesh bends, stretches or slides along the skeleton.

A separate humanoid reference is stored as metadata, solely for converting the
project's human animation clips into constrained motor rotations. It is not the
visible robot's rig. The resulting motion approximates the source where the
robot cannot reproduce it. This is a visual adaptation, not a balance controller,
collision solver or executable policy for a physical H2.

Light panels are repainted red. Model units are meters (the Character runtime
scales to centimeters), glTF Y up, forward -Z (north), centered on X/Z and grounded
at Y=0. dimensions.json records centimeters in the original URDF neutral pose.

Uses the project's standard Character, retargeting and navigation systems, with
the existing walking animation as its NPC gait. No Unitree motion policy is used.

Regenerate:
```sh
python3 scripts/import-unitree.py --download --robot h2
blender -noaudio --background --python scripts/import-unitree.py -- --robot h2
```
''')
    print(robot, dims)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
robot = SELECTED or 'g1'
g1 = ET.parse(CACHE / f'{robot}.urdf').getroot()
links = {e.attrib['name']: e for e in g1.findall('link')}
joints = {j.find('child').attrib['link']: j for j in g1.findall('joint')}
rig = {}
def link_pivot(name):
    if name not in rig:
        joint = joints.get(name)
        if joint is None:
            rig[name] = pivot(name, None, Matrix.Identity(4))
        else:
            axis = numbers(joint.find('axis').attrib['xyz']) if joint.get('type') == 'revolute' else None
            rig[name] = pivot(joint.attrib['name'], link_pivot(joint.find('parent').attrib['link']), origin(joint.find('origin')), axis)
    return rig[name]
materials = {m.attrib['name']: numbers(m.find('color').attrib['rgba']) for m in g1.findall('material')}
for name, link in links.items():
    for visual in link.findall('visual'):
        mesh = visual.find('geometry/mesh')
        if mesh is None:
            raise ValueError(f'Unsupported G1 visual: {name}')
        m = visual.find('material')
        color = m.find('color')
        rgba = numbers(color.attrib['rgba']) if color is not None else materials[m.attrib['name']]
        scale = Matrix.Diagonal((*numbers(mesh.get('scale', '1 1 1')), 1))
        mesh_object(('h2/' if robot == 'h2' else '') + mesh.attrib['filename'], name + '_visual', origin(visual.find('origin')) @ scale, material(name, rgba), link_pivot(name))
if robot == 'h2':
    sys.dont_write_bytecode = True
    sys.path.insert(0, str(ROOT / 'scripts'))
    import importlib
    importlib.import_module('unitree-h2-character').character_rig(rig, joints)
export(robot, ROS + ('robots/h2_description/H2.urdf' if robot == 'h2' else 'robots/g1_description/g1_29dof_rev_1_0.urdf'))
if SELECTED == 'h2':
    sys.exit(0)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
go2 = ET.parse(CACHE / 'go2.xml').getroot()
materials = {m.attrib['name']: material(m.attrib['name'], numbers(m.attrib['rgba'])) for m in go2.findall('asset/material')}
def mj_transform(element):
    return Matrix.Translation(numbers(element.get('pos', '0 0 0'))) @ Quaternion(numbers(element.get('quat', '1 0 0 0'))).normalized().to_matrix().to_4x4()
def body(element, parent):
    matrix = mj_transform(element)
    joint = element.find('joint')
    if joint is not None:
        # Official home keyframe: each leg uses hip=0, thigh=0.9, calf=-1.8.
        angle = {'abduction': 0, 'front_hip': 0.9, 'back_hip': 0.9, 'knee': -1.8}[joint.attrib['class']]
        axis = numbers(joint.get('axis', '1 0 0' if joint.attrib['class'] == 'abduction' else '0 1 0'))
        matrix = matrix @ Matrix.Rotation(angle, 4, Vector(axis))
    node = pivot(joint.attrib['name'] if joint is not None else element.attrib['name'], parent, matrix,
                 axis if joint is not None else None, angle if joint is not None else 0)
    for geom in element.findall('geom'):
        if geom.get('class') == 'visual':
            mesh_object(geom.attrib['mesh'] + '.obj', element.attrib['name'] + '_' + geom.attrib['mesh'], mj_transform(geom), materials[geom.attrib['material']], node)
    for child in element.findall('body'):
        body(child, node)
for element in go2.findall('worldbody/body'):
    body(element, None)
export('go2', MUJOCO + 'unitree_robots/go2/go2.xml')
