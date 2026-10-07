import bpy, os, sys, json
from pathlib import Path
from mathutils import Vector
root = Path('/tmp/jikin-goldfish')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(root / 'source/JikinSF.fbx'))
print('FPS', bpy.context.scene.render.fps)
for obj in bpy.context.scene.objects:
    print('OBJECT', obj.name, obj.type, 'dimensions', tuple(obj.dimensions))
    if obj.type == 'ARMATURE':
        print('BONES', [(b.name, tuple(b.head_local), tuple(b.tail_local)) for b in obj.data.bones])
for action in bpy.data.actions:
    print('ACTION', action.name, tuple(action.frame_range))
for image in bpy.data.images:
    name = Path(image.filepath.replace('\\', '/')).name
    path = root / 'textures' / name
    if not path.exists():
        raise RuntimeError(f'Missing texture: {name}')
    if image.packed_file:
        image.unpack(method='REMOVE')
    image.filepath = str(path)
    image.reload()
    # 1K textures are sufficient for a 15 cm fish, keeping the asset lightweight.
    image.scale(1024, 1024)
    image.pack()
# Bounds include every animated pose, so a bounding sphere safely clears the tub.
points = []
for frame in range(2, 252):
    bpy.context.scene.frame_set(frame)
    deps = bpy.context.evaluated_depsgraph_get()
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            evaluated = obj.evaluated_get(deps)
            points.extend(evaluated.matrix_world @ Vector(v) for v in evaluated.bound_box)
low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
center = (low + high) / 2
metadata = {'center': [center.x, center.z, -center.y], 'radius': ((high-low)/2).length * 100}
(Path.cwd() / 'src/features/scene/items/goldfishModel.json').write_text(json.dumps(metadata, indent=2) + '\n')
bpy.context.scene.frame_set(2)
bpy.ops.export_scene.gltf(filepath=str(Path.cwd() / 'public/characters/jikin-goldfish/jikin-goldfish.glb'), export_format='GLB', export_animations=True)
sys.stdout.flush()
sys.stderr.flush()
os._exit(0)
