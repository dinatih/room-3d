import bpy
from pathlib import Path
from collections import defaultdict

bpy.ops.wm.read_factory_settings(use_empty=True)
source = next(Path('public/items').glob('lagan réfrigérateur*/*.glb'))
bpy.ops.import_scene.gltf(filepath=str(source.resolve()))
for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH':
        continue
    mesh = obj.data
    # Connect coincident seam vertices without changing source geometry.
    adjacency = defaultdict(set)
    by_position = defaultdict(list)
    for v in mesh.vertices:
        by_position[tuple(round(c, 5) for c in v.co)].append(v.index)
    for ids in by_position.values():
        for i in ids:
            adjacency[i].update(ids)
    for edge in mesh.edges:
        a, b = edge.vertices
        adjacency[a].add(b)
        adjacency[b].add(a)
    remaining = set(range(len(mesh.vertices)))
    components = []
    while remaining:
        todo = [min(remaining)]
        ids = set()
        while todo:
            i = todo.pop()
            if i in ids:
                continue
            ids.add(i)
            todo.extend(adjacency[i] - ids)
        remaining -= ids
        coords = [obj.matrix_world @ mesh.vertices[i].co for i in ids]
        lo = [min(v[a] for v in coords) for a in range(3)]
        hi = [max(v[a] for v in coords) for a in range(3)]
        components.append(ids)
        materials = sorted({p.material_index for p in mesh.polygons if p.vertices[0] in ids})
        print('PART', len(components)-1, 'vertices',len(ids),'min', [round(c,5) for c in lo], 'max', [round(c,5) for c in hi], 'materials',materials)
    print('OBJECT', obj.name, 'materials',[(m.name if m else None) for m in mesh.materials], 'components',len(components))
