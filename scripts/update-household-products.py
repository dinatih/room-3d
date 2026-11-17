"""Split cosmetic assets and correct clear-container materials.
Run: blender -b --python-exit-code 1 --python scripts/update-household-products.py
"""
from pathlib import Path
import copy
import json
import struct
import bpy
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[1]
ITEMS = ROOT / 'public/items'


def read_glb(path):
    data = path.read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20 + size]), data[20 + size:]


def write_glb(path, doc, rest):
    data = json.dumps(doc, separators=(',', ':')).encode()
    data += b' ' * (-len(data) % 4)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(struct.pack('<III', 0x46546C67, 2, 20 + len(data) + len(rest)) + struct.pack('<II', len(data), 0x4E4F534A) + data + rest)


def clear_material(mat, transmission, roughness, ior):
    mat['alphaMode'] = 'OPAQUE'
    mat['doubleSided'] = True
    pbr = mat['pbrMetallicRoughness']
    pbr['baseColorFactor'] = [.94, .97, 1, 1]
    pbr['metallicFactor'] = 0
    pbr['roughnessFactor'] = roughness
    mat['extensions'] = {'KHR_materials_transmission': {'transmissionFactor': transmission}, 'KHR_materials_ior': {'ior': ior}}


spray = ITEMS / 'transparent-spray-cleaner/TransparentSprayCleaner.glb'
doc, rest = read_glb(spray)
# Alpha blending plus transmission applied transparency twice in the source.
for mat in doc['materials']:
    if mat['name'] == 'Material':
        clear_material(mat, .72, .18, 1.46)
    elif mat['name'] == 'plastic lid':
        clear_material(mat, .5, .23, 1.46)
write_glb(spray, doc, rest)
# The dedicated Cif pump and photographed labels are generated separately by
# generate-cif-infinite-clean.py; do not overwrite them with the generic spray.

soap = ITEMS / 'tackan distributeur savon blanc/TACKAN distributeur savon blanc.glb'
doc, rest = read_glb(soap)
body = next(m for m in doc['materials'] if m['name'] == 'SimplygonCastMaterial_4')
clear_material(body, .65, .2, 1.5)
# The baked colour texture contains near-zero alpha; retain surface normals only.
body['pbrMetallicRoughness'].pop('baseColorTexture', None)
body['pbrMetallicRoughness'].pop('metallicRoughnessTexture', None)
body.pop('occlusionTexture', None)
for extension in ['KHR_materials_transmission', 'KHR_materials_ior']:
    if extension not in doc.setdefault('extensionsUsed', []):
        doc['extensionsUsed'].append(extension)
write_glb(soap, doc, rest)
# The scene loads a reduced variant; patch its same body material as well.
variant = soap.with_name(soap.stem + '-scene-512.glb')
scene_doc, scene_rest = read_glb(variant)
scene_doc['materials'] = copy.deepcopy(doc['materials'])
scene_doc['extensionsUsed'] = list(dict.fromkeys(scene_doc.get('extensionsUsed', []) + doc['extensionsUsed']))
write_glb(variant, scene_doc, scene_rest)


def bounds(objects):
    points = [o.matrix_world @ Vector(v) for o in objects for v in o.bound_box]
    return [Vector([f(p[i] for p in points) for i in range(3)]) for f in [min, max]]


manifest = []
for item, name, filename in [
    ('cream-jar', 'Body_Cream product', 'CreamJar.glb'),
    ('cream-pump', 'Lotion_Bottle_2 product', 'CreamPump.glb'),
    ('cream-bottle', 'Lotion_Bottle_1 product', 'CreamBottle.glb'),
    ('axe-deodorant', 'Deodorant_Spray product', 'AxeDeodorant.glb'),
]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(ITEMS / 'cosmetics-kit/CosmeticsKit.glb'))
    product = bpy.data.objects[name]
    product.data.transform(product.matrix_world)
    product.matrix_world = Matrix.Identity(4)
    lo, hi = bounds([product])
    product.data.transform(Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))))
    for obj in list(bpy.context.scene.objects):
        if obj != product:
            bpy.data.objects.remove(obj, do_unlink=True)
    if item == 'cream-pump':
        mat = next(m for m in product.data.materials if m.name == 'lotion container 2')
        bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        bsdf.inputs['Transmission Weight'].default_value = .55
    if item == 'axe-deodorant':
        for mat in product.data.materials:
            bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
            bsdf.inputs['Base Color'].default_value = (.012, .015, .018, 1)
            bsdf.inputs['Roughness'].default_value = .32
        bpy.ops.object.text_add(location=(0, -.016, .08), rotation=(1.57079632679, 0, 0))
        label = bpy.context.object
        label.data.body = 'AXE'
        label.data.align_x = 'CENTER'
        label.data.size = .012
        label.data.extrude = .00005
        label.data.materials.append(bpy.data.materials.new('AXE silver lettering'))
        bpy.ops.object.convert(target='MESH')
    bpy.ops.object.select_all(action='SELECT')
    folder = ITEMS / item
    folder.mkdir(exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(folder / filename), export_format='GLB', use_selection=True)
    lo, hi = bounds([product])
    dims = (hi - lo) * 100
    manifest.append({'id': item, 'glbPath': f'items/{item}/{filename}', 'dims': dict(zip(['w', 'd', 'h'], [round(dims.x, 2), round(dims.y, 2), round(dims.z, 2)]))})
(ROOT / 'scripts/cosmetic-products.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('PRODUCTS', json.dumps(manifest), flush=True)
import os
os._exit(0)
