import bpy
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
path = root / 'public/items/pepprig70567650/Pepprig70567650.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
with tempfile.NamedTemporaryFile(suffix='.glb') as original:
    original.write(subprocess.check_output(['git', 'show', '6967b44548c2cd184e00c47155b86a996638a888:public/items/pepprig70567650/Pepprig70567650.glb'], cwd=root))
    original.flush()
    bpy.ops.import_scene.gltf(filepath=original.name)
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
keep = next(o for o in meshes if o.name == 'ASY_LPT02_70567650_S01_NV01')
for obj in meshes:
    if obj != keep:
        bpy.data.objects.remove(obj, do_unlink=True)
keep.location = (0, 0, 0)
material = keep.data.materials[0]
material.name = 'PEPPRIG rouge foncé'
base = material.node_tree.nodes.get('Principled BSDF').inputs['Base Color']
image = base.links[0].from_node.image
pixels = list(image.pixels[:])
for i in range(0, len(pixels), 4):
    luminance = max(pixels[i:i + 3])
    pixels[i:i + 3] = [luminance * 0.48, luminance * 0.025, luminance * 0.04]
image.pixels[:] = pixels
image.pack()
bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', use_selection=False, export_draco_mesh_compression_enable=True)
print('Sponge dimensions (metres):', tuple(keep.dimensions))
# Inspect the rear bowl wall in the same axes as the application.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root / 'public/items/boholmen99157501/Boholmen99157501.glb'))
# Blender (X,Y,Z) -> glTF (X,Z,-Y), then sink rotation Y=pi/2.
obj = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
vertices = [Vector((-p.y * 100, p.z * 100, -p.x * 100)) for p in [obj.matrix_world @ v.co for v in obj.data.vertices]]
bvh = BVHTree.FromPolygons(vertices, [tuple(p.vertices) for p in obj.data.polygons])
for y in (3, 8, 14):
    print('Rear interior', y, bvh.ray_cast(Vector((0, y, 0)), Vector((0, 0, 1)))[0])
