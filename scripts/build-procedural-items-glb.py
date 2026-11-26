"""Generate GLB models for the 9 procedural items.

Run:
  blender -b -t 4 --python-exit-code 1 --python scripts/build-procedural-items-glb.py

All coordinates in Blender are exported to glTF in metres (1 unit = 1 m),
Y-up in glTF (Blender Z-up is automatically converted by the glTF exporter).
"""

import io
import math
from pathlib import Path

import bpy
import bmesh
from mathutils import Matrix, Vector
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ITEMS_DIR = ROOT / "public" / "items"


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_material(
    name: str,
    color,
    *,
    roughness: float = 0.5,
    metallic: float = 0.0,
    alpha: float = 1.0,
    emission=None,
    emission_strength: float = 0.0,
    image: bpy.types.Image | None = None,
):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color[:3], 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        mat.blend_method = "BLEND" if hasattr(mat, "blend_method") else "HASHED"
    if emission is not None and emission_strength > 0.0:
        bsdf.inputs["Emission Color"].default_value = (*emission[:3], 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if image is not None:
        tex_node = nt.nodes.new("ShaderNodeTexImage")
        tex_node.image = image
        tex_node.extension = "CLIP"
        nt.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
        if image.channels == 4:
            # Check if image actually has non-opaque alpha
            nt.links.new(tex_node.outputs["Alpha"], bsdf.inputs["Alpha"])
        if emission is not None and emission_strength > 0.0:
            nt.links.new(tex_node.outputs["Color"], bsdf.inputs["Emission Color"])
    return mat


def srgb_hex(hex_int: int) -> tuple[float, float, float]:
    """Convert 0xRRGGBB sRGB hex to linear RGB for Blender."""
    r = ((hex_int >> 16) & 0xFF) / 255.0
    g = ((hex_int >> 8) & 0xFF) / 255.0
    b = (hex_int & 0xFF) / 255.0

    def to_lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (to_lin(r), to_lin(g), to_lin(b))


def add_mesh_object(name: str, bm: bmesh.types.BMesh, mat=None, smooth: bool = False):
    mesh = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    if smooth:
        for p in mesh.polygons:
            p.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    if mat is not None:
        obj.data.materials.append(mat)
    return obj


def make_box(name: str, size_xyz, center_xyz, mat, bevel: float = 0.0, bevel_segs: int = 2):
    """Create a box in Blender coordinates (Z-up)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size_xyz, verts=bm.verts)
    if bevel > 0.0:
        bmesh.ops.bevel(
            bm,
            geom=list(bm.edges),
            offset=bevel,
            segments=bevel_segs,
            affect="EDGES",
            clamp_overlap=True,
        )
    bmesh.ops.translate(bm, vec=center_xyz, verts=bm.verts)
    return add_mesh_object(name, bm, mat, smooth=(bevel > 0.0))


def make_cylinder_between(name: str, p1, p2, radius: float, segs: int, mat):
    """Create a cylinder between two Blender-space points."""
    v1 = Vector(p1)
    v2 = Vector(p2)
    diff = v2 - v1
    length = diff.length
    if length < 1e-6:
        return None
    mid = (v1 + v2) * 0.5
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm,
        cap_ends=True,
        cap_tris=False,
        segments=segs,
        radius1=radius,
        radius2=radius,
        depth=length,
    )
    rot = Vector((0, 0, 1)).rotation_difference(diff.normalized()).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation(mid) @ rot, verts=bm.verts)
    return add_mesh_object(name, bm, mat, smooth=True)


def export_glb(rel_path: str):
    out_path = ITEMS_DIR / rel_path
    out_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(out_path),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
    )
    print(f"Exported {out_path} ({out_path.stat().st_size} bytes)")


# Note on Blender Z-up -> glTF Y-up conversion:
# glTF (x, y, z) = Blender (x, z, -y)
# So Three.js (x, y, z) -> Blender (x, -z, y)
def to_blender(x: float, y: float, z: float) -> tuple[float, float, float]:
    return (x, -z, y)


# ---------------------------------------------------------------------------
# 1. ShoeHatRack (0.60 x 1.54 x 0.26 m, origin at bottom-front-left (0,0,0))
# ---------------------------------------------------------------------------
def build_shoe_hat_rack():
    reset_scene()
    W, D, H = 0.60, 0.26, 1.54
    TR = 0.008
    H_BACK = 0.72
    SHELF_YS = (0.05, 0.21, 0.37, 0.53)
    Y_MID = 1.05
    Y_TOP = 1.40
    HOOK_XS = (W * 0.12, W * 0.37, W * 0.63, W * 0.88)

    metal = make_material("rack_metal", srgb_hex(0x1A1A1A), roughness=0.5, metallic=0.8)
    fabric = make_material("rack_fabric", srgb_hex(0x7A7A7A), roughness=0.95, metallic=0.0)

    def tube(name, p1, p2):
        make_cylinder_between(name, to_blender(*p1), to_blender(*p2), TR, 10, metal)

    # Montants avant & arrière
    tube("post_fl", (TR, 0, TR), (TR, H, TR))
    tube("post_fr", (W - TR, 0, TR), (W - TR, H, TR))
    tube("post_bl", (TR, 0, D - TR), (TR, H_BACK, D - TR))
    tube("post_br", (W - TR, 0, D - TR), (W - TR, H_BACK, D - TR))

    # Cadre bas
    tube("base_f", (TR, TR, TR), (W - TR, TR, TR))
    tube("base_b", (TR, TR, D - TR), (W - TR, TR, D - TR))
    tube("base_l", (TR, TR, TR), (TR, TR, D - TR))
    tube("base_r", (W - TR, TR, TR), (W - TR, TR, D - TR))

    # Transition haut arrière -> avant
    tube("top_l", (TR, H_BACK, D - TR), (TR, H_BACK, TR))
    tube("top_r", (W - TR, H_BACK, D - TR), (W - TR, H_BACK, TR))

    # 4 étagères
    for i, y in enumerate(SHELF_YS):
        tube(f"s{i}_f", (TR, y, TR), (W - TR, y, TR))
        tube(f"s{i}_b", (TR, y, D - TR), (W - TR, y, D - TR))
        tube(f"s{i}_l", (TR, y, TR), (TR, y, D - TR))
        tube(f"s{i}_r", (W - TR, y, TR), (W - TR, y, D - TR))
        make_box(
            f"shelf_{i}",
            (W - 2 * TR - 0.005, D - 2 * TR - 0.005, 0.015),
            to_blender(W / 2, y + 0.0075, D / 2),
            fabric,
        )

    # Barres porte-manteaux / chapeaux
    tube("bar_mid", (TR, Y_MID, TR), (W - TR, Y_MID, TR))
    tube("bar_top", (TR, Y_TOP, TR), (W - TR, Y_TOP, TR))

    # Crochets doubles (4 positions x 2 barres, sans le crochet bas gauche)
    for ix, x in enumerate(HOOK_XS):
        for iy, bar_y in enumerate((Y_MID, Y_TOP)):
            if ix == 0 and iy == 0:
                continue
            tube(f"hk_{ix}_{iy}_v", (x, bar_y, TR), (x, bar_y + 0.07, TR))
            tube(f"hk_{ix}_{iy}_u", (x, bar_y + 0.07, TR), (x, bar_y + 0.115, TR + 0.055))
            tube(f"hk_{ix}_{iy}_l", (x, bar_y + 0.0385, TR), (x, bar_y + 0.0685, TR + 0.04))

    export_glb("shoe-hat-rack/shoe-hat-rack.glb")


# ---------------------------------------------------------------------------
# 2. MeubleT — Meuble bibliothèque en T (étagère excentrée : 40cm gauche, 18cm droite)
#    Caisson centré en X=0, Z=0, base à Y=0 (H=0.55m, W=0.225m, D=0.275m)
# ---------------------------------------------------------------------------
def build_meuble_t():
    reset_scene()
    W, H, D, T = 0.225, 0.55, 0.275, 0.015
    LEFT_OVERHANG = 0.40
    RIGHT_OVERHANG = 0.18
    PL = LEFT_OVERHANG + W + RIGHT_OVERHANG  # 0.805 m
    PT, PD = 0.037, 0.235
    plank_x = (RIGHT_OVERHANG - LEFT_OVERHANG) / 2.0  # -0.11 m
    plank_y = 0.33 + PT / 2.0
    plank_z = -D / 2.0 + PD / 2.0  # -0.02 m

    wood = make_material("meuble_t_wood", srgb_hex(0xC8A46E), roughness=0.85)
    white = make_material("meuble_t_plank", srgb_hex(0xF5F0E8), roughness=0.85)

    make_box("top", (W, D, T), to_blender(0, H - T / 2, 0), wood)
    make_box("bottom", (W, D, T), to_blender(0, T / 2, 0), wood)
    make_box("side_l", (T, D, H), to_blender(-W / 2 + T / 2, H / 2, 0), wood)
    make_box("side_r", (T, D, H), to_blender(W / 2 - T / 2, H / 2, 0), wood)
    make_box("plank", (PL, PD, PT), to_blender(plank_x, plank_y, plank_z), white)

    export_glb("meuble-t/meuble-t.glb")


# ---------------------------------------------------------------------------
# 3. ArmlessSofa (1.00 x 1.00 x 0.60 m, rouge, coins arrondis)
# ---------------------------------------------------------------------------
def make_rounded_box(name: str, size_xyz, center_xyz, mat, radius: float, segs: int = 3):
    """Create a smooth rounded box matching Three.js RoundedBoxGeometry."""
    sx, sy, sz = size_xyz
    r = min(radius, sx * 0.49, sy * 0.49, sz * 0.49)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=segs * 2 + 1, use_grid_fill=True)
    hx, hy, hz = sx / 2.0 - r, sy / 2.0 - r, sz / 2.0 - r
    for v in bm.verts:
        px = v.co.x * sx
        py = v.co.y * sy
        pz = v.co.z * sz
        cx = max(-hx, min(hx, px))
        cy = max(-hy, min(hy, py))
        cz = max(-hz, min(hz, pz))
        d = Vector((px - cx, py - cy, pz - cz))
        if d.length > 1e-7:
            d.normalize()
            v.co = Vector((cx, cy, cz)) + d * r
        else:
            v.co = Vector((px, py, pz))
    bmesh.ops.translate(bm, vec=center_xyz, verts=bm.verts)
    return add_mesh_object(name, bm, mat, smooth=True)


def build_armless_sofa():
    reset_scene()
    W, D, H, SEAT_H, BACK_T, R = 1.00, 0.60, 1.00, 0.40, 0.10, 0.06
    red = make_material("sofa_red", srgb_hex(0xCC0000), roughness=0.7)

    make_rounded_box("seat", (W, D, SEAT_H), to_blender(0, SEAT_H / 2, 0), red, R, segs=3)
    make_rounded_box(
        "backrest",
        (W, BACK_T, H),
        to_blender(0, H / 2, -D / 2 + BACK_T / 2 + 0.005),
        red,
        min(R, BACK_T * 0.45),
        segs=3,
    )

    export_glb("armless-sofa/armless-sofa.glb")


# ---------------------------------------------------------------------------
# 4. Rounded rectangle helper in 2D (XY plane)
# ---------------------------------------------------------------------------
def rounded_rect_pts(w: float, h: float, r: float, segs_per_corner: int = 12) -> list[tuple[float, float]]:
    hw, hh = w / 2.0, h / 2.0
    r = min(r, hw - 1e-4, hh - 1e-4)
    corners = [
        (hw - r, -hh + r, -math.pi / 2, 0.0),
        (hw - r, hh - r, 0.0, math.pi / 2),
        (-hw + r, hh - r, math.pi / 2, math.pi),
        (-hw + r, -hh + r, math.pi, 1.5 * math.pi),
    ]
    pts = []
    for cx, cy, a0, a1 in corners:
        for i in range(segs_per_corner + 1):
            a = a0 + (a1 - a0) * (i / segs_per_corner)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    # Deduplicate consecutive identical points
    clean = []
    for p in pts:
        if not clean or (abs(p[0] - clean[-1][0]) > 1e-6 or abs(p[1] - clean[-1][1]) > 1e-6):
            clean.append(p)
    if len(clean) > 1 and abs(clean[0][0] - clean[-1][0]) < 1e-6 and abs(clean[0][1] - clean[-1][1]) < 1e-6:
        clean.pop()
    return clean


def extrude_2d_ring(name: str, outer_pts, inner_pts, z_min: float, z_max: float, mat, smooth: bool = False):
    bm = bmesh.new()
    n = len(outer_pts)
    if inner_pts is None:
        v_bot = [bm.verts.new((x, y, z_min)) for x, y in outer_pts]
        v_top = [bm.verts.new((x, y, z_max)) for x, y in outer_pts]
        bm.faces.new(list(reversed(v_bot)))
        bm.faces.new(v_top)
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((v_bot[i], v_bot[j], v_top[j], v_top[i]))
    else:
        assert len(inner_pts) == n
        ob = [bm.verts.new((x, y, z_min)) for x, y in outer_pts]
        ot = [bm.verts.new((x, y, z_max)) for x, y in outer_pts]
        ib = [bm.verts.new((x, y, z_min)) for x, y in inner_pts]
        it = [bm.verts.new((x, y, z_max)) for x, y in inner_pts]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ob[i], ob[j], ot[j], ot[i]))
            bm.faces.new((it[i], it[j], ib[j], ib[i]))
            bm.faces.new((ot[i], ot[j], it[j], it[i]))
            bm.faces.new((ib[i], ib[j], ob[j], ob[i]))
    return add_mesh_object(name, bm, mat, smooth=smooth)


# ---------------------------------------------------------------------------
# 4. Bathtub (0.70 x 0.50 x 1.50 m, outer/inner/rim/water)
# ---------------------------------------------------------------------------
def build_bathtub():
    reset_scene()
    TUB_W, TUB_L, TUB_H, T, RC = 0.70, 1.50, 0.50, 0.04, 0.35
    WATER_H = 0.38
    RC_IN = max(RC - T, 0.02)
    rim_r = T / 2.0

    tub_mat = make_material("tub_outer", srgb_hex(0xD9C9A5), roughness=0.55)
    inner_mat = make_material("tub_inner", srgb_hex(0xBDA575), roughness=0.65)
    water_mat = make_material("tub_water", srgb_hex(0x1A6FA8), roughness=0.05, metallic=0.15, alpha=0.45)

    # Note: in Blender XY corresponds to Three.js (X, -Z)
    outer_pts = rounded_rect_pts(TUB_W, TUB_L, RC, 16)
    inner_pts = rounded_rect_pts(TUB_W - 2 * T, TUB_L - 2 * T, RC_IN, 16)
    extrude_2d_ring("tub_walls", outer_pts, inner_pts, 0.0, TUB_H - rim_r, tub_mat, smooth=True)
    extrude_2d_ring("tub_bottom", inner_pts, None, 0.0, T, inner_mat, smooth=False)

    # Smooth rounded rim tube around top
    rim_pts = rounded_rect_pts(TUB_W - T, TUB_L - T, RC - rim_r, 16)
    bm = bmesh.new()
    n_ring = len(rim_pts)
    n_prof = 12
    rings = []
    for i, (px, py) in enumerate(rim_pts):
        p_prev = Vector((*rim_pts[(i - 1) % n_ring], 0.0))
        p_next = Vector((*rim_pts[(i + 1) % n_ring], 0.0))
        tangent = (p_next - p_prev).normalized()
        normal_xy = Vector((tangent.y, -tangent.x, 0.0)).normalized()
        up = Vector((0.0, 0.0, 1.0))
        center = Vector((px, py, TUB_H - rim_r))
        ring = []
        for k in range(n_prof):
            a = 2.0 * math.pi * k / n_prof
            pt = center + normal_xy * (rim_r * math.cos(a)) + up * (rim_r * math.sin(a))
            ring.append(bm.verts.new(pt))
        rings.append(ring)
    for i in range(n_ring):
        j = (i + 1) % n_ring
        for k in range(n_prof):
            l = (k + 1) % n_prof
            bm.faces.new((rings[i][k], rings[j][k], rings[j][l], rings[i][l]))
    add_mesh_object("tub_rim", bm, tub_mat, smooth=True)

    # Water surface
    water_inset = 0.005
    w_pts = rounded_rect_pts(
        TUB_W - 2 * (T + water_inset),
        TUB_L - 2 * (T + water_inset),
        RC_IN - water_inset,
        16,
    )
    bm_w = bmesh.new()
    verts = [bm_w.verts.new((x, y, WATER_H)) for x, y in w_pts]
    bm_w.faces.new(verts)
    add_mesh_object("tub_water", bm_w, water_mat, smooth=False)

    export_glb("bathtub/bathtub.glb")


# ---------------------------------------------------------------------------
# 5. Counter (1.02 x 0.03 x 0.62 m, white slab with sink cutout)
# ---------------------------------------------------------------------------
def build_counter():
    reset_scene()
    W, D, SLAB = 1.02, 0.62, 0.03
    HOLE_W, HOLE_D, R = 0.28, 0.446, 0.05
    # In Counter.tsx: shape is XY, rotated -90 deg around X -> Blender XY is (X, -Z)
    # HOLE_CX = -0.30, HOLE_CZ = +0.04 in shape Y (= +0.04 in Blender Y)
    HX, HY = -0.30, 0.04

    mat = make_material("counter_white", (1.0, 1.0, 1.0), roughness=0.25, metallic=0.05)

    # Create slab with hole using Blender curve 2D -> convert to mesh -> solidify
    curve_data = bpy.data.curves.new("counter_curve", type="CURVE")
    curve_data.dimensions = "2D"
    curve_data.fill_mode = "BOTH"

    outer = curve_data.splines.new("POLY")
    outer_pts = [(-W / 2, -D / 2), (W / 2, -D / 2), (W / 2, D / 2), (-W / 2, D / 2)]
    outer.points.add(len(outer_pts) - 1)
    for i, (x, y) in enumerate(outer_pts):
        outer.points[i].co = (x, y, 0, 1)
    outer.use_cyclic_u = True

    hole_pts = rounded_rect_pts(HOLE_W, HOLE_D, R, 10)
    hole = curve_data.splines.new("POLY")
    hole.points.add(len(hole_pts) - 1)
    for i, (x, y) in enumerate(hole_pts):
        hole.points[i].co = (HX + x, HY + y, 0, 1)
    hole.use_cyclic_u = True

    obj = bpy.data.objects.new("counter", curve_data)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj.data.materials.append(mat)

    solid = obj.modifiers.new("Solidify", "SOLIDIFY")
    solid.thickness = SLAB
    solid.offset = 1.0  # extrude from Z=0 to Z=+SLAB
    bpy.ops.object.modifier_apply(modifier=solid.name)

    export_glb("counter/counter.glb")


# ---------------------------------------------------------------------------
# 6. MllseG2Pro (0.087 x 0.039 x 0.087 m + 0.004 m feet)
# ---------------------------------------------------------------------------
def build_mllse_g2_pro():
    reset_scene()
    W, D, H, R = 0.087, 0.087, 0.039, 0.007
    FOOT_H = 0.004

    navy_blue = make_material("mllse_navy", srgb_hex(0x0D1B2E), roughness=0.35, metallic=0.55)
    navy_dark = make_material("mllse_dark", srgb_hex(0x090F1A), roughness=0.5, metallic=0.4)
    red_btn = make_material("mllse_red", srgb_hex(0xCC1A0A), roughness=0.5, metallic=0.2)
    mesh_gray = make_material("mllse_gray", srgb_hex(0x2A3040), roughness=0.7, metallic=0.3)
    led_green = make_material(
        "mllse_led",
        srgb_hex(0x00FF88),
        roughness=0.3,
        emission=srgb_hex(0x00FF88),
        emission_strength=0.8,
    )
    rubber_foot = make_material("mllse_foot", srgb_hex(0x111111), roughness=0.95)

    # Rounded body sitting at Y = FOOT_H .. FOOT_H + H
    pts = rounded_rect_pts(W, D, R, 8)
    extrude_2d_ring("body", pts, None, FOOT_H, FOOT_H + H, navy_blue, smooth=True)

    # Top plate & 5 vent slots
    make_box("top_plate", (W - 0.004, D - 0.004, 0.0002), to_blender(0, FOOT_H + H + 0.0001, 0), navy_dark)
    for i in range(-2, 3):
        make_box(
            f"vent_{i}",
            (0.005, D - 0.025, 0.0005),
            to_blender(i * 0.011, FOOT_H + H + 0.0002, 0),
            mesh_gray,
        )

    # Front (-Z) red button, green LED, 2 USB ports
    front_z = -D / 2.0
    make_cylinder_between(
        "power_btn",
        to_blender(-W / 2 + 0.014, FOOT_H + H / 2, front_z),
        to_blender(-W / 2 + 0.014, FOOT_H + H / 2, front_z - 0.0024),
        0.0038,
        20,
        red_btn,
    )
    make_cylinder_between(
        "status_led",
        to_blender(-W / 2 + 0.024, FOOT_H + H / 2, front_z),
        to_blender(-W / 2 + 0.024, FOOT_H + H / 2, front_z - 0.0017),
        0.0012,
        12,
        led_green,
    )
    make_box("usb1", (0.010, 0.0015, 0.005), to_blender(0.008, FOOT_H + H / 2, front_z - 0.001), mesh_gray)
    make_box("usb2", (0.007, 0.0015, 0.004), to_blender(0.020, FOOT_H + H / 2, front_z - 0.001), mesh_gray)

    # 4 rubber feet (Y = 0 .. FOOT_H)
    for idx, (fx, fz) in enumerate(
        [
            (-W / 2 + 0.01, -D / 2 + 0.01),
            (W / 2 - 0.01, -D / 2 + 0.01),
            (-W / 2 + 0.01, D / 2 - 0.01),
            (W / 2 - 0.01, D / 2 - 0.01),
        ]
    ):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=14, radius1=0.0065, radius2=0.0055, depth=FOOT_H)
        bmesh.ops.translate(bm, vec=to_blender(fx, FOOT_H / 2, fz), verts=bm.verts)
        add_mesh_object(f"foot_{idx}", bm, rubber_foot, smooth=True)

    export_glb("mllse-g2-pro/mllse-g2-pro.glb")


# ---------------------------------------------------------------------------
# 7. MatterHub (0.090 x 0.022 x 0.090 m)
# ---------------------------------------------------------------------------
def build_matter_hub():
    reset_scene()
    W, D, H, R = 0.090, 0.090, 0.022, 0.0025

    body_mat = make_material("hub_body", srgb_hex(0xF6F6F6), roughness=0.55, metallic=0.05)
    top_mat = make_material("hub_top", srgb_hex(0xFBFBFB), roughness=0.45, metallic=0.05)
    port_shell = make_material("hub_shell", srgb_hex(0x1A1A1A), roughness=0.35, metallic=0.6)
    port_hole = make_material("hub_hole", srgb_hex(0x050505), roughness=0.95)
    pin_silver = make_material("hub_pin", srgb_hex(0xC8C8C8), roughness=0.25, metallic=0.75)
    reset_gray = make_material("hub_reset", srgb_hex(0x6A6A6A), roughness=0.7, metallic=0.1)

    pts = rounded_rect_pts(W, D, R, 6)
    body = extrude_2d_ring("body", pts, None, 0.0, H, body_mat, smooth=True)
    bev = body.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.0006
    bev.segments = 2
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.modifier_apply(modifier=bev.name)

    make_box("top_plate", (W - 0.004, D - 0.004, 0.0002), to_blender(0, H + 0.0001, 0), top_mat)

    front_z = -D / 2.0
    y_port = H * 0.45
    x_reset, x_usbc, x_lan = -0.026, -0.009, 0.018

    # RESET pinhole
    make_cylinder_between(
        "reset_ring",
        to_blender(x_reset, y_port + 0.0005, front_z + 0.0006),
        to_blender(x_reset, y_port + 0.0005, front_z - 0.0002),
        0.0009,
        16,
        reset_gray,
    )
    make_cylinder_between(
        "reset_hole",
        to_blender(x_reset, y_port + 0.0005, front_z + 0.0010),
        to_blender(x_reset, y_port + 0.0005, front_z - 0.00025),
        0.0005,
        12,
        port_hole,
    )

    # USB-C
    make_box("usbc_shell", (0.0092, 0.0006, 0.0036), to_blender(x_usbc, y_port, front_z - 0.0002), port_shell)
    make_box("usbc_hole", (0.0078, 0.0012, 0.0024), to_blender(x_usbc, y_port, front_z - 0.0003), port_hole)
    make_box("usbc_tongue", (0.0050, 0.0010, 0.0008), to_blender(x_usbc, y_port, front_z - 0.0004), pin_silver)

    # RJ45 LAN
    make_box("lan_shell", (0.0135, 0.0006, 0.0105), to_blender(x_lan, y_port, front_z - 0.0002), port_shell)
    make_box("lan_hole", (0.0115, 0.0016, 0.0085), to_blender(x_lan, y_port, front_z - 0.0003), port_hole)
    make_box("lan_tab", (0.0050, 0.0008, 0.0018), to_blender(x_lan, y_port - 0.0050, front_z - 0.0004), port_shell)
    for i in range(8):
        make_box(
            f"lan_pin_{i}",
            (0.0005, 0.0008, 0.0018),
            to_blender(x_lan - 0.0042 + i * 0.0012, y_port + 0.0032, front_z - 0.0005),
            pin_silver,
        )

    export_glb("matter-hub/matter-hub.glb")


# ---------------------------------------------------------------------------
# 8. LaserDistanceMaster (0.042 x 0.100 x 0.025 m, with PIL textures)
# ---------------------------------------------------------------------------
def pil_to_blender_image(name: str, img: Image.Image) -> bpy.types.Image:
    tmp_dir = Path("/tmp/laser_tex")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    tmp_path = tmp_dir / f"{name}.png"
    img.save(tmp_path, format="PNG")
    b_img = bpy.data.images.load(str(tmp_path), check_existing=False)
    b_img.name = name
    b_img.pack()
    return b_img


def make_laser_textures():
    # 1. LCD
    lcd = Image.new("RGB", (384, 384), (10, 32, 48))
    d = ImageDraw.Draw(lcd)
    for y in range(384):
        t = y / 383.0
        r = int(16 * (1 - t) + 10 * t)
        g = int(50 * (1 - t) + 32 * t)
        b = int(70 * (1 - t) + 48 * t)
        d.line([(0, y), (383, y)], fill=(r, g, b))
    d.rectangle([6, 6, 377, 377], outline=(29, 74, 100), width=4)
    # Wi-Fi
    for i in range(3):
        rad = 12 + i * 12
        d.arc([60 - rad, 90 - rad, 60 + rad, 90 + rad], 225, 315, fill=(182, 230, 245), width=4)
    d.ellipse([55, 85, 65, 95], fill=(182, 230, 245))
    # Battery
    d.rectangle([280, 60, 360, 92], outline=(182, 230, 245), width=3)
    d.rectangle([360, 68, 368, 84], fill=(182, 230, 245))
    for bx in (285, 310, 335):
        d.rectangle([bx, 65, bx + 22, 87], fill=(182, 230, 245))
    try:
        font_sm = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", 24)
        font_md = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSansMono-Bold.ttf", 52)
        font_lg = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSansMono-Bold.ttf", 82)
        font_logo = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSans-BoldOblique.ttf", 56)
        font_btn = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", 28)
    except OSError:
        font_sm = font_md = font_lg = font_logo = font_btn = ImageFont.load_default()

    d.text((36, 154), "max", fill=(182, 230, 245), font=font_sm)
    d.text((36, 200), "min", fill=(182, 230, 245), font=font_sm)
    d.text((135, 140), "2.366", fill=(205, 242, 250), font=font_md)
    d.text((335, 158), "m", fill=(205, 242, 250), font=font_sm)
    d.text((135, 195), "0.564", fill=(205, 242, 250), font=font_md)
    d.text((335, 213), "m", fill=(205, 242, 250), font=font_sm)
    d.text((52, 260), "2.365", fill=(230, 251, 255), font=font_lg)
    d.text((335, 298), "m", fill=(230, 251, 255), font=font_sm)

    # 2. Logo
    logo = Image.new("RGBA", (384, 96), (238, 238, 238, 255))
    dl = ImageDraw.Draw(logo)
    dl.text((28, 16), "Laserliner", fill=(242, 129, 25, 255), font=font_logo)
    dl.text((322, 16), "®", fill=(242, 129, 25, 255), font=font_sm)

    # 3. DIST button
    dist = Image.new("RGB", (256, 128), (242, 129, 25))
    dd = ImageDraw.Draw(dist)
    dd.text((90, 12), "DIST", fill=(32, 32, 32), font=font_btn)
    dd.line([(118, 58), (128, 48), (138, 58)], fill=(32, 32, 32), width=3)
    dd.ellipse([124, 64, 132, 72], fill=(32, 32, 32))
    dd.text((58, 86), "MIN/MAX", fill=(32, 32, 32), font=font_btn)

    # 4. Cube icon
    cube = Image.new("RGB", (128, 128), (246, 246, 246))
    dc = ImageDraw.Draw(cube)
    dc.polygon([(40, 50), (64, 38), (88, 50), (88, 90), (64, 102), (40, 90)], outline=(28, 28, 28), width=5)
    dc.line([(40, 50), (64, 62), (88, 50)], fill=(28, 28, 28), width=5)
    dc.line([(64, 62), (64, 102)], fill=(28, 28, 28), width=5)

    # 5. Arrow icon
    arrow = Image.new("RGB", (128, 128), (246, 246, 246))
    da = ImageDraw.Draw(arrow)
    da.line([(64, 28), (64, 100)], fill=(28, 28, 28), width=6)
    da.line([(48, 46), (64, 28), (80, 46)], fill=(28, 28, 28), width=6)
    da.line([(40, 100), (88, 100)], fill=(28, 28, 28), width=6)

    # 6. C/OFF icon
    coff = Image.new("RGB", (128, 128), (246, 246, 246))
    df = ImageDraw.Draw(coff)
    df.text((44, 18), "C", fill=(217, 46, 46), font=font_md)
    df.text((34, 78), "OFF", fill=(28, 28, 28), font=font_sm)

    return {
        "lcd": pil_to_blender_image("lcd_tex", lcd),
        "logo": pil_to_blender_image("logo_tex", logo),
        "dist": pil_to_blender_image("dist_tex", dist),
        "cube": pil_to_blender_image("cube_tex", cube),
        "arrow": pil_to_blender_image("arrow_tex", arrow),
        "coff": pil_to_blender_image("coff_tex", coff),
    }


def make_front_plane(name: str, w: float, h: float, center_xyz, mat):
    """Create a UV-mapped vertical quad facing -Z in Three.js (+Y in Blender)."""
    bm = bmesh.new()
    hw, hh = w / 2.0, h / 2.0
    # Facing +Y in Blender (towards front camera looking from +Y towards origin)
    v0 = bm.verts.new((hw, 0.0, -hh))
    v1 = bm.verts.new((-hw, 0.0, -hh))
    v2 = bm.verts.new((-hw, 0.0, hh))
    v3 = bm.verts.new((hw, 0.0, hh))
    face = bm.faces.new((v0, v1, v2, v3))
    uv_layer = bm.loops.layers.uv.new("UVMap")
    uvs = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    for loop, uv in zip(face.loops, uvs):
        loop[uv_layer].uv = uv
    bmesh.ops.translate(bm, vec=to_blender(*center_xyz), verts=bm.verts)
    return add_mesh_object(name, bm, mat)


def build_laser_distancemaster():
    reset_scene()
    W, H, D, R = 0.042, 0.100, 0.025, 0.0035
    texs = make_laser_textures()

    body_mat = make_material("laser_body", srgb_hex(0x2C2E33), roughness=0.55, metallic=0.1)
    grip_mat = make_material("laser_grip", srgb_hex(0x1A1B1F), roughness=0.85)
    rib_mat = make_material("laser_rib", srgb_hex(0x0A0A0A), roughness=0.9)
    panel_mat = make_material("laser_panel", srgb_hex(0xEEEEEE), roughness=0.45, metallic=0.05)
    top_mat = make_material("laser_top", srgb_hex(0x16181B), roughness=0.5, metallic=0.25)
    lens_blk = make_material("laser_lens_blk", srgb_hex(0x080808), roughness=0.35, metallic=0.5)
    lens_red = make_material(
        "laser_lens_red",
        srgb_hex(0xB02020),
        roughness=0.25,
        metallic=0.3,
        emission=srgb_hex(0x441010),
        emission_strength=0.4,
    )
    screw_mat = make_material("laser_screw", srgb_hex(0x444444), roughness=0.4, metallic=0.6)
    bezel_mat = make_material("laser_bezel", srgb_hex(0x0A0A0A), roughness=0.45)

    lcd_mat = make_material("laser_lcd", (1, 1, 1), roughness=0.45, emission=(1, 1, 1), emission_strength=0.35, image=texs["lcd"])
    logo_mat = make_material("laser_logo", (1, 1, 1), roughness=0.5, image=texs["logo"])
    dist_mat = make_material("laser_dist", (1, 1, 1), roughness=0.4, metallic=0.15, image=texs["dist"])
    cube_mat = make_material("laser_cube", (1, 1, 1), roughness=0.5, image=texs["cube"])
    arrow_mat = make_material("laser_arrow", (1, 1, 1), roughness=0.5, image=texs["arrow"])
    coff_mat = make_material("laser_coff", (1, 1, 1), roughness=0.5, image=texs["coff"])

    # Main body (upright: X=W, Y=H, Z=D)
    make_box("body", (W, D, H), to_blender(0, H / 2, 0), body_mat, bevel=0.0016, bevel_segs=2)

    # Side rubber grips & ribs
    for side_name, sx in (("l", -W / 2 + 0.0005), ("r", W / 2 - 0.0005)):
        make_box(f"grip_{side_name}", (0.0045, D + 0.0018, H * 0.78), to_blender(sx, H / 2, 0), grip_mat)
        for ri, dy in enumerate((-0.016, -0.008, 0.0, 0.008, 0.016)):
            rx = (W / 2 + 0.001) * (-1 if side_name == "l" else 1)
            make_box(f"rib_{side_name}_{ri}", (0.0018, D + 0.0022, 0.0016), to_blender(rx, H / 2 + dy, 0), rib_mat)

    # Top cap & lenses
    top_cap_h = 0.0055
    make_box("top_cap", (W - 0.001, D - 0.0005, top_cap_h), to_blender(0, H - top_cap_h / 2, 0), top_mat)
    make_cylinder_between("lens_laser_blk", to_blender(-0.0085, H - 0.0002, 0), to_blender(-0.0085, H + 0.0006, 0), 0.004, 22, lens_blk)
    make_cylinder_between("lens_laser_red", to_blender(-0.0085, H + 0.0004, 0), to_blender(-0.0085, H + 0.0008, 0), 0.0022, 18, lens_red)
    make_cylinder_between("lens_sensor", to_blender(0.0085, H - 0.0002, 0), to_blender(0.0085, H + 0.0006, 0), 0.004, 22, lens_blk)
    make_cylinder_between("screw", to_blender(0, H, 0), to_blender(0, H + 0.0004, 0), 0.0012, 12, screw_mat)

    # Front white panel (-Z)
    front_z = -D / 2.0
    panel_w = W - 0.014
    panel_y0, panel_y1 = 0.006, H - 0.009
    panel_h = panel_y1 - panel_y0
    panel_cy = (panel_y0 + panel_y1) / 2.0
    make_box("front_panel", (panel_w, 0.0012, panel_h), to_blender(0, panel_cy, front_z - 0.0006), panel_mat)

    logo_y = panel_y1 - 0.0045
    lcd_w, lcd_h = panel_w - 0.002, 0.036
    lcd_y = logo_y - 0.004 - lcd_h / 2.0
    dist_y = lcd_y - lcd_h / 2.0 - 0.010
    cube_y = dist_y - 0.0105
    arrow_y = cube_y - 0.0095
    c_y = arrow_y - 0.0095

    make_front_plane("logo", panel_w - 0.004, 0.0055, (0, logo_y, front_z - 0.0013), logo_mat)
    make_box("lcd_bezel", (lcd_w + 0.0012, 0.0005, lcd_h + 0.0012), to_blender(0, lcd_y, front_z - 0.0013), bezel_mat)
    make_front_plane("lcd", lcd_w, lcd_h, (0, lcd_y, front_z - 0.00165), lcd_mat)

    # Orange DIST button
    dist_base_mat = make_material("laser_dist_base", srgb_hex(0xF28119), roughness=0.4, metallic=0.15)
    make_box("dist_btn_base", (panel_w - 0.006, 0.0018, 0.0085), to_blender(0, dist_y, front_z - 0.0016), dist_base_mat)
    make_front_plane("dist_btn_face", panel_w - 0.006, 0.0085, (0, dist_y, front_z - 0.00255), dist_mat)

    # 3 white icon buttons
    for bname, by, bmat in (("cube_btn", cube_y, cube_mat), ("arrow_btn", arrow_y, arrow_mat), ("coff_btn", c_y, coff_mat)):
        make_box(f"{bname}_base", (panel_w - 0.006, 0.0015, 0.0070), to_blender(0, by, front_z - 0.0015), panel_mat)
        make_front_plane(f"{bname}_face", 0.006, 0.006, (0, by, front_z - 0.0023), bmat)

    # Strap loop
    bm_t = bmesh.new()
    # Simple torus at bottom right
    n_maj, n_min = 16, 8
    r_maj, r_min = 0.0016, 0.0005
    rings = []
    for i in range(n_maj):
        a = 2 * math.pi * i / n_maj
        cx, cy = r_maj * math.cos(a), r_maj * math.sin(a)
        ring = []
        for k in range(n_min):
            b = 2 * math.pi * k / n_min
            px = (r_maj + r_min * math.cos(b)) * math.cos(a)
            py = (r_maj + r_min * math.cos(b)) * math.sin(a)
            pz = r_min * math.sin(b)
            ring.append(bm_t.verts.new((px, pz, py)))
        rings.append(ring)
    for i in range(n_maj):
        j = (i + 1) % n_maj
        for k in range(n_min):
            l = (k + 1) % n_min
            bm_t.faces.new((rings[i][k], rings[j][k], rings[j][l], rings[i][l]))
    bmesh.ops.translate(bm_t, vec=to_blender(W / 2 + 0.0018, 0.005, 0), verts=bm_t.verts)
    add_mesh_object("strap_loop", bm_t, grip_mat, smooth=True)

    export_glb("distancemaster-compact/distancemaster-compact.glb")


# ---------------------------------------------------------------------------
# 9. DoubleVenusPendant (0.030 x 0.040 x 0.0042 m, stainless steel)
# ---------------------------------------------------------------------------
def build_double_venus_pendant():
    reset_scene()
    steel = make_material("pendant_steel", srgb_hex(0xDEDEDE), roughness=0.18, metallic=0.95)

    S = 0.01
    dx = 0.575 * S
    Rout = 0.925 * S
    Rin = 0.700 * S
    Yc = 2.05 * S
    wStem = 0.225 * S
    wBar = 2.30 * S
    barBotY = 0.45 * S
    barTopY = 0.68 * S
    eyeletY = 3.06 * S
    eyeletRout = 0.23 * S
    eyeletRin = 0.11 * S
    half_t = 0.0009  # 1.8 mm total thickness

    def make_annulus(name: str, cx: float, cy: float, r_out: float, r_in: float, ht: float, segs: int = 64):
        outer_p = [(cx + r_out * math.cos(2 * math.pi * i / segs), cy + r_out * math.sin(2 * math.pi * i / segs)) for i in range(segs)]
        inner_p = [(cx + r_in * math.cos(2 * math.pi * i / segs), cy + r_in * math.sin(2 * math.pi * i / segs)) for i in range(segs)]
        return extrude_2d_ring(name, outer_p, inner_p, -ht, ht, steel, smooth=True)

    def make_rect_2d(name: str, x0: float, x1: float, y0: float, y1: float, ht: float):
        pts = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
        return extrude_2d_ring(name, pts, None, -ht, ht, steel, smooth=False)

    parts = [
        make_annulus("ring_l", -dx, Yc, Rout, Rin, half_t, 64),
        make_annulus("ring_r", dx, Yc, Rout, Rin, half_t * 0.995, 64),
        make_annulus("eyelet", 0.0, eyeletY, eyeletRout, eyeletRin, half_t * 0.99, 32),
        make_rect_2d("stem_l", -dx - wStem / 2, -dx + wStem / 2, 0.0, Yc - Rin * 0.9, half_t * 0.985),
        make_rect_2d("stem_r", dx - wStem / 2, dx + wStem / 2, 0.0, Yc - Rin * 0.9, half_t * 0.985),
        make_rect_2d("bar", -wBar / 2, wBar / 2, barBotY, barTopY, half_t * 0.98),
    ]

    # Join all parts into one clean mesh and rotate +90° X so 2D Y -> glTF +Y
    bpy.ops.object.select_all(action="DESELECT")
    for obj in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    body = parts[0]
    body.name = "pendant_body"
    body.rotation_euler = (math.pi / 2, 0.0, 0.0)
    bpy.ops.object.transform_apply(rotation=True)

    # Bail (bélière) teardrop loop in Y-Z plane (Three.js) -> Blender (-Z, Y)
    N = 40
    thickness = 0.0006
    bm_b = bmesh.new()
    rings = []
    for i in range(N):
        t = (i / N) * 2.0 * math.pi
        w = 0.0016 + (0.0042 - 0.0016) * (math.sin(t / 2.0) ** 1.2)
        cy, ry, rz = 0.0348, 0.0044, 0.0018
        y = cy - ry * math.cos(t) + 0.0005 * math.sin(t / 2.0)
        z = rz * math.sin(t)
        dt = 0.001
        yn = cy - ry * math.cos(t + dt) + 0.0005 * math.sin((t + dt) / 2.0)
        zn = rz * math.sin(t + dt)
        ty, tz = yn - y, zn - z
        length = math.hypot(ty, tz)
        ny, nz = -tz / length, ty / length
        hw, ht = w / 2.0, thickness / 2.0
        pts_3d = [
            to_blender(-hw, y + ny * ht, z + nz * ht),
            to_blender(hw, y + ny * ht, z + nz * ht),
            to_blender(hw, y - ny * ht, z - nz * ht),
            to_blender(-hw, y - ny * ht, z - nz * ht),
        ]
        rings.append([bm_b.verts.new(p) for p in pts_3d])
    for i in range(N):
        j = (i + 1) % N
        for k in range(4):
            l = (k + 1) % 4
            bm_b.faces.new((rings[i][k], rings[i][l], rings[j][l], rings[j][k]))
    add_mesh_object("pendant_bail", bm_b, steel, smooth=True)

    export_glb("double-venus-pendant/double-venus-pendant.glb")


if __name__ == "__main__":
    build_shoe_hat_rack()
    build_meuble_t()
    build_armless_sofa()
    build_bathtub()
    build_counter()
    build_mllse_g2_pro()
    build_matter_hub()
    build_laser_distancemaster()
    build_double_venus_pendant()
