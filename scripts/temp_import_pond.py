import bpy
from pathlib import Path
from mathutils import Vector
root = Path(__file__).resolve().parents[1] / 'public/items/little-pond-fish'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(root / 'source/01_n_pond.fbx'))
for image in bpy.data.images:
    if image.source == 'FILE':
        name = Path(image.filepath.replace('\\', '/')).name
        image.filepath = str(root / 'textures' / name)
        if image.packed_file:
            image.unpack(method='REMOVE')
        image.reload()
        image.pack()
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
points = [o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
print('POND_BOUNDS_METERS', tuple(low), tuple(high), 'ACTIONS', [(a.name, tuple(a.frame_range)) for a in bpy.data.actions])
if not bpy.data.actions:
    raise RuntimeError('Pond FBX has no animation')
bpy.ops.export_scene.gltf(filepath=str(root / 'little-pond-fish.glb'), export_format='GLB', export_animations=True, export_animation_mode='SCENE')
