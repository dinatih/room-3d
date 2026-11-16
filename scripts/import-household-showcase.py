"""Split householdshowcase.blend into 14 untextured inventory products.

blender -b --python-exit-code 1 --python scripts/import-household-showcase.py
Source: ~/3D Resources/others furniture/householdshowcase.blend
Missing source label textures are intentionally omitted, as requested.
The showcase has no usable real-world calibration: a common 0.05 scale
preserves relative product sizes (shampoo bottle approximately 22.5 cm high).
GLB exports use metres, centred X/Z, floor at Y=0. Source is never modified.
"""
from pathlib import Path
import json
import os
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / '3D Resources/others furniture/householdshowcase.blend'
OUT = ROOT / 'public/items/household-showcase'
OUT.mkdir(parents=True, exist_ok=True)
SCALE = .05
# Use the source's product collections; Table, References and Env are scenery.
PRODUCTS = [
    ('shampoo-pantene', 'Shampoo Pantene', 'Shampooing Pantene', 'Pantene', 'bathroom'),
    ('multipurpose-cleaner', 'MultiPurpose Cleaner', 'Nettoyant multi-usage', 'Mr Muscle', 'bathroom'),
    ('harpic-cleaner', 'Harpic Cleaner', 'Nettoyant WC Harpic', 'Harpic', 'bathroom'),
    ('redoxon', 'Redoxon', 'Boîte Redoxon', 'Redoxon', 'bathroom'),
    ('soda-bottle', 'Soda Bottle', 'Bouteille de soda', '', 'kitchen'),
    ('dettol', 'Detiol', 'Flacon Dettol', 'Dettol', 'bathroom'),
    ('reserva', 'Reserva', 'Bouteille Reserva', 'Reserva', 'kitchen'),
    ('lifebuoy', 'LifeBuoy', 'Flacon Lifebuoy', 'Lifebuoy', 'bathroom'),
    ('swensens', 'Swensens', 'Pot de glace Swensen’s', 'Swensen’s', 'kitchen'),
    ('chips', 'Chips', 'Sachet de chips', '', 'kitchen'),
    ('seeds', 'Seeds', 'Boîte de graines', '', 'kitchen'),
    ('spicy', 'Spicy', 'Boîte Spicy', '', 'kitchen'),
    ('soda-can', 'Soda Can', 'Canette de soda', '', 'kitchen'),
    ('guava', 'Guava', 'Bouteille de jus de goyave', '', 'kitchen'),
]


def bounds(objects):
    points = [obj.matrix_world @ Vector(p) for obj in objects for p in obj.bound_box]
    return (Vector(tuple(min(p[a] for p in points) for a in range(3))),
            Vector(tuple(max(p[a] for p in points) for a in range(3))))


bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
# Evaluate source modifiers once, including the detailed chips bag.
depsgraph = bpy.context.evaluated_depsgraph_get()
products = []
for key, collection_name, name, brand, category in PRODUCTS:
    collection = bpy.data.collections[collection_name]
    sources = [obj for obj in collection.all_objects if obj.type == 'MESH']
    if not sources:
        raise ValueError(f'Empty product collection: {collection_name}')
    meshes = []
    for source in sources:
        mesh = bpy.data.meshes.new_from_object(source.evaluated_get(depsgraph))
        mesh.transform(source.matrix_world)
        obj = bpy.data.objects.new(key, mesh)
        bpy.context.scene.collection.objects.link(obj)
        meshes.append(obj)
    lo, hi = bounds(meshes)
    transform = Matrix.Scale(SCALE, 4) @ Matrix.Translation(Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z)))
    mat = bpy.data.materials.new(key + ' untextured neutral surface')
    mat.diffuse_color = (.60, .62, .65, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = mat.diffuse_color
    bsdf.inputs['Roughness'].default_value = .45
    for obj in meshes:
        obj.data.transform(transform)
        obj.data.materials.clear()
        obj.data.materials.append(mat)
        for face in obj.data.polygons:
            face.material_index = 0
    products.append((key, name, brand, category, meshes))

all_products = [obj for _, _, _, _, meshes in products for obj in meshes]
for obj in list(bpy.context.scene.objects):
    if obj not in all_products:
        bpy.data.objects.remove(obj, do_unlink=True)
# Remove missing image datablocks: exports contain no broken references.
for image in list(bpy.data.images):
    bpy.data.images.remove(image)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.render.resolution_x = 500
scene.render.resolution_y = 500
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.color_depth = '8'
scene.render.image_settings.compression = 50
scene.world = bpy.data.worlds.new('Neutral preview world')
scene.world.color = (.22, .22, .22)
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.0001))
floor = bpy.context.object
floor.name = 'Preview floor'
floor_material = bpy.data.materials.new('Preview grey')
floor_material.diffuse_color = (.16, .17, .19, 1)
floor.data.materials.append(floor_material)
lamps = []
for direction, energy in [((-1.2, -1.8, 2), 140), ((1.5, .8, 1.3), 90)]:
    bpy.ops.object.light_add(type='AREA')
    lamp = bpy.context.object
    lamp.data.shape = 'DISK'
    lamps.append((lamp, Vector(direction), energy))
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.data.type = 'ORTHO'
scene.camera = camera

records = []
for key, name, brand, category, meshes in products:
    for obj in all_products:
        obj.hide_render = obj not in meshes
    bpy.ops.object.select_all(action='DESELECT')
    for obj in meshes:
        obj.select_set(True)
    glb = OUT / f'{key}.glb'
    bpy.ops.export_scene.gltf(filepath=str(glb), export_format='GLB', use_selection=True)
    lo, hi = bounds(meshes)
    size = hi - lo
    center = (hi + lo) / 2
    span = max(size)
    camera.data.ortho_scale = span * 1.5
    for lamp, direction, energy in lamps:
        lamp.location = center + direction * span
        lamp.rotation_euler = (center - lamp.location).to_track_quat('-Z', 'Y').to_euler()
        lamp.data.energy = energy * span ** 2
        lamp.data.size = span * 1.5
    photos = []
    for view, direction in [('front', (0, -2, .7)), ('three-quarter', (1.4, -2, 1)), ('back', (-1.3, 2, .85))]:
        camera.location = center + Vector(direction) * span
        camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
        image = OUT / f'{key}-{view}.png'
        scene.render.filepath = str(image)
        bpy.ops.render.render(write_still=True)
        photos.append(f'items/household-showcase/{image.name}')
    records.append({
        'id': f'household-{key}', 'name': name, 'brand': brand,
        'category': category, 'qty': 1,
        'dims': {'w': round(size.x * 100, 2), 'd': round(size.y * 100, 2), 'h': round(size.z * 100, 2)},
        'glbPath': f'items/household-showcase/{glb.name}',
        'photos': [photos[1], photos[0], photos[2]],
        'url': 'https://www.cgtrader.com/3d-models/interior/kitchen/generic-house-hold-items',
        'notes': 'Extrait de householdshowcase.blend. Sans textures d’étiquettes, conformément au choix utilisateur. Surface neutre ; dimensions estimées, proportions du modèle conservées.',
    })
    print('EXPORTED', key, str(glb), flush=True)
(ROOT / 'src/features/inventory/householdShowcaseItems.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print('ALL 14 PRODUCTS EXPORTED', flush=True)
# Local Blender audio backends can hang at shutdown; all outputs are closed.
os._exit(0)
