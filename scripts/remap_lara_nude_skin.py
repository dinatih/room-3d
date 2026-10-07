"""Transfer clean, authored skin UVs onto the assembled nude body's patches.

ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/remap_lara_nude_skin.py
npm run optimize:glb
"""
from pathlib import Path
import importlib.util
import sys
sys.dont_write_bytecode = True
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'public/characters/lara'
SOURCE = FOLDER / 'lara_perfect.blend'
MARKER = 'lara_clean_nude_skin'
VERSION = 'continuous-authored-skin-transfer-v7'


def clean_triangle(coords, occupied):
    """A reference UV triangle must sample skin, not empty atlas background."""
    width,height = occupied.shape[1],occupied.shape[0]
    points = np.array([(u*width,(1-v)*height) for u,v in coords])
    if np.any(points<0) or np.any(points>np.array((width,height))):
        return False
    matrix = np.column_stack((points[1]-points[0],points[2]-points[0]))
    low = np.maximum(np.floor(points.min(axis=0)).astype(int),0)
    high = np.minimum(np.ceil(points.max(axis=0)).astype(int),(width,height))
    if np.linalg.det(matrix) == 0 or np.any(high<=low):
        return False
    xs,ys = np.meshgrid(np.arange(low[0],high[0]),np.arange(low[1],high[1]))
    pixels = np.column_stack((xs.ravel()+0.5,ys.ravel()+0.5))
    weights = (pixels-points[0]) @ np.linalg.inv(matrix).T
    inside = (weights[:,0]>=0)&(weights[:,1]>=0)&(weights.sum(axis=1)<=1)
    if not np.any(inside):
        # Sub-texel UV triangles still have an explicitly sampled centroid.
        x,y = np.minimum((points.mean(axis=0)).astype(int),(width-1,height-1))
        return bool(occupied[y,x])
    return bool(np.all(occupied[ys.ravel()[inside],xs.ravel()[inside]]))


def canonical_uv(obj, tri):
    uv = obj.data.uv_layers.active.data
    tile = limb.side(obj,obj.data.polygons[tri.polygon_index]) if obj.get(limb.MARKER)==limb.LAYOUT else None
    return [Vector((uv[i].uv.x*2-tile,uv[i].uv.y)) if tile is not None else uv[i].uv.copy() for i in tri.loops]


def material(original, atlas, name):
    copy = original.copy()
    copy.name = name
    for node in copy.node_tree.nodes:
        if node.type == 'TEX_IMAGE' and node.image:
            node.image = atlas
    copy['lara_limb_base_image'] = '8001.png.005'
    return copy


def main():
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    input_path = Path(args[1]) if args and args[0]=='--reference' else SOURCE
    bpy.ops.wm.open_mainfile(filepath=str(input_path))
    if bpy.context.scene.get(MARKER)==VERSION:
        limb.verify()
        limb.export()
        return
    atlas = bpy.data.images.load(str(FOLDER/'textures/8001_png_005_limbs.png'),check_existing=False)
    assert tuple(atlas.size)==(1024,512)
    pixels = np.empty(1024*512*4,dtype=np.float32)
    atlas.pixels.foreach_get(pixels)
    pixels = pixels.reshape(512,1024,4)[::-1,:512]
    occupied = np.any(pixels[:,:,:3]!=0,axis=2)&(pixels[:,:,3]!=0)
    objects = [bpy.data.objects[name] for name in ('body_nude_torso','body_nude_legs','body_nude_panties')]
    authored = {}
    for obj in objects[:2]:
        obj.data.calc_loop_triangles()
        good_faces = {f.index:True for f in obj.data.polygons}
        for tri in obj.data.loop_triangles:
            coords = canonical_uv(obj,tri)
            if not clean_triangle(coords,occupied):
                good_faces[tri.polygon_index] = False
                continue
        authored[obj.name] = good_faces
    # The untouched HSH source provides the UVs omitted by the assembled body.
    with bpy.data.libraries.load(str(FOLDER/'Lara_mix.blend'), link=False) as (available, loaded):
        loaded.objects = ['5_Body_1_0_0.004']
    source = loaded.objects[0]
    assert source is not None, 'Original HSH skin mesh is missing'
    source.data.calc_loop_triangles()
    vertices, reference_uv, triangles = [], [], []
    for tri in source.data.loop_triangles:
        coords = [source.data.uv_layers.active.data[i].uv.copy() for i in tri.loops]
        if not clean_triangle(coords, occupied):
            continue
        offset = len(vertices)
        # Imported mesh coordinates match the assembled body's rest coordinates.
        vertices.extend(source.data.vertices[i].co.copy() for i in tri.vertices)
        triangles.append((offset, offset+1, offset+2))
        reference_uv.append(coords)
    bpy.data.objects.remove(source, do_unlink=True)
    assert triangles, 'No authored clean skin UV triangles available'
    tree = BVHTree.FromPolygons(vertices,triangles,all_triangles=True)
    # Group triangles by their authored UV edges. Front/back seams stay separate,
    # while neighboring triangles share one continuous interpolation domain.
    parent = list(range(len(triangles)))
    def root(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index
    edges_seen = {}
    for index, coords in enumerate(reference_uv):
        for corner in range(3):
            edge = tuple(sorted((tuple(coords[corner]), tuple(coords[(corner+1)%3]))))
            if edge in edges_seen:
                parent[root(index)] = root(edges_seen[edge])
            else:
                edges_seen[edge] = index
    charts = {}
    for index in range(len(triangles)):
        charts.setdefault(root(index), []).append(index)
    chart_trees = {
        key: BVHTree.FromPolygons(vertices, [triangles[i] for i in indices], all_triangles=True)
        for key, indices in charts.items()
    }
    print('Clean authored skin reference:',len(triangles),'triangles;',len(charts),'UV charts',flush=True)
    for obj in objects:
        split = obj.get(limb.MARKER)==limb.LAYOUT
        uv = obj.data.uv_layers.active.data
        changed = 0
        for face in obj.data.polygons:
            keep = authored.get(obj.name,{}).get(face.index,False)
            tile = limb.side(obj,face) if split else 0
            if keep:
                if not split:
                    for loop in face.loop_indices:
                        uv[loop].uv.x /= 2
                continue
            # Choose the authored chart once, then project each vertex onto its
            # own source triangle. Clamping a whole face to one triangle used to
            # collapse UVs at its edges and produce the visible color patches.
            nearest,normal,index,distance = tree.find_nearest(obj.matrix_world @ face.center)
            assert index is not None, f'No skin reference for {obj.name}:{face.index}'
            chart = root(index)
            for loop in face.loop_indices:
                point = obj.matrix_world @ obj.data.vertices[obj.data.loops[loop].vertex_index].co
                projected, normal, local_index, distance = chart_trees[chart].find_nearest(point)
                assert local_index is not None, f'No UV chart projection for {obj.name}:{loop}'
                source_index = charts[chart][local_index]
                a,b,c = [vertices[i] for i in triangles[source_index]]
                edges = np.column_stack((np.array(b-a),np.array(c-a)))
                ua,ub,uc = reference_uv[source_index]
                bary = np.linalg.lstsq(edges,np.array(projected-a),rcond=None)[0]
                coord = ua+(ub-ua)*float(bary[0])+(uc-ua)*float(bary[1])
                uv[loop].uv = ((coord.x+tile)/2,coord.y)
            changed += 1
        for index in sorted({f.material_index for f in obj.data.polygons}):
            obj.data.materials[index] = material(obj.data.materials[index],atlas,f'Lara_Clean_Skin_{obj.name}_{index}')
        print('Remapped',obj.name,changed,'faces; preserved authored skin elsewhere',flush=True)
    atlas.pack()
    atlas.filepath = '//textures/8001_png_005_limbs.png'
    legs = bpy.data.objects['body_nude_legs']
    reference = limb.tattoo_reference()
    # Tattoos occupy the leg skin; the added hip band has no tattoo projection.
    filename = 'body_nude_legs_0_tattoo_uv.png'
    limb.bake_projection(legs,0,reference,FOLDER/'textures'/filename)
    legs.data.materials[0]['lara_tattoo_projection'] = filename
    if 'lara_tattoo_projection' in legs.data.materials[2]:
        del legs.data.materials[2]['lara_tattoo_projection']
    bpy.context.scene[MARKER] = VERSION
    bpy.ops.file.pack_all()
    limb.verify()
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
    limb.export()


spec = importlib.util.spec_from_file_location('lara_limb_uvs',ROOT/'scripts/separate_lara_limb_uvs.py')
limb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(limb)
if __name__=='__main__':
    main()
