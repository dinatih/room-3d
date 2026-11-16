"""Import the user's household items and red hats, including offline previews.

blender -b --python-exit-code 1 --python scripts/import-household-inventory.py
Sources: ~/3D Resources/others furniture (original files are never modified).
Optional item selection: append -- bob-red cap-red
GLBs use metres, +Y up, centred X/Z and grounded. Uncalibrated product
sources are resized to plausible household dimensions, recorded in inventory notes.
"""
from pathlib import Path
import json
import math
import subprocess
import sys
import tempfile
import zipfile
import bpy
import numpy as np
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCES = Path.home() / '3D Resources/others furniture'
WORK = Path(tempfile.mkdtemp(prefix='room-inventory-import-'))


def unzip(source, destination):
    destination.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(source) as archive:
        archive.extractall(destination)


unzip(SOURCES / 'Spray+cleaner.zip', WORK / 'spray')
unzip(SOURCES / 'cleaners.zip', WORK / 'cleaners')
unzip(SOURCES / 'obj_bucket_hat_gen8_toshitimo.zip', WORK / 'bucket')
unzip(WORK / 'bucket/bucket_hat_gen8_thin_weld_toshitimo.zip', WORK / 'bucket/weld')
for filename, directory in [('Product Cosmetics kit GLTF,GLB.rar', 'cosmetics'), ('Plastic+Water+Bottle.rar', 'water')]:
    (WORK / directory).mkdir()
    subprocess.run(['unrar', 'x', '-o+', '-idq', str(SOURCES / filename), str(WORK / directory) + '/'], check=True)

# Fixed source object names select products and exclude their presentation backdrops.
ITEMS = [
    ('spray-cleaner', WORK / 'spray/SprayCleaner.obj', None, .0254, 'SprayCleaner.glb'),
    ('laundry-detergent', SOURCES / 'bottles.glb', ['Plane.001', 'Cylinder'], .1, 'LaundryDetergent.glb'),
    ('fabric-softener', SOURCES / 'bottles.glb', ['Cylinder.001'], .1, 'FabricSoftener.glb'),
    ('transparent-spray-cleaner', WORK / 'cleaners/cleaners.fbx', None, None, 'TransparentSprayCleaner.glb'),
    ('cosmetics-kit', WORK / 'cosmetics/GLTF,GLB/cosmetics.glb', None, .0254, 'CosmeticsKit.glb'),
    ('plastic-water-bottle', WORK / 'water/Plastic Water Bottle/Obj/Plastic Water Bottle_obj.obj', None, .0254, 'PlasticWaterBottle.glb'),
    ('cap-red', SOURCES / 'cap.blend', ['Cube', 'Cube.001', 'Cube.002', 'Cube.003', 'Cube.004'], 1, 'CapRed.glb'),
    ('bob-red', SOURCES / 'cap.glb', None, 1, 'BobRed.glb'),
    ('bob-droit-red', WORK / 'bucket/weld/bucket_hat_gen8_thin_weld_toshitimo.obj', None, .01, 'BobDroitRed.glb'),
]
selection = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MANIFEST = ROOT / 'scripts/household-inventory-imports.json'
manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else []


def shader(mat):
    return next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')


def recolor_fabric(mat):
    """Recolour the base map only; keep stitches, weave, roughness and normals."""
    bsdf = shader(mat)
    base = bsdf.inputs['Base Color']
    pending = [link.from_node for link in base.links]
    images = []
    visited = set()
    while pending:
        node = pending.pop()
        if node in visited:
            continue
        visited.add(node)
        if node.type == 'TEX_IMAGE' and node.image:
            images.append(node)
        else:
            pending.extend(link.from_node for socket in node.inputs for link in socket.links)
    if len(images) != 1:
        raise ValueError(f'Expected one base-colour image for {mat.name}, found {len(images)}')
    image_node = images[0]
    original = image_node.image
    pixels = np.empty(len(original.pixels), dtype=np.float32)
    original.pixels.foreach_get(pixels)
    pixels = pixels.reshape((-1, 4))
    value = pixels[:, :3].max(axis=1)
    median = float(np.median(value[pixels[:, 3] > 0]))
    if median <= 0:
        raise ValueError(f'Empty fabric texture: {original.name}')
    pixels[:, :3] = np.clip((value / median)[:, None] * np.array([.46, .012, .022]), 0, 1)
    red = bpy.data.images.new(mat.name + ' red fabric', width=original.size[0], height=original.size[1], alpha=True)
    red.pixels.foreach_set(pixels.ravel())
    red.pack()
    image_node.image = red
    for link in list(base.links):
        mat.node_tree.links.remove(link)
    mat.node_tree.links.new(image_node.outputs['Color'], base)
    bsdf.inputs['Metallic'].default_value = 0
    mat.diffuse_color = (.46, .012, .022, 1)


def bounds(objects):
    points = [obj.matrix_world @ Vector(p) for obj in objects for p in obj.bound_box]
    return (Vector(tuple(min(p[a] for p in points) for a in range(3))),
            Vector(tuple(max(p[a] for p in points) for a in range(3))))


def render_views(objects, folder):
    lo, hi = bounds(objects)
    center = (hi + lo) / 2
    span = max(hi - lo)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 16
    scene.render.resolution_x = 560
    scene.render.resolution_y = 560
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.world = bpy.data.worlds.new('Preview world')
    scene.world.color = (.22, .22, .22)
    scene.view_settings.view_transform = 'AgX'
    # Reset exposure inherited from source .blend scenes.
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.0001))
    ground = bpy.context.object
    mat = bpy.data.materials.new('Preview grey floor')
    mat.diffuse_color = (.14, .15, .17, 1)
    ground.data.materials.append(mat)
    for vector, power in [((-1.3, -1.5, 2), 250), ((1, .8, 1.4), 180)]:
        bpy.ops.object.light_add(type='AREA', location=center + Vector(vector) * span)
        lamp = bpy.context.object
        lamp.data.energy = power * span ** 2
        lamp.data.size = span * 1.7
        lamp.rotation_euler = (center - lamp.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.camera_add()
    scene.camera = bpy.context.object
    scene.camera.data.type = 'ORTHO'
    scene.camera.data.ortho_scale = span * 1.45
    for name, direction in [('front', (0, -2, .7)), ('three-quarter', (1.4, -2, 1)), ('back', (-1.3, 2, .85))]:
        scene.camera.location = center + Vector(direction) * span
        scene.camera.rotation_euler = (center - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
        scene.render.filepath = str(folder / f'preview-{name}.png')
        bpy.ops.render.render(write_still=True)


for key, path, names, scale, filename in ITEMS:
    if selection and key not in selection:
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if path.suffix == '.blend':
        bpy.ops.wm.open_mainfile(filepath=str(path))
    elif path.suffix == '.glb':
        bpy.ops.import_scene.gltf(filepath=str(path))
    elif path.suffix == '.fbx':
        bpy.ops.import_scene.fbx(filepath=str(path))
    else:
        bpy.ops.wm.obj_import(filepath=str(path))
    sources = [bpy.data.objects[name] for name in names] if names else [o for o in bpy.context.scene.objects if o.type == 'MESH']
    if not sources:
        raise ValueError(f'No meshes in {path}')
    # Evaluate modifiers and freeze source transforms into independent meshes.
    depsgraph = bpy.context.evaluated_depsgraph_get()
    products = []
    for source in sources:
        mesh = bpy.data.meshes.new_from_object(source.evaluated_get(depsgraph))
        mesh.transform(source.matrix_world)
        obj = bpy.data.objects.new(source.name + ' product', mesh)
        bpy.context.collection.objects.link(obj)
        products.append(obj)
    for obj in list(bpy.context.scene.objects):
        if obj not in products:
            bpy.data.objects.remove(obj, do_unlink=True)
    lo, hi = bounds(products)
    if scale is None:
        scale = .28 / (hi.z - lo.z)  # cleaner FBX is uncalibrated: target 28 cm
    transform = Matrix.Scale(scale, 4) @ Matrix.Translation(Vector((-(hi.x + lo.x) / 2, -(hi.y + lo.y) / 2, -lo.z)))
    for obj in products:
        obj.data.transform(transform)
    if key in ('cap-red', 'bob-red', 'bob-droit-red'):
        materials = {mat for obj in products for mat in obj.data.materials if mat and (key != 'cap-red' or mat.name == 'Cap')}
        for mat in materials:
            recolor_fabric(mat)
    if key in ('laundry-detergent', 'fabric-softener'):
        # Source exported every material as white metal; restore plastic finish.
        for mat in {mat for obj in products for mat in obj.data.materials}:
            bsdf = shader(mat)
            bsdf.inputs['Metallic'].default_value = 0
            bsdf.inputs['Roughness'].default_value = .35
    if key == 'transparent-spray-cleaner':
        for matname, color, transmission, roughness in [('Material', (.96, .98, 1, 1), 1, .08), ('Material.002', (.7, .012, .015, 1), .65, .12), ('plastic lid', (.94, .96, .98, 1), .8, .16)]:
            bsdf = shader(bpy.data.materials[matname])
            bsdf.inputs['Base Color'].default_value = color
            bsdf.inputs['Metallic'].default_value = 0
            bsdf.inputs['Transmission Weight'].default_value = transmission
            bsdf.inputs['Roughness'].default_value = roughness
            bsdf.inputs['IOR'].default_value = 1.46
    folder = ROOT / 'public/items' / key
    folder.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in products:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(folder / filename), export_format='GLB', use_selection=True)
    lo, hi = bounds(products)
    dims = (hi - lo) * 100
    manifest = [item for item in manifest if item['id'] != key]
    manifest.append({'id': key, 'glbPath': f'items/{key}/{filename}', 'dims': {'w': round(dims.x, 2), 'd': round(dims.y, 2), 'h': round(dims.z, 2)}})
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    print('EXPORTED', key, manifest[-1], flush=True)
    render_views(products, folder)
(ROOT / 'scripts/household-inventory-imports.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('ALL IMPORTS COMPLETE', flush=True)
# Some local Blender audio backends hang on shutdown; all writes are finished.
import os
os._exit(0)
