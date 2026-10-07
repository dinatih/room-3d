"""Bake a continuous right shoulder/chest tattoo, masked by the dressed top."""
from pathlib import Path
import importlib.util
import sys
sys.dont_write_bytecode = True
import bpy
import bmesh
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'public/characters/lara'
spec = importlib.util.spec_from_file_location('limbs', ROOT / 'scripts/separate_lara_limb_uvs.py')
limbs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(limbs)
bpy.ops.wm.open_mainfile(filepath=str(FOLDER / 'lara_perfect.blend'))

# Isolate anatomical sides on both torsos before baking an asymmetric design.
for name in ('body_torso', 'body_nude_torso'):
    obj = bpy.data.objects[name]
    migrated = obj.get(limbs.MARKER) == limbs.LAYOUT
    obj.data = obj.data.copy()
    nude = name == 'body_nude_torso'
    # Some source polygons cross the midline. Classify the exported triangles,
    # rather than assigning all triangles from a polygon to its centroid side.
    for face in obj.data.polygons:
        tile = limbs.side(obj, face)
        for i in face.loop_indices:
            uv = obj.data.uv_layers.active.data[i].uv
            uv.x = uv.x * 2 - tile if migrated else uv.x * (2 if nude else 1)
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    bmesh.ops.triangulate(mesh, faces=list(mesh.faces))
    mesh.to_mesh(obj.data)
    mesh.free()
    for face in obj.data.polygons:
        tile = limbs.side(obj, face)
        for i in face.loop_indices:
            uv = obj.data.uv_layers.active.data[i].uv
            uv.x = (uv.x + tile) / 2
    if not nude and not migrated:
        for index, original in enumerate(list(obj.data.materials)):
            material = original.copy()
            obj.data.materials[index] = material
            for node in material.node_tree.nodes:
                if node.type != 'TEX_IMAGE' or not node.image:
                    continue
                image = node.image
                width, height = image.size
                assert width == 512 and height == 512
                pixels = np.array(image.pixels[:], dtype=np.float32).reshape(height,width,4)
                atlas = bpy.data.images.new(image.name + '_torso_sides', width=width*2, height=height, alpha=True)
                atlas.colorspace_settings.name = image.colorspace_settings.name
                atlas.pixels.foreach_set(np.concatenate((pixels,pixels),axis=1).ravel())
                atlas.filepath_raw = str(FOLDER/'textures'/'8001_torso_sides.png')
                atlas.file_format = 'PNG'
                atlas.save()
                atlas.filepath = '//textures/8001_torso_sides.png'
                atlas.pack()
                node.image = atlas
    obj[limbs.MARKER] = limbs.LAYOUT

# The square design spans 23 cm, from the shoulder cap to the upper breast.
LEFT, RIGHT, BOTTOM, TOP = -.24, -.01, 1.30, 1.53
shirt = bpy.data.objects['shirt']
shirt.data.calc_loop_triangles()
shirt_vertices = [shirt.matrix_world @ v.co for v in shirt.data.vertices]
shirt_tree = BVHTree.FromPolygons(shirt_vertices, [tuple(t.vertices) for t in shirt.data.loop_triangles], all_triangles=True)
front = min(p.y for p in shirt_vertices)
back = max(p.y for p in shirt_vertices)
ray_origin_y = front - (back - front)
midline_y = bpy.data.objects['Armature'].data.bones['spine_upper'].head_local.y

for name in ('arms', 'body_torso', 'body_nude_torso'):
    obj = bpy.data.objects[name]
    obj.data.calc_loop_triangles()
    uv = obj.data.uv_layers.active.data
    total = 0
    hidden = 0
    for material_index in sorted({f.material_index for f in obj.data.polygons}):
        material = obj.data.materials[material_index]
        image = next(n.image for n in material.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image)
        width, height = image.size
        pixels = np.zeros((height, width, 4), dtype=np.uint8)
        for tri in obj.data.loop_triangles:
            if obj.data.polygons[tri.polygon_index].material_index != material_index:
                continue
            a, b, c = [obj.matrix_world @ obj.data.vertices[i].co for i in tri.vertices]
            if min(p.x for p in (a,b,c)) > RIGHT or max(p.x for p in (a,b,c)) < LEFT:
                continue
            if min(p.z for p in (a,b,c)) > TOP or max(p.z for p in (a,b,c)) < BOTTOM:
                continue
            target = np.array([(uv[i].uv.x * width, (1-uv[i].uv.y)*height) for i in tri.loops])
            matrix = np.column_stack((target[1]-target[0], target[2]-target[0]))
            if np.linalg.det(matrix) == 0:
                continue
            low = np.maximum(np.floor(target.min(axis=0)).astype(int), 0)
            high = np.minimum(np.ceil(target.max(axis=0)).astype(int), (width,height))
            xs, ys = np.meshgrid(np.arange(low[0],high[0]), np.arange(low[1],high[1]))
            coords = np.column_stack((xs.ravel()+.5,ys.ravel()+.5))
            weights = (coords-target[0]) @ np.linalg.inv(matrix).T
            inside = (weights[:,0]>=0)&(weights[:,1]>=0)&(weights.sum(axis=1)<=1)
            for pixel, weight in zip(coords[inside],weights[inside]):
                point = a+(b-a)*float(weight[0])+(c-a)*float(weight[1])
                if not (LEFT <= point.x < RIGHT and BOTTOM < point.z <= TOP and point.y < midline_y):
                    continue
                # The clothed torso also has baked strap pixels. Use the real
                # garment surface to keep all ink underneath those straps.
                if name == 'body_torso':
                    hit, normal, index, distance = shirt_tree.ray_cast(Vector((point.x,ray_origin_y,point.z)), Vector((0,1,0)))
                    if hit is not None and hit.y <= point.y + 2**-17:
                        hidden += 1
                        continue
                sx = int((point.x-LEFT)/(RIGHT-LEFT)*512)
                sy = int((TOP-point.z)/(TOP-BOTTOM)*512)
                x, y = pixel.astype(int)
                pixels[y,x] = (sx & 255, (sx >> 8)|((sy & 63)<<2), sy >> 6, 255)
                total += 1
        filename = f'{name}_{material_index}_shoulder_tattoo_uv.png'
        limbs.png_rgba(FOLDER/'textures'/filename, pixels)
        if 'lara_delphina_shoulder_projection' not in material:
            material = material.copy()
            obj.data.materials[material_index] = material
        material['lara_delphina_shoulder_projection'] = filename
    assert total, f'No shoulder skin mapped on {name}'
    if name == 'body_torso':
        assert hidden, 'The dressed shoulder must mask the strap'
    print('Shoulder projection',name,total,'skin texels;',hidden,'clothing texels masked',flush=True)
    obj['lara_delphina_shoulder_bounds'] = [LEFT,RIGHT,BOTTOM,TOP]

# Keep Sara's neck projection consistent with the new anatomical torso UVs.
torso = bpy.data.objects['body_nude_torso']
reference = limbs.tattoo_reference('body_torso')
for index in sorted({face.material_index for face in torso.data.polygons}):
    filename = f'body_nude_torso_{index}_neck_tattoo_uv.png'
    limbs.bake_projection(torso,index,reference,FOLDER/'textures'/filename)
    torso.data.materials[index]['lara_sara_tattoo_projection'] = filename

bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
limbs.export()
