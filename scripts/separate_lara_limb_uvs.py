"""Blender: inspect, migrate and export Lara's independent limb UVs.

blender -b --python scripts/separate_lara_limb_uvs.py -- --inspect
blender -b --python scripts/separate_lara_limb_uvs.py
blender -b --python scripts/separate_lara_limb_uvs.py -- --verify
"""
from pathlib import Path
import json
import sys
import struct
import zlib
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'public/characters/lara'
SOURCE = FOLDER / 'lara_perfect.blend'
TARGETS = ('arms', 'body_legs', 'fingers', 'body_nude_legs', 'body_nude_hands', 'body_nude_feet')
MARKER = 'lara_limb_uv_layout'
LAYOUT = 'left-right-v1'


def side(obj, face):
    # In this source, anatomical left is positive X in the rest pose.
    x = sum((obj.matrix_world @ obj.data.vertices[i].co).x for i in face.vertices)
    if x == 0:
        raise ValueError(f'{obj.name}: face {face.index} lies on the midline')
    return 0 if x > 0 else 1


def inspect():
    print('LEFT BONE', tuple(bpy.data.objects['Armature'].data.bones['leg_left_thigh'].head_local), flush=True)
    for name in TARGETS:
        obj = bpy.data.objects[name]
        uv = obj.data.uv_layers.active.data
        for mi, mat in enumerate(obj.data.materials):
            faces = [f for f in obj.data.polygons if f.material_index == mi]
            if not faces:
                continue
            loops = [uv[i].uv for f in faces for i in f.loop_indices]
            print('PART', name, mi, mat.name, 'faces', len(faces), 'UV pixels', (min(v.x for v in loops)*512,max(v.x for v in loops)*512,min(1-v.y for v in loops)*512,max(1-v.y for v in loops)*512), flush=True)
    # Derivatives at existing tattoo centers: canvas x/y -> Blender xyz.
    for name, pixel in [('arms',(240,205)),('body_legs',(122,408))]:
        obj=bpy.data.objects[name]; uv=obj.data.uv_layers.active.data
        point=Vector((pixel[0]/512,1-pixel[1]/512))
        for tri in obj.data.loop_triangles:
            if side(obj, obj.data.polygons[tri.polygon_index]) != 0:
                continue
            a,b,c=[uv[i].uv.copy() for i in tri.loops]
            matrix=np.array([[b.x-a.x,c.x-a.x],[b.y-a.y,c.y-a.y]])
            if np.linalg.det(matrix)==0:
                continue
            weights=np.linalg.solve(matrix,np.array([point.x-a.x,point.y-a.y]))
            if min(weights)>=0 and sum(weights)<=1:
                pa,pb,pc=[np.array(obj.data.vertices[i].co[:]) for i in tri.vertices]
                deriv=np.column_stack((pb-pa,pc-pa))@np.linalg.inv(matrix)
                print('TATTOO',name,'position',pa+weights[0]*(pb-pa)+weights[1]*(pc-pa),'canvas_dx',deriv[:,0]/512,'canvas_dy',-deriv[:,1]/512,flush=True)
                break


def verify():
    assert bpy.context.scene.get(MARKER) == LAYOUT
    left = bpy.data.objects['Armature'].data.bones['leg_left_thigh'].head_local.x
    assert left > 0, 'Unexpected anatomical axes'
    for name in TARGETS:
        obj = bpy.data.objects[name]
        assert obj.get(MARKER) == LAYOUT
        uv = obj.data.uv_layers.active.data
        for face in obj.data.polygons:
            tile = side(obj, face)
            assert all(tile / 2 <= uv[i].uv.x <= (tile + 1) / 2 for i in face.loop_indices), (name, face.index)
        for mat in obj.data.materials:
            if not mat or not mat.node_tree:
                continue
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    assert node.image.packed_file, (name, node.image.name)
                    assert node.image.size[0] == node.image.size[1] * 2
    print('Verified: independent anatomical left/right UVs; all limb atlases packed.', flush=True)


def migrate():
    if bpy.context.scene.get(MARKER) == LAYOUT:
        verify()
        return
    assert bpy.data.objects['Armature'].data.bones['leg_left_thigh'].head_local.x > 0
    reference = tattoo_reference()
    atlases = {}
    materials = {}
    manifest = {}
    for name in TARGETS:
        obj = bpy.data.objects[name]
        obj.data = obj.data.copy()
        for face in obj.data.polygons:
            tile = side(obj, face)
            for i in face.loop_indices:
                obj.data.uv_layers.active.data[i].uv.x = (obj.data.uv_layers.active.data[i].uv.x + tile) / 2
        for index, original in enumerate(list(obj.data.materials)):
            if original is None:
                continue
            material_key = (original.name, name if name.startswith('body_nude') else '')
            if material_key not in materials:
                mat = original.copy()
                mat.name = original.name + '_limbs' + ('_' + name if name.startswith('body_nude') else '')
                for node in mat.node_tree.nodes:
                    if node.type != 'TEX_IMAGE' or not node.image:
                        continue
                    image = node.image
                    if image.name not in atlases:
                        width, height = image.size[:]
                        assert width and height, image.name
                        pixels = np.empty(width * height * 4, dtype=np.float32)
                        image.pixels.foreach_get(pixels)
                        pixels = pixels.reshape(height, width, 4)
                        atlas = bpy.data.images.new(image.name + '_limbs', width=width*2, height=height, alpha=True)
                        atlas.colorspace_settings.name = image.colorspace_settings.name
                        atlas.pixels.foreach_set(np.concatenate((pixels,pixels),axis=1).ravel())
                        filename = image.name.replace('.', '_') + '_limbs.png'
                        atlas.filepath_raw = str(FOLDER / 'textures' / filename)
                        atlas.file_format = 'PNG'
                        atlas.save()
                        atlas.filepath = '//textures/' + filename
                        atlas.pack()
                        atlases[image.name] = atlas
                        manifest[image.name] = filename
                    node.image = atlases[image.name]
                    mat['lara_limb_base_image'] = image.name
                    if name.startswith('body_nude') and image.name.startswith('8001') and any(f.material_index == index for f in obj.data.polygons):
                        filename = f'{name}_{index}_tattoo_uv.png'
                        bake_projection(obj, index, reference, FOLDER / 'textures' / filename)
                        mat['lara_tattoo_projection'] = filename
                materials[material_key] = mat
            obj.data.materials[index] = materials[material_key]
        obj[MARKER] = LAYOUT
    bpy.context.scene[MARKER] = LAYOUT
    (FOLDER / 'textures/limb-atlases.json').write_text(json.dumps(manifest, indent=2) + '\n')
    bpy.ops.file.pack_all()
    verify()
    write_uv_guide()
    # Keep the user's existing .blend1 untouched.
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))


def tattoo_reference():
    obj = bpy.data.objects['body_legs']
    obj.data.calc_loop_triangles()
    uv = obj.data.uv_layers.active.data
    references = []
    for tile in (0, 1):
        triangles = [t for t in obj.data.loop_triangles if side(obj, obj.data.polygons[t.polygon_index]) == tile]
        vertices = [obj.matrix_world @ obj.data.vertices[i].co for t in triangles for i in t.vertices]
        coords = [[uv[i].uv.copy() for i in t.loops] for t in triangles]
        if obj.get(MARKER) == LAYOUT:
            for triangle in coords:
                for coord in triangle:
                    coord.x = coord.x * 2 - tile
        references.append((BVHTree.FromPolygons(vertices, [(i,i+1,i+2) for i in range(0,len(vertices),3)], all_triangles=True), vertices, coords))
    return references


def png_rgba(path, pixels):
    height, width, _ = pixels.shape
    def chunk(kind, data):
        return struct.pack('>I',len(data)) + kind + data + struct.pack('>I',zlib.crc32(kind+data) & 0xffffffff)
    raw = b''.join(b'\0' + row.tobytes() for row in pixels)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR',struct.pack('>IIBBBBB',width,height,8,6,0,0,0)) + chunk(b'IDAT',zlib.compress(raw)) + chunk(b'IEND',b''))


def bake_projection(obj, material_index, references, path):
    # Data texture: RGBA stores source pixel X (10 bits), Y (9 bits), and coverage.
    # This samples nearest points on the original leg surface, including UV seams.
    width, height = 1024, 512
    pixels = np.zeros((height,width,4),dtype=np.uint8)
    uv = obj.data.uv_layers.active.data
    obj.data.calc_loop_triangles()
    count = 0
    for tri in obj.data.loop_triangles:
        face = obj.data.polygons[tri.polygon_index]
        if face.material_index != material_index:
            continue
        tile = side(obj, face)
        tree, vertices, source_uv = references[tile]
        target_uv = np.array([(uv[i].uv.x*width,(1-uv[i].uv.y)*height) for i in tri.loops])
        origin = target_uv[0]
        matrix = np.column_stack((target_uv[1]-origin,target_uv[2]-origin))
        if np.linalg.det(matrix) == 0:
            continue  # Zero-area UV triangles cover no texels.
        inverse = np.linalg.inv(matrix)
        low = np.maximum(np.floor(target_uv.min(axis=0)).astype(int),0)
        high = np.minimum(np.ceil(target_uv.max(axis=0)).astype(int),(width,height))
        if np.any(high <= low):
            continue
        xs,ys = np.meshgrid(np.arange(low[0],high[0]),np.arange(low[1],high[1]))
        coords = np.column_stack((xs.ravel()+0.5,ys.ravel()+0.5))
        weights = (coords-origin) @ inverse.T
        inside = (weights[:,0]>=0) & (weights[:,1]>=0) & (weights.sum(axis=1)<=1)
        a,b,c = [obj.matrix_world @ obj.data.vertices[i].co for i in tri.vertices]
        for pixel, weight in zip(coords[inside],weights[inside]):
            point = a + (b-a)*float(weight[0]) + (c-a)*float(weight[1])
            nearest,normal,index,distance = tree.find_nearest(point)
            if index is None:
                raise ValueError(f'No reference surface for {obj.name}')
            ra,rb,rc = vertices[index*3:index*3+3]
            edges = np.column_stack((np.array(rb-ra),np.array(rc-ra)))
            bary = np.linalg.lstsq(edges,np.array(nearest-ra),rcond=None)[0]
            ua,ub,uc = source_uv[index]
            source = ua + (ub-ua)*float(bary[0]) + (uc-ua)*float(bary[1])
            sx = min(width-1,max(0,int((source.x+tile)*width/2)))
            sy = min(height-1,max(0,int((1-source.y)*height)))
            x,y = pixel.astype(int)
            pixels[y,x] = (sx & 255, (sx >> 8) | ((sy & 63) << 2), sy >> 6, 255)
            count += 1
    assert count, f'Empty projection: {obj.name}, {material_index}'
    png_rgba(path,pixels)
    print('Baked tattoo UV projection',path.name,count,'texels',flush=True)


def write_uv_guide():
    # Export UV edges at the exact atlas pixel coordinates, without editing the skin.
    colors = {'arms':'#ef4444','body_legs':'#2563eb','fingers':'#16a34a'}
    lines = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 552">',
        '<rect width="1024" height="552" fill="white"/>',
        '<image href="8001_limbs.png" width="1024" height="512"/>']
    for name,color in colors.items():
        obj=bpy.data.objects[name]; uv=obj.data.uv_layers.active.data
        edges=set()
        for face in obj.data.polygons:
            loops=list(face.loop_indices)
            for i,j in zip(loops,loops[1:]+loops[:1]):
                a,b=uv[i].uv,uv[j].uv
                edges.add(tuple(sorted(((round(a.x*1024,2),round((1-a.y)*512,2)),(round(b.x*1024,2),round((1-b.y)*512,2))))))
        path=' '.join(f'M{a[0]},{a[1]}L{b[0]},{b[1]}' for a,b in edges)
        lines.append(f'<path d="{path}" fill="none" stroke="{color}" stroke-width="0.4"/>')
    lines += ['<path d="M512,0V512" stroke="black"/>',
        '<text x="256" y="532" text-anchor="middle">GAUCHE anatomique</text>',
        '<text x="768" y="532" text-anchor="middle">DROITE anatomique</text>',
        '<text x="512" y="549" text-anchor="middle">Rouge : bras — Bleu : jambes — Vert : doigts</text>', '</svg>']
    (FOLDER/'textures/limb-uv-guide.svg').write_text('\n'.join(lines)+'\n')


def export():
    verify()
    bpy.ops.export_scene.gltf(filepath=str(FOLDER / 'lara_native.glb'), export_format='GLB',
        use_selection=False, export_apply=False, export_skins=True, export_morph=True,
        export_animations=True, export_yup=True, export_extras=True)


if __name__ == '__main__':
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    if '--inspect' in args:
        inspect()
    elif '--verify' in args:
        verify()
    else:
        migrate()
        export()
