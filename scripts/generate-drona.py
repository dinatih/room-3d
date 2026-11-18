"""Generate a photorealistic, low-poly IKEA DRÖNA red fabric GLB (33 x 38 x 33 cm).

Outputs:
  /home/dinatih/Projects/room-3d/public/items/dröna/DronaRed.glb
"""
import math
import os
import tempfile

import bpy
import bmesh
import numpy as np
from mathutils import Vector
from PIL import Image

OUT_PATH = "/home/dinatih/Projects/room-3d/public/items/dröna/DronaRed.glb"
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
TEX_DIR = tempfile.mkdtemp(prefix="drona_tex_")

# Exact DRÖNA dimensions in meters (Blender Z-up -> glTF Y-up)
W = 0.330            # X width  (33 cm)
D = 0.380            # Y depth  (38 cm -> glTF Z)
H = 0.330            # Z height (33 cm -> glTF Y)
WALL = 0.0045
FLOOR_Z = 0.0020     # Matches DRONA_PANEL = 0.2 cm in Drona.tsx / KallaxNE.tsx
RIM_Z = 0.3225       # Bottom of folded top binding rim (~7.5 mm tall)
BAND_BOT_Z = 0.2620  # Bottom of ~6 cm front/back pull-band

TEX_SIZE = 768


# ---------------------------------------------------------------------------
# 1. Procedural PBR Texture Atlas (768 x 768)
# ---------------------------------------------------------------------------
def _tileable_noise(rng, size, grid):
    """Smooth bicubic-upsampled tileable value noise in [-0.5, 0.5]."""
    coarse = rng.random((grid, grid), dtype=np.float32)
    img = Image.fromarray((coarse * 255.0).astype(np.uint8), mode="L")
    img = img.resize((size, size), resample=Image.Resampling.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0 - 0.5


def _draw_stitch_line(
    albedo, height, rough, ao,
    x0, y0, x1, y1,
    pitch_px=7.5, dash_frac=0.66, width_px=1.6,
):
    """Draw realistic sewn polyester thread dashes + needle punctures onto atlas."""
    dx = x1 - x0
    dy = y1 - y0
    length = math.hypot(dx, dy)
    if length < 1e-3:
        return
    ux, uy = dx / length, dy / length
    nx, ny = -uy, ux

    steps = max(1, int(length / pitch_px))
    half_w = width_px * 0.5
    pad = int(half_w + 3)

    for i in range(steps):
        t0 = i / steps
        t1 = (i + dash_frac) / steps
        sx0, sy0 = x0 + dx * t0, y0 + dy * t0
        sx1, sy1 = x0 + dx * t1, y0 + dy * t1
        seg_len = max(1e-3, math.hypot(sx1 - sx0, sy1 - sy0))

        bx0 = max(0, int(min(sx0, sx1) - pad))
        bx1 = min(TEX_SIZE - 1, int(max(sx0, sx1) + pad))
        by0 = max(0, int(min(sy0, sy1) - pad))
        by1 = min(TEX_SIZE - 1, int(max(sy0, sy1) + pad))
        if bx1 < bx0 or by1 < by0:
            continue

        yy, xx = np.mgrid[by0:by1 + 1, bx0:bx1 + 1]
        vx = xx - sx0
        vy = yy - sy0
        along = vx * ux + vy * uy

        u_clamp = np.clip(along / seg_len, 0.0, 1.0)
        cx = sx0 + (sx1 - sx0) * u_clamp
        cy = sy0 + (sy1 - sy0) * u_clamp
        dist = np.hypot(xx - cx, yy - cy)

        thread = np.clip(1.0 - dist / max(0.65, half_w), 0.0, 1.0)
        thread = np.sqrt(thread)

        d_start = np.hypot(xx - sx0, yy - sy0)
        d_end = np.hypot(xx - sx1, yy - sy1)
        hole = np.exp(-(np.minimum(d_start, d_end) ** 2) / 1.1)

        h_patch = height[by0:by1 + 1, bx0:bx1 + 1]
        h_patch[:] = h_patch + thread * 0.45 - hole * 0.42

        alb_patch = albedo[by0:by1 + 1, bx0:bx1 + 1]
        alb_patch[..., 0] = np.clip(alb_patch[..., 0] + thread * 0.13 - hole * 0.36, 0.0, 1.0)
        alb_patch[..., 1] = np.clip(alb_patch[..., 1] + thread * 0.012 - hole * 0.010, 0.0, 1.0)
        alb_patch[..., 2] = np.clip(alb_patch[..., 2] + thread * 0.014 - hole * 0.012, 0.0, 1.0)

        r_patch = rough[by0:by1 + 1, bx0:bx1 + 1]
        r_patch[:] = r_patch * (1.0 - 0.36 * thread)

        ao_patch = ao[by0:by1 + 1, bx0:bx1 + 1]
        ao_patch[:] = np.clip(ao_patch - hole * 0.45, 0.20, 1.0)


def build_textures():
    """Build BaseColor, Normal, and ORM (AO/Roughness/Metallic) 768x768 maps."""
    rng = np.random.default_rng(42)
    S = TEX_SIZE
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)

    # Very fine, uniform micro-weave for light cotton/polyester sheeting ("drap léger")
    # Avoid coarse/mid blotches ("taches") and heavy velvet-like bump noise.
    n_micro = _tileable_noise(rng, S, 384)

    # Fine perpendicular warp/weft micro-weave
    wx = np.sin(xx * (2.0 * math.pi / 2.0))
    wy = np.sin(yy * (2.0 * math.pi / 2.0))
    outer_weave = 0.5 * (wx + wy)

    # Fine regular plain weave for inner lining
    ibx = np.sin(xx * (2.0 * math.pi / 3.0))
    iby = np.sin(yy * (2.0 * math.pi / 3.0))
    inner_weave = 0.5 * (ibx + iby)

    # Aspect-corrected fine weave for Q3 inner walls (142 cm perimeter vs 33 cm height -> ~4.3:1)
    q3_wx = np.sin(xx * (2.0 * math.pi / 2.0))
    q3_wy = np.sin(yy * (2.0 * math.pi / 8.0))
    q3_weave = 0.5 * (q3_wx + q3_wy)

    albedo = np.zeros((S, S, 3), dtype=np.float32)
    height = np.zeros((S, S), dtype=np.float32)
    rough = np.full((S, S), 0.80, dtype=np.float32)
    ao = np.ones((S, S), dtype=np.float32)

    # ------------------------------------------------------------------
    # Outer Fabric: Clean, smooth saturated IKEA Crimson Red (no blotches)
    # ------------------------------------------------------------------
    micro_var = 0.006 * n_micro + 0.004 * outer_weave
    albedo[..., 0] = 0.715 + micro_var
    albedo[..., 1] = 0.015 + 0.001 * np.clip(micro_var + 0.01, 0.0, 0.02)
    albedo[..., 2] = 0.022 + 0.001 * np.clip(micro_var + 0.01, 0.0, 0.02)
    height[:] = 0.032 * outer_weave + 0.016 * n_micro
    rough[:] = 0.80 + 0.012 * n_micro - 0.008 * outer_weave

    # UV Quadrants (image Y=0 is top -> UV V = 1 - Y/S)
    half = S // 2
    q_bot_mid = S * 3 // 4

    def v_to_y(v):
        return (1.0 - v) * S

    # --- Q3 (Bot-Left): Inner walls (smooth fine weave + subtle bottom/corner AO) ---
    q3 = (slice(half, S), slice(0, half))
    albedo[q3][..., 0] = 0.55 + 0.005 * n_micro[q3] + 0.006 * q3_weave[q3]
    albedo[q3][..., 1] = 0.012
    albedo[q3][..., 2] = 0.018
    height[q3] = 0.040 * q3_weave[q3] + 0.015 * n_micro[q3]
    rough[q3] = 0.83 - 0.010 * q3_weave[q3]

    v_q3 = 1.0 - yy[q3] / S  # [0..0.50]
    t_inner_h = np.clip((v_q3 - 0.02) / 0.45, 0.0, 1.0)
    ao_inner_v = 0.68 + 0.32 * (t_inner_h ** 0.55)
    # 4 vertical inner corners evenly spaced in u in [0.02..0.48]:
    # Perimeter fractions: 33 / 142 = 0.2324, (33+38)/142 = 0.50, (33+38+33)/142 = 0.7324
    u_q3 = xx[q3] / S
    u_norm = np.clip((u_q3 - 0.02) / 0.46, 0.0, 1.0)
    corner_dist = np.min(np.stack([np.abs(u_norm - c) for c in (0.0, 0.2324, 0.5, 0.7324, 1.0)], axis=0), axis=0)
    ao_inner_c = 0.86 + 0.14 * np.clip(corner_dist / 0.025, 0.0, 1.0)
    ao[q3] *= ao_inner_v * ao_inner_c
    albedo[q3] *= (0.80 + 0.20 * ao_inner_v * ao_inner_c)[..., None]

    # --- Q4 upper (Bot-Right top): Inner bottom board ---
    q4_in = (slice(half, q_bot_mid), slice(half, S))
    albedo[q4_in][..., 0] = 0.52 + 0.005 * n_micro[q4_in] + 0.006 * inner_weave[q4_in]
    albedo[q4_in][..., 1] = 0.012
    albedo[q4_in][..., 2] = 0.018
    height[q4_in] = 0.045 * inner_weave[q4_in] + 0.015 * n_micro[q4_in]
    rough[q4_in] = 0.84
    u_f = (xx[q4_in] - half) / float(half)
    v_f = (yy[q4_in] - half) / float(q_bot_mid - half)
    edge_f = np.minimum(np.minimum(u_f, 1.0 - u_f), np.minimum(v_f, 1.0 - v_f))
    ao_floor = 0.70 + 0.30 * np.clip(edge_f / 0.10, 0.0, 1.0)
    ao[q4_in] *= ao_floor
    albedo[q4_in] *= (0.80 + 0.20 * ao_floor)[..., None]

    # --- Q4 lower (Bot-Right bottom): Outer bottom ---
    q4_out = (slice(q_bot_mid, S), slice(half, S))
    albedo[q4_out][..., 0] = 0.48 + 0.004 * n_micro[q4_out]
    albedo[q4_out][..., 1] = 0.011
    albedo[q4_out][..., 2] = 0.017
    rough[q4_out] = 0.86
    ao[q4_out] *= 0.88

    # ------------------------------------------------------------------
    # Q1 (Top-Left): Front & Back Outer Panels + Pull-Band (u in [0.02, 0.48])
    #   v in [0.52, 0.82]   -> lower front/back wall (z in [0, BAND_BOT_Z])
    #   v in [0.835, 0.945] -> wide pull-band (z in [BAND_BOT_Z, RIM_Z])
    #   v in [0.955, 0.985] -> top folded rim (z in [RIM_Z, H])
    # ------------------------------------------------------------------
    x_q1_0 = 0.02 * S
    x_q1_1 = 0.48 * S

    # Contact shadow right under the pull-band flap
    y_wall_top = v_to_y(0.82)
    dy_shadow = yy[:, :half] - y_wall_top
    shadow_band = np.exp(-np.clip(dy_shadow, 0.0, 28.0) / 3.8) * (dy_shadow >= -1.5)
    ao[:, :half] *= (1.0 - 0.42 * shadow_band)
    albedo[:, :half] *= (1.0 - 0.28 * shadow_band)[..., None]

    # Contact shadow right under the top folded rim
    y_band_top = v_to_y(0.945)
    dy_rim_shadow = yy[:, :half] - y_band_top
    shadow_rim = np.exp(-np.clip(dy_rim_shadow, 0.0, 20.0) / 2.8) * (dy_rim_shadow >= -1.5)
    ao[:, :half] *= (1.0 - 0.30 * shadow_rim)
    albedo[:, :half] *= (1.0 - 0.22 * shadow_rim)[..., None]

    # Subtle edge crease AO only (no vertical stitching lines on real DRÖNA)
    d_edge_q1 = np.minimum(np.abs(xx[:, :half] - x_q1_0), np.abs(xx[:, :half] - x_q1_1))
    seam_ao_q1 = 0.93 + 0.07 * np.clip(d_edge_q1 / 2.5, 0.0, 1.0)
    ao[:, :half] *= seam_ao_q1
    albedo[:, :half] *= (0.95 + 0.05 * seam_ao_q1)[..., None]

    # Horizontal stitching lines only on Q1 (top folded rim + pull-band bottom)
    _draw_stitch_line(albedo, height, rough, ao, x_q1_0 + 2, v_to_y(0.967), x_q1_1 - 2, v_to_y(0.967), pitch_px=6.5, width_px=1.6)
    _draw_stitch_line(albedo, height, rough, ao, x_q1_0 + 2, v_to_y(0.844), x_q1_1 - 2, v_to_y(0.844), pitch_px=6.5, width_px=1.6)

    # ------------------------------------------------------------------
    # Q2 (Top-Right): Left & Right Outer Panels (u in [0.52, 0.98])
    # ------------------------------------------------------------------
    x_q2_0 = 0.52 * S
    x_q2_1 = 0.98 * S
    y_side_rim = v_to_y(0.945)
    dy_side_rim = yy[:, half:] - y_side_rim
    shadow_side_rim = np.exp(-np.clip(dy_side_rim, 0.0, 20.0) / 2.8) * (dy_side_rim >= -1.5)
    ao[:, half:] *= (1.0 - 0.30 * shadow_side_rim)
    albedo[:, half:] *= (1.0 - 0.22 * shadow_side_rim)[..., None]

    _draw_stitch_line(albedo, height, rough, ao, x_q2_0 + 2, v_to_y(0.967), x_q2_1 - 2, v_to_y(0.967), pitch_px=6.5, width_px=1.6)
    d_edge_q2 = np.minimum(np.abs(xx[:, half:] - x_q2_0), np.abs(xx[:, half:] - x_q2_1))
    seam_ao_q2 = 0.93 + 0.07 * np.clip(d_edge_q2 / 4.0, 0.0, 1.0)
    ao[:, half:] *= seam_ao_q2

    # ------------------------------------------------------------------
    # Height -> Tangent-Space Normal Map (OpenGL +Y up)
    # ------------------------------------------------------------------
    gy, gx = np.gradient(height)
    strength = 0.85
    nx = -gx * strength
    ny = gy * strength
    nz = np.ones_like(height)
    inv_len = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    nrm_rgb = np.stack([
        (nx * inv_len * 0.5 + 0.5),
        (ny * inv_len * 0.5 + 0.5),
        (nz * inv_len * 0.5 + 0.5),
    ], axis=-1)

    orm_rgb = np.stack([
        np.clip(ao, 0.0, 1.0),
        np.clip(rough, 0.0, 1.0),
        np.zeros_like(rough),
    ], axis=-1)

    def _save_load(arr, filename, colorspace, quality=86):
        path = os.path.join(TEX_DIR, filename)
        img = Image.fromarray(np.clip(arr * 255.0, 0, 255).astype(np.uint8), mode="RGB")
        img.save(path, format="JPEG", quality=quality, optimize=True)
        b_img = bpy.data.images.load(path)
        b_img.colorspace_settings.name = colorspace
        b_img.pack()
        return b_img

    img_base = _save_load(albedo, "drona_basecolor.jpg", "sRGB", quality=88)
    img_nrm = _save_load(nrm_rgb, "drona_normal.jpg", "Non-Color", quality=84)
    img_orm = _save_load(orm_rgb, "drona_orm.jpg", "Non-Color", quality=84)
    return img_base, img_nrm, img_orm


def build_material(img_base, img_nrm, img_orm):
    """Single PBR material for 1 Draw Call in glTF / Three.js."""
    mat = bpy.data.materials.new(name="DronaFabricRed")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    uv_node = nt.nodes.new("ShaderNodeTexCoord")

    tex_base = nt.nodes.new("ShaderNodeTexImage")
    tex_base.image = img_base
    nt.links.new(uv_node.outputs["UV"], tex_base.inputs["Vector"])
    nt.links.new(tex_base.outputs["Color"], bsdf.inputs["Base Color"])

    tex_nrm = nt.nodes.new("ShaderNodeTexImage")
    tex_nrm.image = img_nrm
    nrm_node = nt.nodes.new("ShaderNodeNormalMap")
    nrm_node.inputs["Strength"].default_value = 0.45
    nt.links.new(uv_node.outputs["UV"], tex_nrm.inputs["Vector"])
    nt.links.new(tex_nrm.outputs["Color"], nrm_node.inputs["Color"])
    nt.links.new(nrm_node.outputs["Normal"], bsdf.inputs["Normal"])

    tex_orm = nt.nodes.new("ShaderNodeTexImage")
    tex_orm.image = img_orm
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(uv_node.outputs["UV"], tex_orm.inputs["Vector"])
    nt.links.new(tex_orm.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
    nt.links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])

    gltf_group = bpy.data.node_groups.new("glTF Settings", "ShaderNodeTree")
    gltf_group.interface.new_socket(name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    grp_node = nt.nodes.new("ShaderNodeGroup")
    grp_node.node_tree = gltf_group
    nt.links.new(sep.outputs["Red"], grp_node.inputs["Occlusion"])

    return mat


# ---------------------------------------------------------------------------
# 2. Geometry Construction (1 continuous mesh, realistic silhouette)
# ---------------------------------------------------------------------------
def _panel_bulge(u_norm, z):
    """Subtle realistic fabric tension (~0.8 mm peak at mid-panel)."""
    h_arch = math.sin(math.pi * max(0.0, min(1.0, u_norm)))
    z_norm = max(0.0, min(1.0, z / RIM_Z))
    v_arch = math.sin(math.pi * z_norm) ** 0.85
    return 0.0008 * h_arch * v_arch


def _rounded_rect_perimeter(half_x, half_y, radius, corner_segs=3, side_segs=4, z_for_bulge=0.0, bulge_sign=1.0):
    """Build ordered (x, y) points around a rounded rectangle (CCW)."""
    pts = []
    cx = half_x - radius
    cy = half_y - radius

    def add_side(p0, p1, nx, ny):
        for i in range(side_segs):
            t = i / side_segs
            x = p0[0] + (p1[0] - p0[0]) * t
            y = p0[1] + (p1[1] - p0[1]) * t
            b = _panel_bulge(t, z_for_bulge) * bulge_sign
            pts.append((x + nx * b, y + ny * b))

    def add_corner(center_x, center_y, a0, a1):
        for i in range(corner_segs):
            t = i / corner_segs
            ang = a0 + (a1 - a0) * t
            pinch = 1.0 - 0.05 * math.sin(math.pi * t)
            r_eff = radius * pinch
            pts.append((center_x + r_eff * math.cos(ang), center_y + r_eff * math.sin(ang)))

    add_side((-cx, -half_y), (cx, -half_y), 0.0, -1.0)
    add_corner(cx, -cy, -math.pi / 2, 0.0)
    add_side((half_x, -cy), (half_x, cy), 1.0, 0.0)
    add_corner(cx, cy, 0.0, math.pi / 2)
    add_side((cx, half_y), (-cx, half_y), 0.0, 1.0)
    add_corner(-cx, cy, math.pi / 2, math.pi)
    add_side((-half_x, cy), (-half_x, -cy), -1.0, 0.0)
    add_corner(-cx, -cy, math.pi, 1.5 * math.pi)
    return pts


def _perimeter_param(x, y, ihw, ihd):
    """Continuous normalized perimeter coordinate in [0, 1) around inner box."""
    # Map each point around the rectangular perimeter by side progress
    perim_total = 4.0 * (ihw + ihd)
    ax = abs(x) / max(1e-6, ihw)
    ay = abs(y) / max(1e-6, ihd)
    if ay >= ax and y <= 0:  # front (-Y): x from -ihw -> +ihw
        dist = max(0.0, min(2 * ihw, x + ihw))
    elif ax >= ay and x >= 0:  # right (+X): y from -ihd -> +ihd
        dist = 2 * ihw + max(0.0, min(2 * ihd, y + ihd))
    elif ay >= ax and y >= 0:  # back (+Y): x from +ihw -> -ihw
        dist = 2 * ihw + 2 * ihd + max(0.0, min(2 * ihw, ihw - x))
    else:  # left (-X): y from +ihd -> -ihd
        dist = 4 * ihw + 2 * ihd + max(0.0, min(2 * ihd, ihd - y))
    return dist / perim_total


def _assign_uv(face, uv_layer, vert_meta):
    """Assign clean analytical UVs to each loop based on surface region."""
    regions = [vert_meta[v.index][0] for v in face.verts]

    if all(r == "out_bot" for r in regions):
        for loop in face.loops:
            x, y = loop.vert.co.x, loop.vert.co.y
            u = 0.53 + ((x + W / 2) / W) * 0.44
            v = 0.03 + ((y + D / 2) / D) * 0.20
            loop[uv_layer].uv = (u, v)
        return

    if all(r == "in_bot" for r in regions):
        for loop in face.loops:
            x, y = loop.vert.co.x, loop.vert.co.y
            u = 0.53 + ((x + W / 2) / W) * 0.44
            v = 0.27 + ((y + D / 2) / D) * 0.20
            loop[uv_layer].uv = (u, v)
        return

    if all(r == "band" for r in regions):
        for loop in face.loops:
            co = loop.vert.co
            sign_y = -1.0 if co.y < 0 else 1.0
            u_local = ((co.x * (-sign_y)) + W / 2) / W
            u = 0.02 + max(0.0, min(1.0, u_local)) * 0.46
            t_z = max(0.0, min(1.0, (co.z - BAND_BOT_Z) / (RIM_Z - BAND_BOT_Z)))
            v = 0.835 + t_z * 0.110
            loop[uv_layer].uv = (u, v)
        return

    if any(r == "in_wall" for r in regions):
        ihw = W * 0.5 - WALL
        ihd = D * 0.5 - WALL
        ps = [_perimeter_param(loop.vert.co.x, loop.vert.co.y, ihw, ihd) for loop in face.loops]
        p0 = ps[0]
        for i, loop in enumerate(face.loops):
            p = ps[i]
            if p - p0 > 0.5:
                p -= 1.0
            elif p0 - p > 0.5:
                p += 1.0
            u = 0.02 + p * 0.46
            t_z = max(0.0, min(1.0, (loop.vert.co.z - FLOOR_Z) / (H - FLOOR_Z)))
            v = 0.02 + t_z * 0.46
            loop[uv_layer].uv = (u, v)
        return

    avg_x = sum(v.co.x for v in face.verts) / len(face.verts)
    avg_y = sum(v.co.y for v in face.verts) / len(face.verts)
    is_front_back = (abs(avg_y) / (D / 2)) >= (abs(avg_x) / (W / 2))

    if is_front_back:
        sign_y = -1.0 if avg_y < 0 else 1.0
        for loop in face.loops:
            co = loop.vert.co
            u_local = ((co.x * (-sign_y)) + W / 2) / W
            u = 0.02 + max(0.0, min(1.0, u_local)) * 0.46
            if co.z >= RIM_Z - 0.0005:
                t_rim = max(0.0, min(1.0, (co.z - RIM_Z) / (H - RIM_Z)))
                v = 0.955 + t_rim * 0.030
            else:
                t_wall = max(0.0, min(1.0, co.z / BAND_BOT_Z))
                v = 0.52 + t_wall * 0.30
            loop[uv_layer].uv = (u, v)
    else:
        sign_x = 1.0 if avg_x >= 0 else -1.0
        for loop in face.loops:
            co = loop.vert.co
            u_local = ((co.y * sign_x) + D / 2) / D
            u = 0.52 + max(0.0, min(1.0, u_local)) * 0.46
            if co.z >= RIM_Z - 0.0005:
                t_rim = max(0.0, min(1.0, (co.z - RIM_Z) / (H - RIM_Z)))
                v = 0.955 + t_rim * 0.030
            else:
                t_wall = max(0.0, min(1.0, co.z / RIM_Z))
                v = 0.52 + t_wall * 0.425
            loop[uv_layer].uv = (u, v)


def build_drona_mesh(mat):
    """Create the single continuous DRÖNA mesh (~950 tris) with realistic details."""
    bm = bmesh.new()
    vert_meta = {}

    hw = W * 0.5
    hd = D * 0.5
    ihw = hw - WALL
    ihd = hd - WALL

    rings_spec = [
        (0.0000, hw - 0.0020, hd - 0.0020, 0.0035, 0.3, "out_bot"),
        (0.0022, hw,          hd,          0.0042, 0.5, "out_wall"),
        (0.0950, hw,          hd,          0.0042, 0.9, "out_wall"),
        (0.1850, hw,          hd,          0.0042, 1.0, "out_wall"),
        (BAND_BOT_Z, hw,      hd,          0.0042, 0.7, "out_wall"),
        (RIM_Z - 0.0005, hw,  hd,          0.0042, 0.2, "out_wall"),
        (RIM_Z + 0.0008, hw + 0.0014, hd + 0.0014, 0.0048, 0.1, "out_wall"),
        (H - 0.0015,     hw + 0.0014, hd + 0.0014, 0.0048, 0.1, "out_wall"),
        (H,              hw - 0.0008, hd - 0.0008, 0.0042, 0.0, "out_wall"),
        (H - 0.0015,     ihw - 0.0008, ihd - 0.0008, 0.0030, 0.0, "in_wall"),
        (RIM_Z + 0.0008, ihw - 0.0008, ihd - 0.0008, 0.0030, 0.0, "in_wall"),
        (RIM_Z - 0.0005, ihw,          ihd,          0.0030, 0.0, "in_wall"),
        (0.1650,         ihw,          ihd,          0.0030, -0.4, "in_wall"),
        (0.0055,         ihw,          ihd,          0.0030, -0.2, "in_wall"),
        (FLOOR_Z,        ihw - 0.0020, ihd - 0.0020, 0.0025, 0.0, "in_bot"),
    ]

    ring_verts = []
    n_perim = 0
    for z, hx, hy, cr, bsign, region in rings_spec:
        pts = _rounded_rect_perimeter(hx, hy, cr, corner_segs=3, side_segs=4, z_for_bulge=z, bulge_sign=bsign)
        n_perim = len(pts)
        for x, y in pts:
            v = bm.verts.new((x, y, z))
            ring_verts.append((v, region))

    n_rings = len(rings_spec)
    rows = [[ring_verts[r_i * n_perim + k][0] for k in range(n_perim)] for r_i in range(n_rings)]

    for r_i in range(n_rings - 1):
        r0 = rows[r_i]
        r1 = rows[r_i + 1]
        for k in range(n_perim):
            kn = (k + 1) % n_perim
            bm.faces.new((r0[k], r0[kn], r1[kn], r1[k]))

    v_out_center = bm.verts.new((0.0, 0.0, 0.0))
    ring_verts.append((v_out_center, "out_bot"))
    for k in range(n_perim):
        kn = (k + 1) % n_perim
        bm.faces.new((v_out_center, rows[0][kn], rows[0][k]))

    v_in_center = bm.verts.new((0.0, 0.0, FLOOR_Z))
    ring_verts.append((v_in_center, "in_bot"))
    for k in range(n_perim):
        kn = (k + 1) % n_perim
        bm.faces.new((v_in_center, rows[-1][k], rows[-1][kn]))

    # Front (-Y) and Back (+Y) wide pull-bands
    band_nx = 7
    band_xs = [-0.1605 + (0.3210 * i / (band_nx - 1)) for i in range(band_nx)]
    band_prof = [
        (BAND_BOT_Z,          0.0000),
        (BAND_BOT_Z + 0.0024, 0.0023),
        (0.2920,              0.0025),
        (RIM_Z - 0.0004,      0.0022),
        (RIM_Z - 0.0002,      0.0000),
    ]

    for sign_y in (-1.0, 1.0):
        grid = []
        for z, off in band_prof:
            row = []
            for i, x in enumerate(band_xs):
                u_norm = i / (band_nx - 1)
                taper = math.sin(math.pi * u_norm) ** 0.25
                bulge = _panel_bulge((x + hw) / W, z)
                y = sign_y * (hd + bulge + off * taper)
                v = bm.verts.new((x, y, z))
                row.append(v)
                ring_verts.append((v, "band"))
            grid.append(row)

        for r_i in range(len(band_prof) - 1):
            for c_i in range(band_nx - 1):
                v00, v10 = grid[r_i][c_i], grid[r_i][c_i + 1]
                v11, v01 = grid[r_i + 1][c_i + 1], grid[r_i + 1][c_i]
                if sign_y < 0:
                    bm.faces.new((v00, v10, v11, v01))
                else:
                    bm.faces.new((v00, v01, v11, v10))

    bm.verts.index_update()
    for v, region in ring_verts:
        vert_meta[v.index] = (region,)

    bm.normal_update()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        _assign_uv(f, uv_layer, vert_meta)

    bmesh.ops.triangulate(bm, faces=bm.faces[:])

    mesh = bpy.data.meshes.new("DronaRedMesh")
    bm.to_mesh(mesh)
    bm.free()

    for poly in mesh.polygons:
        poly.use_smooth = True

    obj = bpy.data.objects.new("DronaRed", mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)

    mod = obj.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL")
    mod.keep_sharp = True
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="WeightedNormal")

    return obj


# ---------------------------------------------------------------------------
# 3. Build, Verify & Export GLB
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)

img_base, img_nrm, img_orm = build_textures()
mat = build_material(img_base, img_nrm, img_orm)
obj = build_drona_mesh(mat)

bpy.context.view_layer.update()
xs, ys, zs = [], [], []
for corner in obj.bound_box:
    wc = obj.matrix_world @ Vector(corner)
    xs.append(wc.x)
    ys.append(wc.y)
    zs.append(wc.z)

dx, dy, dz = max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)
tris = len(obj.data.polygons)
print(f"DronaRed bbox (Blender m): X={dx:.4f} ({dx*100:.2f} cm), Y={dy:.4f} ({dy*100:.2f} cm), Z={dz:.4f} ({dz*100:.2f} cm)")
print(f"Triangles: {tris}, Materials: {len(obj.data.materials)}, Objects: 1")

bpy.ops.export_scene.gltf(
    filepath=OUT_PATH,
    export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_apply=True,
)
size_bytes = os.path.getsize(OUT_PATH)
print(f"Exported {OUT_PATH}: {size_bytes} bytes ({size_bytes / (1024 * 1024):.3f} Mo)")
