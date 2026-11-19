"""Check exported scene variants in Blender, including material-specific geometry.
Run: blender -b -t 4 --python-exit-code 1 --python scripts/check-household-model-variants.py
"""
import json
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
TOLERANCE_METRES = 0.0005


def load(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    surfaces = {}
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH':
            continue
        obj.data.calc_loop_triangles()
        for triangle in obj.data.loop_triangles:
            material = obj.data.materials[triangle.material_index].name
            surfaces.setdefault(material, []).append([obj.matrix_world @ obj.data.vertices[i].co for i in triangle.vertices])
    return surfaces


def points(triangles):
    return [v for triangle in triangles for v in triangle]


def limits(vertices):
    return [min(p[i] for p in vertices) for i in range(3)] + [max(p[i] for p in vertices) for i in range(3)]


def distance(source, target):
    vertices = points(target)
    bvh = BVHTree.FromPolygons(vertices, [(i, i + 1, i + 2) for i in range(0, len(vertices), 3)])
    # Also check triangle centres after export, rather than only decimated vertices.
    samples = points(source) + [sum(triangle, Vector()) / 3 for triangle in source]
    return max(bvh.find_nearest(point)[3] for point in samples)


for entry in json.loads((ROOT / 'docs/household-geometry-optimization.json').read_text()):
    original = load(entry['source'])
    reduced = load(entry['target'])
    assert original.keys() == reduced.keys(), 'Material surfaces changed'
    before = sum(map(len, original.values()))
    after = sum(map(len, reduced.values()))
    assert after < before, 'No geometry reduction'
    a = limits([v for triangles in original.values() for v in points(triangles)])
    b = limits([v for triangles in reduced.values() for v in points(triangles)])
    assert max(abs(x - y) for x, y in zip(a, b)) <= TOLERANCE_METRES, 'Bounding edges moved'
    for material in original:
        error = max(distance(original[material], reduced[material]), distance(reduced[material], original[material]))
        assert error <= TOLERANCE_METRES, f'{material}: exported surface error {error * 1000} mm'
        if material in ['Brushed stainless steel', 'Product label navy']:
            assert len(original[material]) == len(reduced[material]), f'{material}: geometry changed'
        print(f'PASS {material}: {error * 1000:.6f} mm')
    print(f'PASS {entry["target"]}: {before} -> {after} triangles')
