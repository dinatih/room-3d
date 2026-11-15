"""Generate a faithful 3D GLB of the Jordan Hex Mule SP University Red (FJ0603-600, EU 44.5)."""
import math
import os
import tempfile
import bpy
import bmesh
from mathutils import Vector
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT_PATH = "/home/dinatih/Projects/room-3d/public/items/jordan-hex-mule/JordanHexMule.glb"
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
TEX_DIR = tempfile.mkdtemp(prefix="jordan_hex_mule_tex_")

# ---------------------------------------------------------------------------
# Shoe Metric Constants (EU 44.5 / CM 28.5, Blender Z=up, -Y=toe, +Y=heel)
# Right shoe base: -X = lateral (outer), +X = medial (inner)
# ---------------------------------------------------------------------------
L_SHOE = 0.288          # 28.8 cm outer length
Y_HEEL = +0.144
Y_TOE = -0.144
PAIR_HALF_X = 0.072     # pair width ~27.4 cm with ~1.4 cm inner gap


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def smoothstep(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def _smooth_max(a, b, k=0.008):
    h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0)
    return lerp(a, b, h) + k * h * (1.0 - h)


# ---------------------------------------------------------------------------
# Parametric Right-Shoe Contour & Profiles (calibrated from Nike + StockX shots)
# ---------------------------------------------------------------------------
def foot_bounds_x(s):
    """
    Return (x_lat, x_med) for Right shoe (-X lateral, +X medial) at s in [0, 1].
    Calibrated from hex_mule_top.png silhouette measurements:
      - Heel (s=0.02): [-0.134, +0.134] * L
      - Lateral hex apex (s=0.72): -0.246 * L
      - Front-lateral toe corner (s=0.975): -0.107 * L
      - Front-medial toe corner (s=0.995): +0.148 * L
    """
    s_apex = 0.720
    x_lat_heel = -0.134 * L_SHOE
    x_lat_apex = -0.246 * L_SHOE
    x_lat_toe = -0.107 * L_SHOE

    line1 = x_lat_heel + (x_lat_apex - x_lat_heel) * (s / s_apex)
    line2 = x_lat_apex + (x_lat_toe - x_lat_apex) * ((s - s_apex) / (1.0 - s_apex))
    x_lat = _smooth_max(line1, line2, k=0.0045)

    if s <= 0.70:
        u = s / 0.70
        x_med = L_SHOE * (0.134 + 0.069 * math.pow(u, 0.92))
    else:
        u = (s - 0.70) / 0.30
        x_med = L_SHOE * (0.203 - 0.052 * math.pow(u, 1.05))

    # Crisp squared heel/toe with tight 4 mm rounded corner arc
    if s < 0.015:
        u_c = s / 0.015
        inset = 0.0042 * (1.0 - math.sqrt(max(0.0, 1.0 - (1.0 - u_c) ** 2)))
        x_lat += inset
        x_med -= inset
    if s > 0.985:
        u_c = (1.0 - s) / 0.015
        inset = 0.0040 * (1.0 - math.sqrt(max(0.0, 1.0 - (1.0 - u_c) ** 2)))
        x_lat += inset
        x_med -= inset

    return x_lat, x_med


def footprint_xy(s, u):
    """Map s in [0, 1] and u in [-1, 1] (-1=lat, +1=med) to (x, y)."""
    x_lat, x_med = foot_bounds_x(s)
    x = 0.5 * (1.0 - u) * x_lat + 0.5 * (1.0 + u) * x_med
    toe_skew = -0.013 * (1.0 - u) * smoothstep(0.75, 1.0, s)
    s_eff = clamp(s + toe_skew, 0.0, 1.02)
    y = Y_HEEL - s_eff * L_SHOE
    return x, y


GROOVE_S = [0.118, 0.262, 0.410, 0.552, 0.703, 0.846]


def sole_bottom_z(s, u):
    """Outsole bottom Z(s, u) with heel bevel, toe rocker, and 6 angled flex grooves."""
    heel_up = 0.011 * math.pow(1.0 - smoothstep(0.0, 0.078, s), 1.45)
    toe_up = 0.0165 * math.pow(smoothstep(0.79, 1.0, s), 1.65)
    base_z = heel_up + toe_up

    groove_dip = 0.0
    half_w = 0.0105
    for sg in GROOVE_S:
        sg_u = sg + 0.0045 * u
        d = abs(s - sg_u)
        if d < half_w:
            t = d / half_w
            profile = math.pow(1.0 - t * t, 0.65)
            groove_dip = max(groove_dip, 0.0043 * profile)

    return base_z + groove_dip


def sidewall_ridge_z(s, u):
    """Sweeping wave ridge Z(s, u) around the platform rim."""
    heel_rise = 0.038 + 0.0045 * smoothstep(0.02, 0.25, s)
    arch_wave = 0.0155 * math.exp(-((s - 0.515) / 0.165) ** 2)
    toe_drop = -0.0035 * smoothstep(0.68, 0.96, s)
    med_bias = 0.0018 * max(0.0, u) * math.exp(-((s - 0.54) / 0.20) ** 2)
    toe_lip = 0.0012 * smoothstep(0.92, 1.0, s)
    return heel_rise + arch_wave + toe_drop + med_bias + toe_lip


def rim_u_inner(s, side):
    """Inner boundary |u| of the flat-beveled perimeter shelf at station s."""
    x_lat, x_med = foot_bounds_x(s)
    half_w = 0.5 * (x_med - x_lat)
    if side < 0:
        w_shelf = (
            0.0085
            + 0.0075 * math.exp(-((s - 0.72) / 0.13) ** 2)
            + 0.0020 * smoothstep(0.82, 0.98, s)
        )
    else:
        w_shelf = (
            0.0080
            - 0.0038 * math.exp(-((s - 0.60) / 0.22) ** 2)
            + 0.0020 * smoothstep(0.84, 0.98, s)
        )
    return clamp(1.0 - w_shelf / max(0.020, half_w), 0.35, 0.94)


def footbed_z(s, u):
    """Sculpted ergonomic concave footbed floor inside the tray & tunnel."""
    heel_base = 0.0225 + 0.0035 * math.exp(-((s - 0.40) / 0.14) ** 2)
    med_arch = 0.0022 * smoothstep(0.0, 0.8, u) * math.exp(-((s - 0.42) / 0.15) ** 2)
    toe_spring = 0.0085 * math.pow(smoothstep(0.80, 1.0, s), 1.6)
    u_lat_in = rim_u_inner(s, -1)
    u_med_in = rim_u_inner(s, +1)
    u_norm = (2.0 * (u - (-u_lat_in)) / max(0.2, u_lat_in + u_med_in)) - 1.0
    bowl = 0.0042 * math.pow(clamp(abs(u_norm), 0.0, 1.0), 2.4)
    heel_cup = 0.0055 * math.pow(1.0 - smoothstep(0.032, 0.11, s), 2.0)
    return heel_base + med_arch + toe_spring + bowl + heel_cup


def platform_deck_z(s, u):
    """Continuous top surface of Platform Base (rim shelf + recessed footbed basin)."""
    z_rim = sidewall_ridge_z(s, u)
    z_fb = footbed_z(s, u)

    u_lat_in = rim_u_inner(s, -1)
    u_med_in = rim_u_inner(s, +1)

    if u < 0:
        t_u = smoothstep(u_lat_in - 0.14, u_lat_in, -u)
    else:
        t_u = smoothstep(u_med_in - 0.14, u_med_in, u)

    t_heel = 1.0 - smoothstep(0.024, 0.070, s)
    t_toe = smoothstep(0.915, 0.952, s)
    t_rim = max(t_u, t_heel, t_toe)
    return lerp(z_fb, z_rim, t_rim)


# ---------------------------------------------------------------------------
# Build Platform Base Watertight Manifold Solid (Right Shoe)
# ---------------------------------------------------------------------------
def build_right_platform_solid():
    bm = bmesh.new()

    s_set = set()
    for i in range(96):
        s_set.add(round(i / 95.0, 5))
    for sg in GROOVE_S:
        for off in (-0.015, -0.011, -0.008, -0.004, 0.0, 0.004, 0.008, 0.011, 0.015):
            s_set.add(round(clamp(sg + off, 0.0, 1.0), 5))
    for extra in (0.004, 0.009, 0.015, 0.028, 0.042, 0.925, 0.945, 0.965, 0.985, 0.994):
        s_set.add(extra)
    s_vals = sorted(s_set)
    n_s = len(s_vals)

    u_vals = [-1.0 + 2.0 * (j / 36.0) for j in range(37)]
    n_u = len(u_vals)
    n_z = 8

    rings = []
    for s in s_vals:
        ring = []
        for u in u_vals:
            x, y = footprint_xy(s, u)
            z = platform_deck_z(s, u)
            ring.append(bm.verts.new((x, y, z)))

        x_m, y_m = footprint_xy(s, 1.0)
        z_m_top = platform_deck_z(s, 1.0)
        z_m_bot = sole_bottom_z(s, 1.0)
        for iz in range(1, n_z):
            fz = iz / n_z
            bevel_in = 0.0018 * (math.pow(max(0.0, 1.0 - fz / 0.14), 2.0) + math.pow(max(0.0, (fz - 0.86) / 0.14), 2.0))
            flare_out = 0.0016 * (1.0 - fz)
            z = lerp(z_m_top, z_m_bot, fz)
            ring.append(bm.verts.new((x_m + flare_out - bevel_in, y_m, z)))

        for u in reversed(u_vals):
            x, y = footprint_xy(s, u)
            z = sole_bottom_z(s, u)
            ring.append(bm.verts.new((x, y, z)))

        x_l, y_l = footprint_xy(s, -1.0)
        z_l_bot = sole_bottom_z(s, -1.0)
        z_l_top = platform_deck_z(s, -1.0)
        for iz in range(1, n_z):
            fz = iz / n_z
            bevel_in = 0.0018 * (math.pow(max(0.0, 1.0 - fz / 0.14), 2.0) + math.pow(max(0.0, (fz - 0.86) / 0.14), 2.0))
            flare_out = 0.0016 * fz
            z = lerp(z_l_bot, z_l_top, fz)
            ring.append(bm.verts.new((x_l - flare_out + bevel_in, y_l, z)))

        rings.append(ring)

    m_ring = len(rings[0])
    for i in range(n_s - 1):
        r0 = rings[i]
        r1 = rings[i + 1]
        for j in range(m_ring):
            nj = (j + 1) % m_ring
            bm.faces.new((r0[j], r0[nj], r1[nj], r1[j]))

    def cap_end(ring, is_toe):
        top_row = ring[0:n_u]
        med_col = ring[n_u:n_u + n_z - 1]
        bot_row = list(reversed(ring[n_u + n_z - 1:2 * n_u + n_z - 1]))
        lat_col = list(reversed(ring[2 * n_u + n_z - 1:]))

        grid = [top_row]
        for iz in range(1, n_z):
            fz = iz / n_z
            row = [lat_col[iz - 1]]
            for ju in range(1, n_u - 1):
                p_top = top_row[ju].co
                p_bot = bot_row[ju].co
                p = p_top.lerp(p_bot, fz)
                p.y += (-0.0018 if is_toe else +0.0018) * math.sin(fz * math.pi)
                row.append(bm.verts.new(p))
            row.append(med_col[iz - 1])
            grid.append(row)
        grid.append(bot_row)

        for r in range(n_z):
            for c in range(n_u - 1):
                v00, v01 = grid[r][c], grid[r][c + 1]
                v11, v10 = grid[r + 1][c + 1], grid[r + 1][c]
                if is_toe:
                    bm.faces.new((v00, v10, v11, v01))
                else:
                    bm.faces.new((v00, v01, v11, v10))

    cap_end(rings[0], is_toe=False)
    cap_end(rings[-1], is_toe=True)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    if bm.calc_volume(signed=True) < 0:
        for f in bm.faces:
            f.normal_flip()
        bm.normal_update()
    return bm


# ---------------------------------------------------------------------------
# Build Upper Hood / Vamp Watertight Shell (Right Shoe)
# ---------------------------------------------------------------------------
def upper_crest_z(s):
    """Dorsal crest height Z(s) calibrated from stockx_angle_01.jpg."""
    s0 = 0.545
    s1 = 0.945
    u = clamp((s - s0) / (s1 - s0), 0.0, 1.0)
    z_top = 0.1045
    z_toe = 0.0415
    curve = math.pow(1.0 - u, 1.26) * (1.0 + 0.18 * u)
    return z_toe + (z_top - z_toe) * clamp(curve, 0.0, 1.0)


def build_right_upper_hood():
    """
    Build the sculpted closed-toe upper vamp hood as a closed watertight manifold solid.
    Tapers collar lip smoothly into the sweeping sidewall rim at |t| -> 1.
    """
    bm = bmesh.new()

    n_t = 44
    n_v = 36
    n_lip = 5

    t_vals = [-1.0 + 2.0 * (j / (n_t - 1)) for j in range(n_t)]

    def hood_outer_point(v, t):
        t_abs = abs(t)
        s_col_side = 0.342 if t < 0 else 0.362
        s_collar = s_col_side + (0.545 - s_col_side) * math.pow(math.cos(t_abs * math.pi * 0.5), 1.35)
        s_toe_base = 0.938 - 0.028 * math.pow(t_abs, 2.6)
        s = lerp(s_collar, s_toe_base, v)

        u_lat_base = -rim_u_inner(s, -1) + 0.015
        u_med_base = rim_u_inner(s, +1) - 0.015
        # Flare collar ends smoothly outward onto the heel sidewall rim crest at v->0, |t|->1
        collar_flare = (1.0 - smoothstep(0.0, 0.35, v)) * math.pow(t_abs, 3.0)
        u_lat_base = lerp(u_lat_base, -0.94, collar_flare)
        u_med_base = lerp(u_med_base, +0.94, collar_flare)
        toe_taper = 1.0 - 0.05 * math.pow(v, 3.0)
        u_mid = 0.5 * (u_lat_base + u_med_base)
        u_span = 0.5 * (u_med_base - u_lat_base) * toe_taper

        u_pos = u_mid + u_span * clamp(math.copysign(math.pow(abs(t), 0.86), t) + 0.06 * (1.0 - t * t), -1.0, 1.0)
        x, y = footprint_xy(s, u_pos)

        z_base_lat = sidewall_ridge_z(s, u_lat_base)
        z_base_med = sidewall_ridge_z(s, u_med_base)
        z_base = lerp(z_base_lat, z_base_med, 0.5 * (t + 1.0))

        z_crest = upper_crest_z(s)
        dome_fade = 1.0 - math.pow(smoothstep(0.84, 1.0, v), 1.8)
        arch_prof = math.pow(max(0.0, math.cos(t * math.pi * 0.5)), 1.28)
        fullness = 1.0 + 0.14 * (1.0 - arch_prof) * math.sin(v * math.pi)
        z = z_base + max(0.0, z_crest - z_base) * arch_prof * dome_fade * fullness

        # Embed border cleanly 3.8 mm into platform deck so collar ends melt flush into the rim
        embed = 0.0038 * max(math.pow(t_abs, 4.5), math.pow(v, 8.0))
        z -= embed
        return Vector((x, y, z)), s, u_pos, z_base

    outer_grid = []
    inner_grid = []
    wall_t = 0.0052

    for iv in range(n_v):
        v = iv / (n_v - 1)
        row_out = []
        row_in = []
        for t in t_vals:
            p_out, s, u_pos, z_base = hood_outer_point(v, t)
            row_out.append(bm.verts.new(p_out))

            x_c, _ = footprint_xy(s, 0.0)
            in_dir = Vector((x_c - p_out.x, 0.0, z_base - 0.025 - p_out.z))
            if in_dir.length > 1e-6:
                in_dir.normalize()
            else:
                in_dir = Vector((0.0, 0.0, -1.0))

            t_abs = abs(t)
            side_taper = 1.0 - 0.35 * math.pow(t_abs, 4.0)
            thick_eff = wall_t * side_taper * (1.0 - 0.15 * smoothstep(0.75, 1.0, v))
            p_in = p_out + in_dir * thick_eff
            if v == 0:
                p_in.y -= 0.0018 * math.cos(t_abs * math.pi * 0.5)
            row_in.append(bm.verts.new(p_in))

        outer_grid.append(row_out)
        inner_grid.append(row_in)

    for iv in range(n_v - 1):
        for jt in range(n_t - 1):
            bm.faces.new((
                outer_grid[iv][jt],
                outer_grid[iv + 1][jt],
                outer_grid[iv + 1][jt + 1],
                outer_grid[iv][jt + 1],
            ))
            bm.faces.new((
                inner_grid[iv][jt],
                inner_grid[iv][jt + 1],
                inner_grid[iv + 1][jt + 1],
                inner_grid[iv + 1][jt],
            ))

    lip_rings = [outer_grid[0]]
    for k in range(1, n_lip):
        ang = math.pi * (k / n_lip)
        row = []
        for jt in range(n_t):
            po = outer_grid[0][jt].co
            pi = inner_grid[0][jt].co
            mid = 0.5 * (po + pi)
            rad = 0.5 * (po - pi)
            t_abs = abs(t_vals[jt])
            fade = math.cos(t_abs * math.pi * 0.5)
            bulge_dir = Vector((0.0, 0.0024, 0.0014)).normalized() * rad.length * fade
            p = mid + rad * math.cos(ang) + bulge_dir * math.sin(ang)
            row.append(bm.verts.new(p))
        lip_rings.append(row)
    lip_rings.append(inner_grid[0])

    for k in range(len(lip_rings) - 1):
        for jt in range(n_t - 1):
            bm.faces.new((
                lip_rings[k][jt],
                lip_rings[k][jt + 1],
                lip_rings[k + 1][jt + 1],
                lip_rings[k + 1][jt],
            ))

    for jt in range(n_t - 1):
        bm.faces.new((
            outer_grid[-1][jt],
            inner_grid[-1][jt],
            inner_grid[-1][jt + 1],
            outer_grid[-1][jt + 1],
        ))
    for iv in range(n_v - 1):
        bm.faces.new((
            outer_grid[iv][0],
            inner_grid[iv][0],
            inner_grid[iv + 1][0],
            outer_grid[iv + 1][0],
        ))
        bm.faces.new((
            outer_grid[iv][-1],
            outer_grid[iv + 1][-1],
            inner_grid[iv + 1][-1],
            inner_grid[iv][-1],
        ))

    lat_cap = [lip_rings[k][0] for k in range(len(lip_rings))]
    bm.faces.new(list(reversed(lat_cap)))
    med_cap = [lip_rings[k][-1] for k in range(len(lip_rings))]
    bm.faces.new(med_cap)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    if bm.calc_volume(signed=True) < 0:
        for f in bm.faces:
            f.normal_flip()
        bm.normal_update()
    return bm


# ---------------------------------------------------------------------------
# Medial Ventilation Pill Cutters (Right Shoe: +X medial sidewall)
# ---------------------------------------------------------------------------
def create_pill_cutter(name, s_start, s_end, z_start, z_end, height, x_out, x_in):
    bm = bmesh.new()
    y0 = Y_HEEL - s_start * L_SHOE
    y1 = Y_HEEL - s_end * L_SHOE
    r = height * 0.5
    n_arc = 12

    dy = y1 - y0
    dz = z_end - z_start
    ln = math.hypot(dy, dz)
    ty, tz = dy / ln, dz / ln
    cy0, cz0 = y0 + ty * r, z_start + tz * r
    cy1, cz1 = y1 - ty * r, z_end - tz * r
    ang0 = math.atan2(tz, ty)

    prof = []
    for i in range(n_arc + 1):
        a = ang0 - math.pi * 0.5 + math.pi * (i / n_arc)
        prof.append((cy1 + r * math.cos(a), cz1 + r * math.sin(a)))
    for i in range(n_arc + 1):
        a = ang0 + math.pi * 0.5 + math.pi * (i / n_arc)
        prof.append((cy0 + r * math.cos(a), cz0 + r * math.sin(a)))

    v_in = [bm.verts.new((x_in, py, pz - 0.0012)) for py, pz in prof]
    v_out = [bm.verts.new((x_out, py, pz)) for py, pz in prof]
    n_p = len(prof)
    for i in range(n_p):
        ni = (i + 1) % n_p
        bm.faces.new((v_in[i], v_in[ni], v_out[ni], v_out[i]))
    bm.faces.new(list(reversed(v_in)))
    bm.faces.new(v_out)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def bm_to_object(bm, name):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


plat_obj = bm_to_object(build_right_platform_solid(), "RightPlatform")
hood_obj = bm_to_object(build_right_upper_hood(), "RightHood")

mod_u = plat_obj.modifiers.new("UnionHood", 'BOOLEAN')
mod_u.operation = 'UNION'
mod_u.solver = 'EXACT'
mod_u.object = hood_obj
bpy.context.view_layer.objects.active = plat_obj
bpy.ops.object.modifier_apply(modifier=mod_u.name)
bpy.data.objects.remove(hood_obj, do_unlink=True)

vent_rear = create_pill_cutter(
    "VentRear",
    s_start=0.522, s_end=0.622,
    z_start=0.0410, z_end=0.0384,
    height=0.0080,
    x_out=0.075, x_in=0.015,
)
vent_front = create_pill_cutter(
    "VentFront",
    s_start=0.664, s_end=0.767,
    z_start=0.0350, z_end=0.0322,
    height=0.0082,
    x_out=0.075, x_in=0.015,
)

for vobj in (vent_rear, vent_front):
    mod_d = plat_obj.modifiers.new(f"Cut_{vobj.name}", 'BOOLEAN')
    mod_d.operation = 'DIFFERENCE'
    mod_d.solver = 'EXACT'
    mod_d.object = vobj
    bpy.context.view_layer.objects.active = plat_obj
    bpy.ops.object.modifier_apply(modifier=mod_d.name)
    bpy.data.objects.remove(vobj, do_unlink=True)

bm_right = bmesh.new()
bm_right.from_mesh(plat_obj.data)
bmesh.ops.recalc_face_normals(bm_right, faces=bm_right.faces)
bm_right.normal_update()
vol_r = bm_right.calc_volume(signed=True)
if vol_r < 0:
    for f in bm_right.faces:
        f.normal_flip()
    bm_right.normal_update()
non_man = sum(1 for e in bm_right.edges if not e.is_manifold)
print(f"Right shoe signed_vol={bm_right.calc_volume(signed=True):.6f} m^3, non_manifold_edges={non_man}")


# ---------------------------------------------------------------------------
# Procedural 1024x1024 PBR Texture Atlas (BaseColor, Normal, Roughness)
# Quadrants (512x512 each):
#   Top-Left     [0.00..0.50, 0.50..1.00]: Footbed ("2 3", bar, Jumpman) + Wing Jumpman
#   Bottom-Left  [0.00..0.50, 0.00..0.50]: Outsole wavy herringbone/sinusoidal sipes
#   Bottom-Right [0.50..1.00, 0.00..0.50]: Seamless bio-foam micro-pebble grain
#   Top-Right    [0.50..1.00, 0.50..1.00]: Interior tunnel grip ribs + micro-pebble
# ---------------------------------------------------------------------------
def draw_jumpman_mask(size=256):
    img = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(img)

    def pt(x, y):
        return (x * size, y * size)

    def poly(pts):
        d.polygon([pt(x, y) for x, y in pts], fill=255)

    def capsule(p0, p1, r0, r1=None):
        if r1 is None:
            r1 = r0
        x0, y0 = p0
        x1, y1 = p1
        dx, dy = x1 - x0, y1 - y0
        ln = math.hypot(dx, dy) + 1e-8
        nx, ny = -dy / ln, dx / ln
        poly([
            (x0 + nx * r0, y0 + ny * r0),
            (x1 + nx * r1, y1 + ny * r1),
            (x1 - nx * r1, y1 - ny * r1),
            (x0 - nx * r0, y0 - ny * r0),
        ])
        d.ellipse([pt(x0 - r0, y0 - r0), pt(x0 + r0, y0 + r0)], fill=255)
        d.ellipse([pt(x1 - r1, y1 - r1), pt(x1 + r1, y1 + r1)], fill=255)

    poly([(0.45, 0.34), (0.55, 0.34), (0.56, 0.52), (0.46, 0.56)])
    d.ellipse([pt(0.472, 0.542), pt(0.556, 0.624)], fill=255)
    capsule((0.505, 0.52), (0.514, 0.575), 0.023)
    capsule((0.465, 0.54), (0.405, 0.68), 0.022, 0.017)
    capsule((0.405, 0.68), (0.355, 0.82), 0.017, 0.012)
    d.ellipse([pt(0.305, 0.805), pt(0.375, 0.875)], fill=255)
    capsule((0.555, 0.50), (0.665, 0.425), 0.020, 0.015)
    capsule((0.665, 0.425), (0.595, 0.352), 0.015, 0.011)
    capsule((0.47, 0.36), (0.31, 0.25), 0.032, 0.022)
    capsule((0.31, 0.25), (0.165, 0.145), 0.021, 0.013)
    poly([(0.165, 0.145), (0.115, 0.170), (0.125, 0.200), (0.195, 0.165)])
    capsule((0.535, 0.35), (0.675, 0.278), 0.032, 0.022)
    capsule((0.675, 0.278), (0.835, 0.165), 0.021, 0.013)
    poly([(0.835, 0.165), (0.885, 0.195), (0.865, 0.225), (0.805, 0.185)])

    return img.filter(ImageFilter.GaussianBlur(radius=0.8))


def draw_digit_2_upside_down(size=96):
    img = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(img)
    w = max(4, int(size * 0.13))
    pts = []
    for i in range(16):
        a = math.pi * 1.12 - math.pi * 1.18 * (i / 15.0)
        cx, cy, rx, ry = 0.50 * size, 0.33 * size, 0.28 * size, 0.20 * size
        pts.append((cx + rx * math.cos(a), cy - ry * math.sin(a)))
    pts.append((0.23 * size, 0.83 * size))
    pts.append((0.78 * size, 0.83 * size))
    d.line(pts, fill=255, width=w, joint="curve")
    for p in pts:
        r = w * 0.5
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)
    return img.rotate(180).filter(ImageFilter.GaussianBlur(radius=0.7))


def draw_digit_3_upside_down(size=96):
    img = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(img)
    w = max(4, int(size * 0.13))
    pts_top = []
    for i in range(16):
        a = math.pi * 0.85 - math.pi * 1.35 * (i / 15.0)
        cx, cy, rx, ry = 0.48 * size, 0.33 * size, 0.27 * size, 0.17 * size
        pts_top.append((cx + rx * math.cos(a), cy - ry * math.sin(a)))
    d.line(pts_top, fill=255, width=w, joint="curve")
    pts_bot = []
    for i in range(16):
        a = math.pi * 0.50 - math.pi * 1.35 * (i / 15.0)
        cx, cy, rx, ry = 0.49 * size, 0.66 * size, 0.28 * size, 0.18 * size
        pts_bot.append((cx + rx * math.cos(a), cy - ry * math.sin(a)))
    d.line(pts_bot, fill=255, width=w, joint="curve")
    for p in (pts_top[0], pts_top[-1], pts_bot[0], pts_bot[-1]):
        r = w * 0.5
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)
    return img.rotate(180).filter(ImageFilter.GaussianBlur(radius=0.7))


def build_pbr_atlas():
    S = 1024
    Q = 512

    h_field = np.zeros((S, S), dtype=np.float32)
    ao_field = np.ones((S, S), dtype=np.float32)
    rough_field = np.full((S, S), 0.47, dtype=np.float32)

    # 1. Tileable fine bio-foam micro-pebble grain
    rng = np.random.default_rng(42)
    tile = rng.normal(0.0, 1.0, (96, 96)).astype(np.float32)
    tile_img = Image.fromarray(np.clip((tile * 0.25 + 0.5) * 255, 0, 255).astype(np.uint8))
    tile_big = tile_img.resize((256, 256), Image.Resampling.BILINEAR).filter(ImageFilter.GaussianBlur(radius=0.85))
    pebble_256 = (np.array(tile_big, dtype=np.float32) / 255.0 - 0.5) * 0.22
    fine = rng.normal(0.0, 0.055, (256, 256)).astype(np.float32)
    pebble_tile = pebble_256 + fine
    pebble_full = np.tile(pebble_tile, (S // 256, S // 256))

    h_field += pebble_full
    rough_field += pebble_full * 0.16

    # 2. Top-Left Quadrant (512x512): Footbed "2 3" + bar + Jumpman + Wing Jumpman
    jm_big = np.array(draw_jumpman_mask(192), dtype=np.float32) / 255.0
    d2 = np.array(draw_digit_2_upside_down(64), dtype=np.float32) / 255.0
    d3 = np.array(draw_digit_3_upside_down(64), dtype=np.float32) / 255.0

    fb_cx = 155
    bar_img = Image.new("L", (Q, Q), 0)
    bd = ImageDraw.Draw(bar_img)
    bd.rounded_rectangle([fb_cx - 60, 104, fb_cx + 60, 110], radius=2, fill=255)
    bar_arr = np.array(bar_img.filter(ImageFilter.GaussianBlur(radius=0.7)), dtype=np.float32) / 255.0

    stamp_fb = bar_arr.copy()

    def paste_centered(dst, src, cx, cy, scale=1.0):
        sh, sw = src.shape
        if scale != 1.0:
            im_s = Image.fromarray((src * 255).astype(np.uint8)).resize(
                (int(sw * scale), int(sh * scale)), Image.Resampling.BICUBIC
            )
            src = np.array(im_s, dtype=np.float32) / 255.0
            sh, sw = src.shape
        y0 = cy - sh // 2
        x0 = cx - sw // 2
        dst[y0:y0 + sh, x0:x0 + sw] = np.maximum(dst[y0:y0 + sh, x0:x0 + sw], src)

    paste_centered(stamp_fb, d3, fb_cx - 52, 136, scale=0.52)
    paste_centered(stamp_fb, d2, fb_cx + 52, 136, scale=0.52)
    paste_centered(stamp_fb, jm_big, fb_cx, 232, scale=0.55)

    jm_wing_im = draw_jumpman_mask(128).rotate(55, resample=Image.Resampling.BICUBIC, expand=True)
    jm_wing = np.array(jm_wing_im, dtype=np.float32) / 255.0
    paste_centered(stamp_fb, jm_wing, 408, 256, scale=0.44)

    h_field[0:Q, 0:Q] -= stamp_fb * 0.78
    ao_field[0:Q, 0:Q] -= stamp_fb * 0.18
    rough_field[0:Q, 0:Q] += stamp_fb * 0.12

    # 3. Bottom-Left Quadrant (512x512): Outsole wavy sinusoidal sipes
    yy, xx = np.mgrid[0:Q, 0:Q].astype(np.float32)
    u_sole = xx / Q
    v_sole = (Q - yy) / Q
    wave = 0.0055 * np.sin(u_sole * 2.0 * math.pi * 11.0)
    phase = (v_sole - 0.032 * u_sole + wave) * 68.0
    dist_line = np.abs(phase - np.round(phase))
    sipe_mask = np.clip(1.0 - dist_line / 0.20, 0.0, 1.0)
    h_field[Q:S, 0:Q] -= sipe_mask * 0.58
    ao_field[Q:S, 0:Q] -= sipe_mask * 0.28
    rough_field[Q:S, 0:Q] += sipe_mask * 0.14

    # 4. Top-Right Quadrant (512x512): Interior tunnel grip ribs
    rib_phase = (yy / Q) * 130.0
    rib_mask = 0.5 + 0.5 * np.cos(rib_phase * 2.0 * math.pi)
    h_field[0:Q, Q:S] += (rib_mask - 0.5) * 0.20
    ao_field[0:Q, Q:S] -= (1.0 - rib_mask) * 0.08

    # Normal map
    strength = 2.4
    gx = np.roll(h_field, -1, axis=1) - np.roll(h_field, 1, axis=1)
    gy = np.roll(h_field, -1, axis=0) - np.roll(h_field, 1, axis=0)
    nx = -gx * strength
    ny = gy * strength
    nz = np.ones_like(nx)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-8
    nrm_rgb = np.stack([
        np.clip((nx / norm * 0.5 + 0.5) * 255.0, 0, 255),
        np.clip((ny / norm * 0.5 + 0.5) * 255.0, 0, 255),
        np.clip((nz / norm * 0.5 + 0.5) * 255.0, 0, 255),
    ], axis=-1).astype(np.uint8)

    # Rich deep University Red albedo (sRGB ~(178, 12, 18) so lit highlights never turn pink!)
    ao_c = np.clip(ao_field, 0.62, 1.0)
    col_rgb = np.stack([
        np.clip(178.0 * ao_c, 0, 255),
        np.clip(12.0 * ao_c, 0, 255),
        np.clip(18.0 * ao_c, 0, 255),
    ], axis=-1).astype(np.uint8)

    rough_u8 = np.clip(rough_field * 255.0, 40, 230).astype(np.uint8)

    def save_pack(arr, fname, colorspace):
        p = os.path.join(TEX_DIR, fname)
        Image.fromarray(arr).save(p, optimize=True)
        im = bpy.data.images.load(p)
        im.colorspace_settings.name = colorspace
        im.pack()
        return im

    return (
        save_pack(col_rgb, "hex_mule_col.png", "sRGB"),
        save_pack(nrm_rgb, "hex_mule_nrm.png", "Non-Color"),
        save_pack(rough_u8, "hex_mule_rough.png", "Non-Color"),
    )


img_col, img_nrm, img_rough = build_pbr_atlas()

mat_foam = bpy.data.materials.new(name="JordanHexMuleFoam")
mat_foam.use_nodes = True
nt = mat_foam.node_tree
bsdf = nt.nodes.get("Principled BSDF")
bsdf.inputs["Metallic"].default_value = 0.0

tex_uv = nt.nodes.new("ShaderNodeTexCoord")

t_col = nt.nodes.new("ShaderNodeTexImage")
t_col.image = img_col
nt.links.new(tex_uv.outputs["UV"], t_col.inputs["Vector"])
nt.links.new(t_col.outputs["Color"], bsdf.inputs["Base Color"])

t_rgh = nt.nodes.new("ShaderNodeTexImage")
t_rgh.image = img_rough
nt.links.new(tex_uv.outputs["UV"], t_rgh.inputs["Vector"])
nt.links.new(t_rgh.outputs["Color"], bsdf.inputs["Roughness"])

t_nrm = nt.nodes.new("ShaderNodeTexImage")
t_nrm.image = img_nrm
nrm_node = nt.nodes.new("ShaderNodeNormalMap")
nrm_node.inputs["Strength"].default_value = 0.65
nt.links.new(tex_uv.outputs["UV"], t_nrm.inputs["Vector"])
nt.links.new(t_nrm.outputs["Color"], nrm_node.inputs["Color"])
nt.links.new(nrm_node.outputs["Normal"], bsdf.inputs["Normal"])


# ---------------------------------------------------------------------------
# Assign Clean Multi-Region UVs & Mirror Right Shoe -> Pair
# ---------------------------------------------------------------------------
def assign_shoe_uvs(bm, is_left_shoe):
    bm.normal_update()
    uv_layer = bm.loops.layers.uv.verify()

    for f in bm.faces:
        c = f.calc_center_median()
        n = f.normal
        s_c = (Y_HEEL - c.y) / L_SHOE

        # 1. Outsole bottom faces -> Bottom-Left quad (only ground-facing sole pads, not heel/toe bevels)
        if n.z < -0.82 and c.z < 0.016:
            for loop in f.loops:
                p = loop.vert.co
                s_p = clamp((Y_HEEL - p.y) / L_SHOE, 0.0, 1.0)
                x_unflip = -p.x if is_left_shoe else p.x
                u = clamp(0.04 + 0.42 * ((x_unflip + 0.075) / 0.145), 0.02, 0.48)
                v = clamp(0.04 + 0.42 * s_p, 0.02, 0.48)
                loop[uv_layer].uv = (u, v)
            continue

        # 2. Lateral Wing Jumpman shelf -> Top-Left quad wing box
        x_lat_c, _ = foot_bounds_x(clamp(s_c, 0.0, 1.0))
        x_c_right = -c.x if is_left_shoe else c.x
        if n.z > 0.55 and 0.65 <= s_c <= 0.78 and 0.036 <= c.z <= 0.056 and x_c_right < x_lat_c + 0.017:
            for loop in f.loops:
                p = loop.vert.co
                xr = -p.x if is_left_shoe else p.x
                sr = (Y_HEEL - p.y) / L_SHOE
                u = clamp(0.398 + (xr - (-0.064)) / 0.028 * 0.09, 0.33, 0.47)
                v = clamp(0.750 + (0.715 - sr) / 0.12 * 0.09, 0.68, 0.82)
                loop[uv_layer].uv = (u, v)
            continue

        # 3. Heel-Midfoot Footbed Basin -> Top-Left quad footbed box (NEVER mirrored in X!)
        if n.z > 0.45 and 0.035 <= s_c <= 0.48 and c.z < 0.036 and abs(c.x) < 0.046:
            for loop in f.loops:
                p = loop.vert.co
                sp = (Y_HEEL - p.y) / L_SHOE
                u = clamp(0.1514 + (p.x / 0.046) * 0.105, 0.02, 0.29)
                v = clamp(0.96 - sp * 0.85, 0.54, 0.97)
                loop[uv_layer].uv = (u, v)
            continue

        # 4. Interior Tunnel Roof -> Top-Right quad
        if n.z < -0.25 and c.z > 0.028:
            for loop in f.loops:
                p = loop.vert.co
                u = clamp(0.54 + 0.42 * clamp((p.x + 0.06) / 0.12, 0.0, 1.0), 0.52, 0.98)
                v = clamp(0.54 + 0.42 * clamp((Y_HEEL - p.y) / L_SHOE, 0.0, 1.0), 0.52, 0.98)
                loop[uv_layer].uv = (u, v)
            continue

        # 5. All other surfaces -> Bottom-Right bio-foam micro-pebble quad
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
        for loop in f.loops:
            p = loop.vert.co
            if az >= ax and az >= ay:
                tu, tv = p.x, p.y
            elif ax >= ay:
                tu, tv = p.y, p.z
            else:
                tu, tv = p.x, p.z
            fu = abs(((tu / 0.08) % 2.0) - 1.0)
            fv = abs(((tv / 0.08) % 2.0) - 1.0)
            loop[uv_layer].uv = (0.53 + 0.44 * fu, 0.03 + 0.44 * fv)


pair_bm = bmesh.new()

for shift_x, is_left in ((-PAIR_HALF_X, False), (PAIR_HALF_X, True)):
    shoe_bm = bm_right.copy()
    if is_left:
        for v in shoe_bm.verts:
            v.co.x = -v.co.x
        for f in shoe_bm.faces:
            f.normal_flip()
        shoe_bm.normal_update()
    assign_shoe_uvs(shoe_bm, is_left_shoe=is_left)

    vmap = {}
    for v in shoe_bm.verts:
        vmap[v] = pair_bm.verts.new((v.co.x + shift_x, v.co.y, v.co.z))
    uv_src = shoe_bm.loops.layers.uv.active
    uv_dst = pair_bm.loops.layers.uv.verify()
    for f in shoe_bm.faces:
        nf = pair_bm.faces.new([vmap[v] for v in f.verts])
        nf.smooth = True
        for l_src, l_dst in zip(f.loops, nf.loops):
            l_dst[uv_dst].uv = l_src[uv_src].uv
    shoe_bm.free()

bm_right.free()
bpy.data.objects.remove(plat_obj, do_unlink=True)

pair_mesh = bpy.data.meshes.new("JordanHexMulePair")
pair_bm.to_mesh(pair_mesh)
pair_bm.free()

pair_obj = bpy.data.objects.new("JordanHexMulePair", pair_mesh)
bpy.context.collection.objects.link(pair_obj)
pair_obj.data.materials.append(mat_foam)

for p in pair_obj.data.polygons:
    p.use_smooth = True

bm_sharp = bmesh.new()
bm_sharp.from_mesh(pair_obj.data)
angle_thresh = math.radians(38.0)
for e in bm_sharp.edges:
    if len(e.link_faces) == 2:
        ang = e.link_faces[0].normal.angle(e.link_faces[1].normal, 0.0)
        e.smooth = ang < angle_thresh
    else:
        e.smooth = True
bm_sharp.to_mesh(pair_obj.data)
bm_sharp.free()

bpy.context.view_layer.update()
xs = [v.co.x for v in pair_obj.data.vertices]
ys = [v.co.y for v in pair_obj.data.vertices]
zs = [v.co.z for v in pair_obj.data.vertices]
dx, dy, dz = max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)
cx, cy, zmin = 0.5 * (min(xs) + max(xs)), 0.5 * (min(ys) + max(ys)), min(zs)
for v in pair_obj.data.vertices:
    v.co.x -= cx
    v.co.y -= cy
    v.co.z -= zmin

print(f"JordanHexMule pair bbox (m): X={dx:.4f} ({dx*100:.1f} cm), Y={dy:.4f} ({dy*100:.1f} cm), Z={dz:.4f} ({dz*100:.1f} cm)")
print(f"Polys: {len(pair_obj.data.polygons)}, Verts: {len(pair_obj.data.vertices)}")

bpy.ops.export_scene.gltf(
    filepath=OUT_PATH,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
print(f"Exported {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)")
