"""Generate a faithful 3D GLB of the OYeet MG-T1 NEX PRO II Massage Gun (Red) with its charging dock."""
import math
import os
import bpy
import bmesh
from mathutils import Matrix

OUT_PATH = "/home/dinatih/Projects/room-3d/public/items/oyeet-nex-pro-ii/OyeetNexProII.glb"
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)


def make_mat(name, base_color, metallic=0.0, roughness=0.4, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission is not None and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


def make_red_grip_mat():
    mat = make_mat("OyeetRedGrip", (0.68, 0.025, 0.035), metallic=0.12, roughness=0.36)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")

    tex_coord = nodes.new("ShaderNodeTexCoord")
    voronoi = nodes.new("ShaderNodeTexVoronoi")
    voronoi.inputs["Scale"].default_value = 260.0
    voronoi.inputs["Randomness"].default_value = 0.05

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.16
    bump.inputs["Distance"].default_value = 0.001

    links.new(tex_coord.outputs["Object"], voronoi.inputs["Vector"])
    links.new(voronoi.outputs["Distance"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


mat_red = make_mat("OyeetRed", (0.72, 0.028, 0.04), metallic=0.15, roughness=0.30)
mat_red_grip = make_red_grip_mat()
mat_alu = make_mat("BrushedAluminum", (0.78, 0.80, 0.83), metallic=0.88, roughness=0.26)
mat_alu_dark = make_mat("DarkAluminum", (0.48, 0.50, 0.54), metallic=0.85, roughness=0.32)
mat_dock = make_mat("DockBlack", (0.045, 0.048, 0.055), metallic=0.10, roughness=0.45)
mat_top_screen = make_mat("TopDisplay", (0.02, 0.022, 0.028), metallic=0.05, roughness=0.12)
mat_led = make_mat("LedWhite", (0.85, 0.92, 1.0), metallic=0.0, roughness=0.2, emission=(0.85, 0.92, 1.0), emission_strength=1.4)
mat_white = make_mat("LogoWhite", (0.92, 0.92, 0.94), metallic=0.0, roughness=0.35)


def add_cylinder(name, radius, depth, loc, rot=(0, 0, 0), segments=48, bevel=0.0015, mat=None):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=segments,
        radius1=radius,
        radius2=radius,
        depth=depth,
    )
    if bevel > 0:
        cap_edges = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-5]
        bmesh.ops.bevel(bm, geom=cap_edges, offset=bevel, segments=3, affect='EDGES')
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj.location = loc
    obj.rotation_euler = rot
    if mat:
        obj.data.materials.append(mat)
    return obj


def add_lathe(name, profile_rz, loc=(0, 0, 0), rot=(0, 0, 0), segments=48, mat=None):
    """Create a surface of revolution around Z from (r, z) points."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()

    rings = []
    for r, z in profile_rz:
        if r <= 1e-5:
            v = bm.verts.new((0.0, 0.0, z))
            rings.append([v])
        else:
            ring = []
            for i in range(segments):
                a = 2.0 * math.pi * i / segments
                ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
            rings.append(ring)

    for k in range(len(rings) - 1):
        r0, r1 = rings[k], rings[k + 1]
        if len(r0) == 1 and len(r1) > 1:
            for i in range(segments):
                bm.faces.new((r0[0], r1[i], r1[(i + 1) % segments]))
        elif len(r0) > 1 and len(r1) == 1:
            for i in range(segments):
                bm.faces.new((r0[i], r1[0], r0[(i + 1) % segments]))
        elif len(r0) > 1 and len(r1) > 1:
            for i in range(segments):
                ni = (i + 1) % segments
                bm.faces.new((r0[i], r0[ni], r1[ni], r1[i]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj.location = loc
    obj.rotation_euler = rot
    if mat:
        obj.data.materials.append(mat)
    return obj


# --- 1. Charging Dock (Blender Z-up, bottom at z = 0) ---
dock_profile = [
    (0.0, 0.0),
    (0.036, 0.0),
    (0.038, 0.002),
    (0.036, 0.018),
    (0.033, 0.022),
    (0.0245, 0.022),
    (0.0242, 0.008),
    (0.0, 0.008),
]
add_lathe("ChargingDock", dock_profile, loc=(0, 0, 0), mat=mat_dock)
# Small front charging LED indicator on dock
add_cylinder("DockLED", 0.0022, 0.003, loc=(0, -0.0365, 0.010), rot=(math.pi / 2, 0, 0), segments=16, bevel=0, mat=mat_led)

# --- 2. Massage Gun Vertical Handle (seated inside dock at z = 0.009) ---
# Bottom ring
add_cylinder("HandleBottom", 0.0225, 0.016, loc=(0, 0, 0.017), bevel=0.0012, mat=mat_red)
# Main perforated grip body
add_cylinder("HandleGrip", 0.0230, 0.092, loc=(0, 0, 0.071), bevel=0.0012, mat=mat_red_grip)
# Upper housing collar
add_cylinder("HandleTop", 0.0235, 0.032, loc=(0, 0, 0.133), bevel=0.0025, mat=mat_red)
# Top dark display cap + thin LED ring
add_cylinder("TopDisplay", 0.0195, 0.003, loc=(0, 0, 0.149), bevel=0.0006, mat=mat_top_screen)
add_cylinder("TopLedDot", 0.0035, 0.0015, loc=(0, 0, 0.1502), bevel=0, mat=mat_led)

# Subtle "O'Yeet" white side accent bar on handle (-X/+X side)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.0226, 0.0, 0.072))
accent = bpy.context.active_object
accent.name = "OyeetLogoBar"
accent.scale = (0.0018, 0.007, 0.068)
accent.data.materials.append(mat_white)

# --- 3. Horizontal Percussion Barrel (pointing forward toward -Y in Blender = +Z in Three.js) ---
barrel_z = 0.125
# Red barrel housing
add_cylinder(
    "BarrelRed",
    radius=0.022,
    depth=0.044,
    loc=(0, -0.010, barrel_z),
    rot=(math.pi / 2, 0, 0),
    bevel=0.003,
    mat=mat_red,
)
# Brushed aluminum motor collar + chuck
add_cylinder(
    "BarrelAluCollar",
    radius=0.0185,
    depth=0.024,
    loc=(0, -0.040, barrel_z),
    rot=(math.pi / 2, 0, 0),
    bevel=0.0012,
    mat=mat_alu,
)
add_cylinder(
    "BarrelAluChuck",
    radius=0.0150,
    depth=0.014,
    loc=(0, -0.056, barrel_z),
    rot=(math.pi / 2, 0, 0),
    bevel=0.001,
    mat=mat_alu_dark,
)

# --- 4. Flat Aluminum Mushroom Massage Head ---
head_profile = [
    (0.0, 0.0),
    (0.009, 0.0),
    (0.009, 0.018),
    (0.013, 0.024),
    (0.0205, 0.027),
    (0.0205, 0.032),
    (0.0185, 0.0335),
    (0.0, 0.0335),
]
add_lathe(
    "FlatMassageHead",
    head_profile,
    loc=(0, -0.058, barrel_z),
    rot=(math.pi / 2, 0, 0),
    mat=mat_alu,
)

bpy.ops.export_scene.gltf(
    filepath=OUT_PATH,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
print(f"Exported {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)")
