"""Separate the weighted Xbot head in Blender sources and export the official GLB.
Run from the project root: blender --background --python scripts/split-xbot-head.py
"""
import os
import sys
from pathlib import Path

import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]


def split_head():
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    if bpy.data.objects.get('Beta_Head'):
        return
    body = bpy.data.objects['Beta_Surface']
    groups = {g.index for g in body.vertex_groups
              if g.name.split(':')[-1] in {'Head', 'HeadTop_End'}}
    vertices = {v.index for v in body.data.vertices
                if any(g.group in groups and g.weight > 0 for g in v.groups)}
    faces = {p.index for p in body.data.polygons
             if any(v in vertices for v in p.vertices)}
    assert faces and len(faces) < len(body.data.polygons), 'Missing separate head region'
    assert all(all(v in vertices for v in body.data.polygons[i].vertices) for i in faces), \
        'Head weights cross a face: inspect the neck seam before splitting'
    original_faces = len(body.data.polygons)
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='DESELECT')
    mesh = bmesh.from_edit_mesh(body.data)
    mesh.faces.ensure_lookup_table()
    for index in faces:
        mesh.faces[index].select_set(True)
    bmesh.update_edit_mesh(body.data)
    before = set(bpy.data.objects)
    bpy.ops.mesh.separate(type='SELECTED')
    bpy.ops.object.mode_set(mode='OBJECT')
    head, = set(bpy.data.objects) - before
    head.name = 'Beta_Head'
    head.data.name = 'Beta_Head'
    assert len(head.data.polygons) == len(faces)
    assert len(body.data.polygons) + len(head.data.polygons) == original_faces
    assert head.find_armature() == body.find_armature()
    print(f'Split {len(faces)} head faces from {body.name}', flush=True)


bpy.ops.wm.open_mainfile(filepath=str(ROOT / 'sources_backup/xbot_from_mixamo.blend'))
split_head()
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)

# The app uses the official Three.js variant, which has different geometry.
# Reuse its saved Blender source on subsequent runs.
official_source = ROOT / 'sources_backup/Xbot_official.blend'
if official_source.exists():
    bpy.ops.wm.open_mainfile(filepath=str(official_source))
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/characters/xbot/Xbot_official.glb'))
# Keep only the imported character; startup handlers can add unrelated objects.
for obj in list(bpy.context.scene.objects):
    if obj.type != 'ARMATURE' and obj.name not in {'Beta_Surface', 'Beta_Joints', 'Beta_Head'}:
        bpy.data.objects.remove(obj, do_unlink=True)
split_head()
bpy.ops.wm.save_as_mainfile(filepath=str(official_source))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=str(ROOT / 'public/characters/xbot/Xbot_official.glb'),
    export_format='GLB', use_selection=True, export_animations=True,
    export_yup=True,
)
sys.stdout.flush()
# Avoid waiting on unavailable desktop audio services in background mode.
os._exit(0)
