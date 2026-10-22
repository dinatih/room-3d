"""Separate the Mannequin head in Blender sources and export the GLB.
Run from the project root: blender --background --python scripts/split-mannequin-head.py
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
    if bpy.data.objects.get('Ch36_Head'):
        return

    # Clean up any leftover objects
    for o in list(bpy.context.scene.objects):
        if o.name == 'Icosphere':
            bpy.data.objects.remove(o, do_unlink=True)

    body = bpy.data.objects['Ch36']
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(body.data)

    top_vert = max(bm.verts, key=lambda v: v.co.z)
    visited = set()
    comp = []
    queue = [top_vert]
    visited.add(top_vert.index)
    while queue:
        curr = queue.pop()
        comp.append(curr)
        for edge in curr.link_edges:
            other = edge.other_vert(curr)
            if other.index not in visited:
                visited.add(other.index)
                queue.append(other)

    comp_set = set(comp)
    bpy.ops.mesh.select_all(action='DESELECT')
    for v in comp:
        v.select = True
    for f in bm.faces:
        if all(v in comp_set for v in f.verts):
            f.select = True

    bmesh.update_edit_mesh(body.data)
    before = set(bpy.data.objects)
    bpy.ops.mesh.separate(type='SELECTED')
    bpy.ops.object.mode_set(mode='OBJECT')

    new_objs = set(bpy.data.objects) - before
    assert len(new_objs) == 1, f'Expected 1 separated head object, got {len(new_objs)}'
    head = list(new_objs)[0]
    head.name = 'Ch36_Head'
    head.data.name = 'Ch36_Head'
    body.name = 'Ch36'
    print(f'Split {len(head.data.polygons)} head polygons from {body.name}', flush=True)


official_source = ROOT / 'sources_backup/mannequin.blend'
if official_source.exists():
    bpy.ops.wm.open_mainfile(filepath=str(official_source))
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/characters/mannequin/mannequin.glb'))

split_head()

blend_public = ROOT / 'public/characters/mannequin/mannequin.blend'
bpy.ops.wm.save_as_mainfile(filepath=str(official_source))
bpy.ops.wm.save_as_mainfile(filepath=str(blend_public))

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=str(ROOT / 'public/characters/mannequin/mannequin.glb'),
    export_format='GLB',
    use_selection=True,
    export_animations=False,
    export_skins=True,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
    export_yup=True,
)
sys.stdout.flush()
os._exit(0)
