"""Inspect the sculpt and donor rig without modifying either source.

Usage: blender -b -t 2 --python scripts/inspect-dachshund-sculpt.py
Writes a Blender inspection scene and JSON report under /tmp/dachshund-review.
The meshes are deliberately not bound: this is an inspection artifact, not a rig.
"""
import json
import tempfile
import zipfile
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('/tmp/dachshund-review')
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
report = {}


def inspect(label, path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    objects = set(bpy.data.objects) - before
    collection = bpy.data.collections.new(label)
    bpy.context.scene.collection.children.link(collection)
    records = []
    for obj in sorted(objects, key=lambda obj: obj.name):
        for owner in list(obj.users_collection):
            owner.objects.unlink(obj)
        collection.objects.link(obj)
        record = {'name': obj.name, 'type': obj.type}
        if obj.type == 'MESH':
            points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
            record.update(vertices=len(obj.data.vertices),
                          bounds_min=[min(p[i] for p in points) for i in range(3)],
                          bounds_max=[max(p[i] for p in points) for i in range(3)])
        if obj.type == 'ARMATURE':
            obj.show_in_front = True
            record['bones'] = [dict(name=bone.name,
                                   parent=bone.parent.name if bone.parent else None,
                                   head=list(obj.matrix_world @ bone.head_local),
                                   tail=list(obj.matrix_world @ bone.tail_local))
                               for bone in obj.data.bones]
        records.append(record)
    report[label] = records


with tempfile.TemporaryDirectory(prefix='dachshund-inspect-') as directory:
    with zipfile.ZipFile(Path.home() / '3D Resources/animals/dachshund-sculpt.zip') as archive:
        source = Path(directory) / 'sculpt.glb'
        source.write_bytes(archive.read('source/CocoSculpt.glb'))
    inspect('Sculpt — unrigged source', source)
inspect('Pitbull — donor rig', ROOT / 'public/characters/animated-pitbull-dog/dog.glb')
report['actions'] = sorted(action.name for action in bpy.data.actions)
(OUT / 'inspection.json').write_text(json.dumps(report, indent=2) + '\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'inspection.blend'))
print('Inspection saved:', OUT, flush=True)
