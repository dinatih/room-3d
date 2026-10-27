"""Articulate IKEA VÄTTERSÖ storage box (20562909) with opening lid animation.

blender -b -noaudio --python scripts/articulate_vatterso.py
"""
import bpy
import bmesh
import math
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/items/vatterso20562909/Vatterso20562909.glb'
OUTPUT = ROOT / 'public/items/vatterso20562909/vatterso-animated.glb'

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
source = next(obj for obj in bpy.context.scene.objects if obj.type == 'MESH')
mesh = source.data

plane_co = Vector((0.0, 0.0, 0.705))
plane_no = Vector((0.0, -0.181, 1.0)).normalized()

def create_cap(bm, plane_co, plane_no, flip=False):
    # Add a clean rectangular cap along the bisect cut plane
    # Footprint: X in [-0.78, 0.78], Y in [-0.355, 0.355]
    # At y, z = plane_co.z - (plane_no.y / plane_no.z) * y
    slope = -plane_no.y / plane_no.z
    x0, x1 = -0.775, 0.775
    y0, y1 = -0.355, 0.355
    z0 = plane_co.z + slope * y0
    z1 = plane_co.z + slope * y1
    
    v1 = bm.verts.new(Vector((x0, y0, z0)))
    v2 = bm.verts.new(Vector((x1, y0, z0)))
    v3 = bm.verts.new(Vector((x1, y1, z1)))
    v4 = bm.verts.new(Vector((x0, y1, z1)))
    
    verts = [v4, v3, v2, v1] if flip else [v1, v2, v3, v4]
    face = bm.faces.new(verts)
    face.material_index = 0
    return face

# 1. Body: keep below plane
bm_body = bmesh.new()
bm_body.from_mesh(mesh)
bmesh.ops.bisect_plane(
    bm_body,
    geom=bm_body.faces[:] + bm_body.edges[:] + bm_body.verts[:],
    plane_co=plane_co,
    plane_no=plane_no,
    clear_inner=False,
    clear_outer=True
)
# We can create interior cavity walls and floor for the storage box!
# Cavity dimensions: X in [-0.73, 0.73], Y in [-0.31, 0.31], floor at Z = 0.06
# Rim at plane: z_rim(y) = plane_co.z + slope * y
slope = -plane_no.y / plane_no.z
cx0, cx1 = -0.73, 0.73
cy0, cy1 = -0.31, 0.31
cz_floor = 0.06

# Cavity floor:
f1 = bm_body.verts.new(Vector((cx0, cy0, cz_floor)))
f2 = bm_body.verts.new(Vector((cx1, cy0, cz_floor)))
f3 = bm_body.verts.new(Vector((cx1, cy1, cz_floor)))
f4 = bm_body.verts.new(Vector((cx0, cy1, cz_floor)))
bm_body.faces.new([f1, f2, f3, f4]) # Normal up

# Cavity rim:
r1 = bm_body.verts.new(Vector((cx0, cy0, plane_co.z + slope * cy0)))
r2 = bm_body.verts.new(Vector((cx1, cy0, plane_co.z + slope * cy0)))
r3 = bm_body.verts.new(Vector((cx1, cy1, plane_co.z + slope * cy1)))
r4 = bm_body.verts.new(Vector((cx0, cy1, plane_co.z + slope * cy1)))

# Cavity walls (facing inward):
bm_body.faces.new([f1, r1, r2, f2]) # Front
bm_body.faces.new([f2, r2, r3, f3]) # Right
bm_body.faces.new([f3, r3, r4, f4]) # Back
bm_body.faces.new([f4, r4, r1, f1]) # Left

# Body top rim cap (between outer rim and inner cavity):
# Outer rim corners:
ox0, ox1 = -0.775, 0.775
oy0, oy1 = -0.355, 0.355
o1 = bm_body.verts.new(Vector((ox0, oy0, plane_co.z + slope * oy0)))
o2 = bm_body.verts.new(Vector((ox1, oy0, plane_co.z + slope * oy0)))
o3 = bm_body.verts.new(Vector((ox1, oy1, plane_co.z + slope * oy1)))
o4 = bm_body.verts.new(Vector((ox0, oy1, plane_co.z + slope * oy1)))

bm_body.faces.new([o1, o2, r2, r1]) # Front rim
bm_body.faces.new([o2, o3, r3, r2]) # Right rim
bm_body.faces.new([o3, o4, r4, r3]) # Back rim
bm_body.faces.new([o4, o1, r1, r4]) # Left rim

body_mesh = bpy.data.meshes.new('VattersoBody')
bm_body.to_mesh(body_mesh)
bm_body.free()
for mat in mesh.materials:
    body_mesh.materials.append(mat)
body_obj = bpy.data.objects.new('VattersoBody', body_mesh)
bpy.context.collection.objects.link(body_obj)

# 2. Lid: keep above plane
bm_lid = bmesh.new()
bm_lid.from_mesh(mesh)
bmesh.ops.bisect_plane(
    bm_lid,
    geom=bm_lid.faces[:] + bm_lid.edges[:] + bm_lid.verts[:],
    plane_co=plane_co,
    plane_no=plane_no,
    clear_inner=True,
    clear_outer=False
)
create_cap(bm_lid, plane_co, plane_no, flip=True)

lid_mesh = bpy.data.meshes.new('VattersoLidSurface')
bm_lid.to_mesh(lid_mesh)
bm_lid.free()
for mat in mesh.materials:
    lid_mesh.materials.append(mat)
lid_surface_obj = bpy.data.objects.new('VattersoLidSurface', lid_mesh)
bpy.context.collection.objects.link(lid_surface_obj)

# 3. Pivot & Hinge
# Rear hinge location: X=0, Y=0.34, Z = plane_co.z + slope * 0.34
hinge_y = 0.34
hinge_z = plane_co.z + slope * hinge_y
pivot = bpy.data.objects.new('VattersoLid', None)
bpy.context.collection.objects.link(pivot)
pivot.location = Vector((0.0, hinge_y, hinge_z))

lid_surface_obj.parent = pivot
lid_surface_obj.matrix_parent_inverse = Matrix.Translation(-pivot.location)

# Remove source object
bpy.data.objects.remove(source, do_unlink=True)

# 4. Keyframe animation: 'lid_open'
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 0, 24

pivot.keyframe_insert('rotation_euler', frame=0)
# Opening angle ~ 70 degrees around local X axis
pivot.rotation_euler.x = -math.radians(70)
pivot.keyframe_insert('rotation_euler', frame=24)
pivot.animation_data.action.name = 'lid_open'

for layer in pivot.animation_data.action.layers:
    for strip in layer.strips:
        for bag in strip.channelbags:
            for curve in bag.fcurves:
                for key in curve.keyframe_points:
                    key.interpolation = 'BEZIER'

scene.frame_set(0)
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.file.pack_all()
bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT),
    export_format='GLB',
    export_extras=True,
    export_animations=True,
    export_animation_mode='ACTIONS',
    export_frame_range=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_copyright='2025 (c) IKEA / VÄTTERSÖ'
)
print(f"VATTERSO ARTICULATED: exported to {OUTPUT}")
