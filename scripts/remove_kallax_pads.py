"""Remove isolated bottom pads without welding or changing the cabinet mesh.

Run: blender --background --python scripts/remove_kallax_pads.py
"""
from pathlib import Path
import bpy
import bmesh
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[1]
MODELS = {
    '20301554': None,  # The one-cell model has no separate bottom pads.
    '90301555': 0.0061,
    '20275814': 0.0031,
}


def pad_vertices(obj, max_height):
    """Find connected pieces, treating duplicated UV seam vertices as connected."""
    mesh = obj.data
    parents = list(range(len(mesh.vertices)))

    def find(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i

    def union(a, b):
        parents[find(a)] = find(b)

    tree = KDTree(len(mesh.vertices))
    for v in mesh.vertices:
        tree.insert(v.co, v.index)
    tree.balance()
    for v in mesh.vertices:
        for _, index, _ in tree.find_range(v.co, 0.00001):
            union(v.index, index)
    for edge in mesh.edges:
        union(*edge.vertices)
    components = {}
    for v in mesh.vertices:
        components.setdefault(find(v.index), []).append(v.index)
    pads = []
    for indices in components.values():
        coords = [obj.matrix_world @ mesh.vertices[i].co for i in indices]
        low = [min(v[i] for v in coords) for i in range(3)]
        high = [max(v[i] for v in coords) for i in range(3)]
        # Four small isolated pieces at floor level, away from the centre.
        if (high[2] <= max_height and low[2] < 0.0001
                and 0.01 < high[0] - low[0] < 0.06
                and 0.01 < high[1] - low[1] < 0.06
                and abs((low[0] + high[0]) / 2) > 0.25):
            pads.append(indices)
    return pads


for article, height in MODELS.items():
    path = ROOT / 'public' / 'items' / f'kallax{article}' / f'Kallax{article}.glb'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    obj, = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    if height is None:
        print(f'{article}: inspected; no separate pads, left unchanged')
        continue
    pads = pad_vertices(obj, height)
    if not pads:  # Allows rerunning on already cleaned assets.
        print(f'{article}: no pads found, left unchanged')
        continue
    assert len(pads) == 4, f'{article}: expected four pads, found {len(pads)}'
    indices = {i for pad in pads for i in pad}
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[bm.verts[i] for i in indices], context='VERTS')
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()
    # Preserve coordinates, UV seams, normals, materials and the original origin.
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format='GLB', export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
    )
    print(f'{article}: removed four pads ({len(indices)} vertices)')
