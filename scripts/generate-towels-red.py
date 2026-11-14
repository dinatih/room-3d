"""Generate 3D GLB assets for the 10-piece red coral-fleece towel set (Temu MIANDUDU)."""
import math
import os
import bpy
import bmesh
from mathutils import Vector

OUT_DIR = "/home/dinatih/Projects/room-3d/public/items/towel-set-red"
os.makedirs(OUT_DIR, exist_ok=True)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def create_towel_material(name="CoralFleeceRed"):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.92
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.45
    if "Sheen Roughness" in bsdf.inputs:
        bsdf.inputs["Sheen Roughness"].default_value = 0.65

    tex_coord = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 320.0
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.75

    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.25
    ramp.color_ramp.elements[0].color = (0.38, 0.012, 0.018, 1.0)
    ramp.color_ramp.elements[1].position = 0.78
    ramp.color_ramp.elements[1].color = (0.56, 0.025, 0.032, 1.0)

    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.18
    bump.inputs["Distance"].default_value = 0.002

    links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_folded_towel(name, width, depth, height, center_x, center_z, base_y, mat):
    """Create a plush folded towel block with rounded fold edge in Blender (meters, Z-up)."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(width, depth, height), verts=bm.verts)
    bmesh.ops.bevel(
        bm,
        geom=list(bm.edges),
        offset=min(height * 0.42, width * 0.12, depth * 0.22),
        segments=4,
        profile=0.55,
        affect='EDGES',
    )
    bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=2, use_grid_fill=True)

    # Subtle plush puffiness in center and fold crease along the front/back
    for v in bm.verts:
        nx = v.co.x / (width * 0.5) if width > 0 else 0.0
        ny = v.co.y / (depth * 0.5) if depth > 0 else 0.0
        nz = v.co.z / (height * 0.5) if height > 0 else 0.0
        puff = 0.0025 * (1.0 - nx * nx * 0.6) * (1.0 - ny * ny * 0.5)
        v.co.z += puff * nz
        # Slight pinched seam near mid-height on the open side
        if abs(nz) < 0.35 and ny > 0.75:
            v.co.y -= 0.0025 * (1.0 - abs(nz) / 0.35)

    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj.location = (center_x, center_z, base_y + height * 0.5)
    obj.data.materials.append(mat)
    return obj


def make_hanging_towel(name, length, width_top, width_bottom, folds, mat):
    """
    Create a towel draped/hanging from a hook at local (0, 0, 0).
    In Blender Z-up:
      -Z = downward (-Y in Three.js)
      +Y = forward away from wall (-Z in Three.js Wy0083 local space)
      -Y = toward wall (+Z in Three.js Wy0083 local space)
    """
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    nx = 28
    nz = 36
    thickness = 0.0055

    bm = bmesh.new()
    verts_front = []
    verts_back = []

    for iz in range(nz + 1):
        t = iz / nz  # 0 at hook top, 1 at bottom hem
        z = 0.008 - t * length  # starts 8mm above hook tip, hangs down

        # Width flares from narrow pinch at the hook to fuller drape below
        pinch = math.pow(math.sin(min(t * 2.4, math.pi * 0.5)), 0.7)
        half_w = 0.5 * (width_top + (width_bottom - width_top) * pinch)

        # Gentle forward drape away from the wall (+Y in Blender -> -Z in Wy0083)
        forward_curve = 0.012 * math.sin(t * math.pi * 0.85) + 0.006 * t

        row_f = []
        row_b = []
        for ix in range(nx + 1):
            u = (ix / nx) * 2.0 - 1.0  # -1 .. +1
            x = u * half_w

            # Natural vertical pleats that deepen below the pinch
            pleat_amp = (0.004 + 0.014 * (t ** 0.75)) * (1.0 - 0.15 * u * u)
            pleat = pleat_amp * math.sin(u * folds * math.pi + 0.35 * t)
            # Secondary soft wave for organic cloth look
            pleat += 0.003 * t * math.cos(u * (folds + 1.5) * math.pi)

            # Hook loop pinch at very top center
            hook_indent = -0.006 * math.exp(-t * 14.0) * (1.0 - u * u)

            y_center = forward_curve + pleat + hook_indent
            vf = bm.verts.new((x, y_center + thickness * 0.5, z))
            vb = bm.verts.new((x, y_center - thickness * 0.5, z))
            row_f.append(vf)
            row_b.append(vb)
        verts_front.append(row_f)
        verts_back.append(row_b)

    # Front and back faces
    for iz in range(nz):
        for ix in range(nx):
            bm.faces.new((
                verts_front[iz][ix],
                verts_front[iz][ix + 1],
                verts_front[iz + 1][ix + 1],
                verts_front[iz + 1][ix],
            ))
            bm.faces.new((
                verts_back[iz][ix],
                verts_back[iz + 1][ix],
                verts_back[iz + 1][ix + 1],
                verts_back[iz][ix + 1],
            ))

    # Stitch outer boundary edges (top, bottom, left, right)
    for ix in range(nx):
        bm.faces.new((verts_front[0][ix], verts_back[0][ix], verts_back[0][ix + 1], verts_front[0][ix + 1]))
        bm.faces.new((verts_front[nz][ix], verts_front[nz][ix + 1], verts_back[nz][ix + 1], verts_back[nz][ix]))
    for iz in range(nz):
        bm.faces.new((verts_front[iz][0], verts_front[iz + 1][0], verts_back[iz + 1][0], verts_back[iz][0]))
        bm.faces.new((verts_front[iz][nx], verts_back[iz][nx], verts_back[iz + 1][nx], verts_front[iz + 1][nx]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    for p in mesh.polygons:
        p.use_smooth = True

    obj.data.materials.append(mat)
    return obj


def export_glb(filename):
    path = os.path.join(OUT_DIR, filename)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"Exported {path} ({os.path.getsize(path)} bytes)")


# 1. TowelSetRed.glb (10-piece stack matching the Temu photo)
reset_scene()
mat = create_towel_material()
# 2 large bath towels at bottom (34 x 17 x 5.2 cm each)
make_folded_towel("BathTowel_1", 0.34, 0.17, 0.052, 0.0, 0.0, 0.0, mat)
make_folded_towel("BathTowel_2", 0.34, 0.17, 0.052, 0.0, 0.0, 0.052, mat)
# 4 hand towels in 2x2 stacks above (16.5 x 15 x 3.6 cm each)
for side, sx in (("L", -0.086), ("R", 0.086)):
    make_folded_towel(f"HandTowel_{side}1", 0.165, 0.15, 0.036, sx, 0.0, 0.104, mat)
    make_folded_towel(f"HandTowel_{side}2", 0.165, 0.15, 0.036, sx, 0.0, 0.140, mat)
# 4 washcloths in 2x2 stacks on top (15.5 x 13.5 x 2.6 cm each)
for side, sx in (("L", -0.082), ("R", 0.082)):
    make_folded_towel(f"Washcloth_{side}1", 0.155, 0.135, 0.026, sx, 0.0, 0.176, mat)
    make_folded_towel(f"Washcloth_{side}2", 0.155, 0.135, 0.026, sx, 0.0, 0.202, mat)
export_glb("TowelSetRed.glb")

# 2. TowelFoldedRed.glb (1 large folded bath towel for the top shelf of Wy008-3)
reset_scene()
mat = create_towel_material()
make_folded_towel("FoldedBathTowel", 0.33, 0.16, 0.055, 0.0, 0.0, 0.0, mat)
export_glb("TowelFoldedRed.glb")

# 3. TowelHangingLargeRed.glb (1 large bath towel hanging from a hook)
reset_scene()
mat = create_towel_material()
make_hanging_towel("HangingBathTowel", length=0.64, width_top=0.042, width_bottom=0.14, folds=2.5, mat=mat)
export_glb("TowelHangingLargeRed.glb")

# 4. TowelHangingSmallRed.glb (1 small towel hanging from a hook, narrow enough for 5.9cm hook spacing)
reset_scene()
mat = create_towel_material()
make_hanging_towel("HangingSmallTowel", length=0.28, width_top=0.030, width_bottom=0.052, folds=2.0, mat=mat)
export_glb("TowelHangingSmallRed.glb")
