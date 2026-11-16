"""Offline front / three-quarter / back previews for the updated household items."""
from pathlib import Path
import bpy
from mathutils import Vector
import json
ROOT = Path(__file__).resolve().parents[1]
models = [entry['glbPath'] for entry in json.loads((ROOT / 'scripts/cosmetic-products.json').read_text())] + [
    'items/cif-infinite-clean/CifInfiniteClean.glb',
    'items/transparent-spray-cleaner/TransparentSprayCleaner.glb',
    'items/tackan distributeur savon blanc/TACKAN distributeur savon blanc.glb',
]
for model in models:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public' / model))
    points = [obj.matrix_world @ Vector(p) for obj in bpy.context.scene.objects if obj.type == 'MESH' for p in obj.bound_box]
    lo, hi = [Vector([f(p[i] for p in points) for i in range(3)]) for f in [min, max]]
    center, span = (lo + hi) / 2, max(hi - lo)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 8
    scene.render.resolution_x = scene.render.resolution_y = 360
    scene.render.resolution_percentage = 100
    scene.world = bpy.data.worlds.new('Preview world')
    scene.world.color = (.3, .3, .3)
    scene.view_settings.view_transform = 'AgX'
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -.0001))
    floor = bpy.context.object
    mat = bpy.data.materials.new('Grey floor')
    mat.diffuse_color = (.18, .19, .21, 1)
    floor.data.materials.append(mat)
    for direction, power in [((-1.5, -1, 2), 350), ((1, 1.2, 1.7), 220)]:
        bpy.ops.object.light_add(type='AREA', location=center + Vector(direction) * span)
        lamp = bpy.context.object
        lamp.data.energy = power * span ** 2
        lamp.data.size = span
        lamp.rotation_euler = (center - lamp.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.camera_add()
    camera = bpy.context.object
    scene.camera = camera
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = span * 1.4
    output = Path('/tmp/room-tackan-previews') if 'tackan distributeur' in model else (ROOT / 'public' / model).parent
    output.mkdir(parents=True, exist_ok=True)
    for name, direction in [('front', (0, -2, .65)), ('three-quarter', (1.4, -2, .9)), ('back', (-1.3, 2, .8))]:
        camera.location = center + Vector(direction) * span
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(output / f'preview-{name}.png')
        bpy.ops.render.render(write_still=True)
    print('PREVIEWS', model, flush=True)
import os
os._exit(0)
