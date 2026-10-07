import bpy, os, sys, json
from pathlib import Path
from mathutils import Vector
species = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'jikin'
source = {'jikin': 'JikinSF', 'tosakin': 'TosakinSf'}[species]
root = Path(f'/tmp/{species}-goldfish')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(root / f'source/{source}.fbx'))
if len(bpy.data.actions) != 1:
    raise RuntimeError('Expected the combined goldfish animation')
action = bpy.data.actions[0]
start, end = (int(f) for f in action.frame_range)
if end != 251 or bpy.context.scene.render.fps != 24:
    raise RuntimeError(f'Unexpected animation timeline: {start}, {end}')
print('ANIMATION', species, action.name, start, end)
for image in bpy.data.images:
    name = Path(image.filepath.replace('\\', '/')).name
    path = root / 'textures' / name
    if not path.exists():
        raise RuntimeError(f'Missing texture: {name}')
    if image.packed_file:
        image.unpack(method='REMOVE')
    image.filepath = str(path)
    image.reload()
    image.scale(1024, 1024)
    image.pack()
# FBX lost the transparent cornea: opaque white obscured the source yellow iris/black lens.
cornea = bpy.data.materials['M_Cornea'].node_tree.nodes.get('Principled BSDF')
cornea.inputs['Base Color'].default_value = (1, 1, 1, 1)
cornea.inputs['Alpha'].default_value = 0.06
cornea.inputs['Metallic'].default_value = 0
bpy.data.materials['M_Iris'].node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value = 0
bpy.data.materials['M_Lens'].node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = 0.18
points = []
for frame in range(start, end + 1):
    bpy.context.scene.frame_set(frame)
    deps = bpy.context.evaluated_depsgraph_get()
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            evaluated = obj.evaluated_get(deps)
            points.extend(evaluated.matrix_world @ Vector(v) for v in evaluated.bound_box)
low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
center = (low + high) / 2
size = high - low
scale = 100 if species == 'jikin' else 18 / max(size)
frames = {'turn-left': [start, 51], 'turn-right': [52, 101], 'swim': [102, 151], 'idle': [152, 201], 'eat': [202, 251]}
metadata = {'center': [center.x, center.z, -center.y], 'radius': size.length / 2 * scale, 'scale': scale, 'frames': frames,
            'dimensions': {'w': size.x * scale, 'h': size.z * scale, 'd': size.y * scale}}
metadata_path = 'goldfishModel.json' if species == 'jikin' else 'tosakinModel.json'
(Path.cwd() / 'src/features/scene/items' / metadata_path).write_text(json.dumps(metadata, indent=2) + '\n')
bpy.context.scene.frame_set(start)
output = Path.cwd() / f'public/characters/{species}-goldfish/{species}-goldfish.glb'
output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB', export_animations=True)
print('MODEL', metadata)
sys.stdout.flush(); sys.stderr.flush(); os._exit(0)
