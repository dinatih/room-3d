"""Download official Unitree assets, then convert with Blender --background --python.

python3 scripts/import-unitree.py --download
blender --background --python scripts/import-unitree.py
"""
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path('/tmp/room-unitree')
ROS = 'https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/'
MUJOCO = 'https://raw.githubusercontent.com/unitreerobotics/unitree_mujoco/main/'

def download(url, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, target)

if '--download' in sys.argv:
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
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = rgba
    shader.inputs['Roughness'].default_value = 0.5
    return mat

def mesh_object(filename, name, matrix, mat):
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
        obj.matrix_world = matrix
        obj.data.materials.clear()
        obj.data.materials.append(mat)

def export(robot, source):
    bpy.context.view_layer.update()
    objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    points = [o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
    lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    # Blender Z up becomes glTF Y up; Unitree X forward becomes glTF +Z.
    from math import pi
    transform = Matrix.Scale(100, 4) @ Matrix.Rotation(-pi / 2, 4, 'Z') @ Matrix.Translation((-(lo.x+hi.x)/2, -(lo.y+hi.y)/2, -lo.z))
    for obj in objects:
        obj.matrix_world = transform @ obj.matrix_world
    target = ROOT / f'public/items/unitree-{robot}'
    bpy.ops.export_scene.gltf(filepath=str(target / f'unitree-{robot}.glb'), export_format='GLB', export_animations=False)
    size = (hi - lo) * 100
    dims = {'w': round(size.y, 2), 'd': round(size.x, 2), 'h': round(size.z, 2)}
    (target / 'dimensions.json').write_text(json.dumps(dims, indent=2) + '\n')
    (target / 'README.md').write_text(f'# Unitree {robot.upper()}\n\nSource: {source}\n\nOfficial visual meshes assembled in Blender. Static standing pose, original materials, centimeters, glTF Y up, centered on X/Z and grounded at Y=0. No physics or autonomous navigation.\n\nSee LICENSE for upstream redistribution terms. Regenerate using scripts/import-unitree.py.\n')
    print(robot, dims)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
g1 = ET.parse(CACHE / 'g1.urdf').getroot()
links = {e.attrib['name']: e for e in g1.findall('link')}
joints = {j.find('child').attrib['link']: j for j in g1.findall('joint')}
transforms = {}
def link_transform(name):
    if name not in transforms:
        joint = joints.get(name)
        transforms[name] = Matrix.Identity(4) if joint is None else link_transform(joint.find('parent').attrib['link']) @ origin(joint.find('origin'))
    return transforms[name]
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
        mesh_object(mesh.attrib['filename'], name, link_transform(name) @ origin(visual.find('origin')) @ scale, material(name, rgba))
export('g1', ROS + 'robots/g1_description/g1_29dof_rev_1_0.urdf')

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
go2 = ET.parse(CACHE / 'go2.xml').getroot()
materials = {m.attrib['name']: material(m.attrib['name'], numbers(m.attrib['rgba'])) for m in go2.findall('asset/material')}
def mj_transform(element):
    return Matrix.Translation(numbers(element.get('pos', '0 0 0'))) @ Quaternion(numbers(element.get('quat', '1 0 0 0'))).normalized().to_matrix().to_4x4()
def body(element, parent):
    matrix = parent @ mj_transform(element)
    joint = element.find('joint')
    if joint is not None:
        # Official home keyframe: each leg uses hip=0, thigh=0.9, calf=-1.8.
        angle = {'abduction': 0, 'front_hip': 0.9, 'back_hip': 0.9, 'knee': -1.8}[joint.attrib['class']]
        axis = numbers(joint.get('axis', '1 0 0' if joint.attrib['class'] == 'abduction' else '0 1 0'))
        matrix = matrix @ Matrix.Rotation(angle, 4, Vector(axis))
    for geom in element.findall('geom'):
        if geom.get('class') == 'visual':
            mesh_object(geom.attrib['mesh'] + '.obj', element.attrib['name'], matrix @ mj_transform(geom), materials[geom.attrib['material']])
    for child in element.findall('body'):
        body(child, matrix)
for element in go2.findall('worldbody/body'):
    body(element, Matrix.Identity(4))
export('go2', MUJOCO + 'unitree_robots/go2/go2.xml')
