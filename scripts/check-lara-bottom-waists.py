"""Check exported Sol High waist edges against the native bikini, in metres.

blender -b -t 2 --python-exit-code 1 --python scripts/check-lara-bottom-waists.py
"""
from pathlib import Path
import sys
import bpy
import bmesh
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.lara_outfits.common import BLEND_PATH, OUT_DIR
from scripts.lara_outfits.sol_high_bottoms import STYLES

bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
reference = max(v.co.z for v in bpy.data.objects['bikini_bottom'].data.vertices)
print(f'Native bikini uppermost waist: {reference:.6f} m')
quantization = bpy.ops.export_scene.gltf.get_rna_type().properties['export_draco_position_quantization'].default
for garment_id, spec in STYLES.items():
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(Path(OUT_DIR)/spec[0]))
    imported = set(bpy.data.objects)-before
    bm = bmesh.new()
    for obj in imported:
        if obj.type == 'MESH': bm.from_mesh(obj.data)
    # Two quantization steps cover independently compressed material seams.
    extent = max(max(v.co[i] for v in bm.verts)-min(v.co[i] for v in bm.verts) for i in range(3))
    tolerance = 2*extent/(2**quantization-1)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=tolerance)
    boundary = {e for e in bm.edges if e.is_boundary}
    openings = []
    while boundary:
        vertices = set(boundary.pop().verts)
        pending = list(vertices)
        while pending:
            v = pending.pop()
            for edge in v.link_edges:
                if edge in boundary:
                    boundary.remove(edge)
                    neighbour = edge.other_vert(v)
                    vertices.add(neighbour)
                    pending.append(neighbour)
        openings.append([v.co.z for v in vertices])
    assert len(openings) == 3, (garment_id, len(openings))
    waist = max(openings, key=lambda zs: sum(zs)/len(zs))
    assert min(waist) >= reference-tolerance, (garment_id,min(waist),reference)
    print(f'PASS {garment_id}: complete waist {min(waist):.6f}..{max(waist):.6f} m >= {reference:.6f} m (Draco tolerance {tolerance:.8f} m)')
    bm.free()
    for obj in imported: bpy.data.objects.remove(obj,do_unlink=True)
