"""Split FPV head meshes, preserving skin weights, UVs and all polygons.
Run: blender --background --python scripts/split-character-heads.py
Process editable sources independently to retain their original authoring data.
"""
import os
from pathlib import Path
import bmesh
import bpy

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'alex': 'alex.blend', 'james': 'james.blend', 'david': 'david.blend',
    'lewis': 'lewis.blend', 'ivy': 'ivy_rigged.blend', 'valby': 'valby.blend',
    'ybot': 'ybot.blend', 'skeleton': 'skeleton_tpose.blend',
    'curious_skeleton': 'curious_skeleton_tpose.blend',
}


def split_head(body):
    arm = body.find_armature()
    assert arm, f'{body.name}: missing armature'
    head_bones = {b.name for b in arm.data.bones
                  if b.name.split(':')[-1] in {'Head', 'HeadTop_End'}}
    assert head_bones, f'{body.name}: missing head bone'
    head_groups = {g.index for g in body.vertex_groups if g.name in head_bones}
    # Classify each face by its strongest combined bone influence. This follows
    # the anatomical head/neck boundary without a world-space height cutoff.
    faces = set()
    for face in body.data.polygons:
        weights = {}
        for index in face.vertices:
            for g in body.data.vertices[index].groups:
                key = 'head' if g.group in head_groups else g.group
                weights[key] = weights.get(key, 0) + g.weight
        if weights and max(weights, key=weights.get) == 'head':
            faces.add(face.index)
    if not faces:
        return
    if len(faces) == len(body.data.polygons):
        if 'head' not in body.name.lower():
            body.name += '_Head'
        return
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
    head.name = body.name + '_Head'
    head.data.name = head.name
    assert len(head.data.polygons) == len(faces)
    assert len(body.data.polygons) + len(head.data.polygons) == original_faces
    assert head.find_armature() == arm
    print(f'SPLIT {body.name}: {len(faces)} head / {len(body.data.polygons)} body faces', flush=True)


for character, source in SOURCES.items():
    folder = ROOT / 'public/characters' / character
    source_path = folder / source
    if source_path.exists():
        bpy.ops.wm.open_mainfile(filepath=str(source_path))
        for body in list(bpy.context.scene.objects):
            if body.type == 'MESH' and body.find_armature() and '_Head' not in body.name:
                split_head(body)
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(source_path))
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(folder / f'{character}.glb'))
    # Blender startup handlers may add an unrelated Icosphere after import.
    for obj in list(bpy.context.scene.objects):
        if obj.name == 'Icosphere' and not obj.find_armature():
            bpy.data.objects.remove(obj, do_unlink=True)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    total = sum(len(o.data.polygons) for o in meshes)
    for body in meshes:
        if '_Head' not in body.name:
            split_head(body)
    assert total == sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')
    bpy.context.preferences.filepaths.save_version = 0
    if not source_path.exists():
        bpy.ops.wm.save_as_mainfile(filepath=str(source_path))
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=str(folder / f'{character}.glb'), export_format='GLB',
        use_selection=True, export_animations=True, export_skins=True,
        export_cameras=False, export_lights=False, export_yup=True,
        export_draco_mesh_compression_enable=True,
    )
    print(f'EXPORTED {character}: {total} preserved faces', flush=True)
os._exit(0)
