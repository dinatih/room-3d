"""Build scene variants; preserve labels and hanger hardware, simplify dense surfaces.
Run: blender -b -t 4 --python-exit-code 1 --python scripts/build-lightweight-household-models.py
Accept at most 0.5 mm sampled surface deviation and bounding-edge displacement.
All source and reduced vertices are checked in world metres, in both directions.
"""
import json
from pathlib import Path
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
MAX_ERROR_METRES = 0.0005
# Try the smallest mesh first; retain it only if the measured geometry passes.
CANDIDATE_RATIOS = (0.125, 0.25, 0.5, 0.75)
MODELS = [
    ('laundry-detergent/LaundryDetergent.glb', 'laundry-detergent/LaundryDetergent-scene.glb', 'Material.002'),
    ('clip-hanger-16/ClipHanger16Loaded.glb', 'clip-hanger-16/ClipHanger16Loaded-scene.glb', 'Black cotton jersey'),
]


def surface(mesh):
    return BVHTree.FromPolygons([v.co for v in mesh.vertices], [tuple(p.vertices) for p in mesh.polygons])


def deviation(points, target):
    return max(target.find_nearest(point)[3] for point in points)


def bounds(points):
    return [min(v[axis] for v in points) for axis in range(3)] + [max(v[axis] for v in points) for axis in range(3)]


report = []
for source, destination, material_name in MODELS:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    source_path = ROOT / 'public/items' / source
    bpy.ops.import_scene.gltf(filepath=str(source_path))
    if bpy.data.actions:
        raise RuntimeError('Scene simplification requires a static source: ' + source)
    # Separate material surfaces so hardware and printed labels cannot be collapsed.
    for obj in list(bpy.context.scene.objects):
        if obj.type != 'MESH':
            continue
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.separate(type='MATERIAL')
        bpy.ops.object.mode_set(mode='OBJECT')
    entries = []
    matched = False
    for obj in list(bpy.context.scene.objects):
        if obj.type != 'MESH':
            continue
        obj.data.calc_loop_triangles()
        before = len(obj.data.loop_triangles)
        if not any(m.name == material_name for m in obj.data.materials):
            entries.append({'object': obj.name, 'before': before, 'after': before, 'preserved': True})
            continue
        matched = True
        if obj.find_armature() or obj.data.shape_keys:
            raise RuntimeError('Cannot simplify animated or morphing geometry: ' + obj.name)
        # Bake the instance transform for a metric comparison, keeping the source asset intact.
        mesh = obj.data.copy()
        mesh.transform(obj.matrix_world)
        source_points = [v.co.copy() for v in mesh.vertices]
        source_bounds = bounds(source_points)
        source_surface = surface(mesh)
        original_mesh = obj.data
        obj.data = mesh
        world = obj.matrix_world.copy()
        obj.matrix_world.identity()
        accepted = None
        for ratio in CANDIDATE_RATIOS:
            modifier = obj.modifiers.new('Scene surface simplification', 'DECIMATE')
            modifier.ratio = ratio
            modifier.use_collapse_triangulate = True
            evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
            reduced = bpy.data.meshes.new_from_object(evaluated)
            obj.modifiers.remove(modifier)
            points = [v.co for v in reduced.vertices]
            error = max(deviation(source_points, surface(reduced)), deviation(points, source_surface))
            edge_error = max(abs(a - b) for a, b in zip(source_bounds, bounds(points)))
            if max(error, edge_error) <= MAX_ERROR_METRES:
                accepted = reduced
                reduced.calc_loop_triangles()
                entries.append({'object': obj.name, 'before': before, 'after': len(reduced.loop_triangles), 'ratio': ratio, 'surfaceErrorMm': error * 1000, 'boundsErrorMm': edge_error * 1000})
                break
            bpy.data.meshes.remove(reduced)
        if accepted is None:
            raise RuntimeError('No candidate meets the 0.5 mm error budget: ' + obj.name)
        # Return to the original local coordinates, preserving every object transform.
        accepted.transform(world.inverted())
        obj.data = accepted
        obj.matrix_world = world
        bpy.data.meshes.remove(mesh)
        if original_mesh.users == 0:
            bpy.data.meshes.remove(original_mesh)
    if not matched:
        raise RuntimeError('Missing dense material: ' + material_name)
    target_path = ROOT / 'public/items' / destination
    bpy.ops.export_scene.gltf(filepath=str(target_path), export_format='GLB', export_animations=False)
    result = {'source': str(source_path), 'target': str(target_path), 'bytesBefore': source_path.stat().st_size, 'bytesAfter': target_path.stat().st_size, 'surfaces': entries}
    report.append(result)
    print(json.dumps(result), flush=True)
(ROOT / 'docs/household-geometry-optimization.json').write_text(json.dumps(report, indent=2) + '\n')
