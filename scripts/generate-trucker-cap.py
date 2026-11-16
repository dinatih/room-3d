#!/usr/bin/env python3
"""
generate-trucker-cap.py — Génère le GLB haute précision et basse charge de la
casquette de camionneur rouge (TruckerCapRed.glb) avec Blender 5 + PIL.

Caractéristiques :
  - Échelle réelle glTF en mètres (~0.20 × 0.13 × 0.27 m), base à Y=0, centrée X/Z.
  - Panneau mousse avant structuré sans couture verticale médiane (style trucker 5 panneaux)
    avec vraie paroi intérieure doublée visible à travers le filet.
  - Visière rigide incurvée en fer à cheval avec 4 rangées concentriques de surpiqûres rouges.
  - 4 panneaux arrière en filet nylon rouge respirant (alphaMode MASK, double-face),
    découpe demi-circulaire (keyhole) + lanière snapback rouge à 7 picots.
  - 2 matériaux / 2 Draw Calls : TruckerFoamRed (opaque) + TruckerMeshRed (MASK).

Usage :
  blender -b -P scripts/generate-trucker-cap.py
  blender -b -P scripts/generate-trucker-cap.py -- --render
"""
import argparse
import json
import math
import os
import struct
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "public", "items", "trucker-cap-red")
OUT_GLB = os.path.join(OUT_DIR, "TruckerCapRed.glb")
TEX_DIR = "/tmp/trucker_cap_tex"
RENDER_DIR = (
    "/home/dinatih/.gemini/antigravity-cli/brain/"
    "23ad45a2-31a1-49bf-a3f8-542818ad8a9f/scratch"
)

# ── Dimensions réelles en mètres (Blender Z-up, avant = -Y, arrière = +Y) ──
RX = 0.095        # Demi-largeur extérieure de la calotte (~19 cm)
RY_FRONT = 0.105  # Demi-profondeur avant de la calotte
RY_BACK = 0.104   # Demi-profondeur arrière de la calotte
CROWN_H = 0.122   # Hauteur sommet de la calotte
FRONT_HALF_DEG = 58.0
BRIM_LEN = 0.074  # Avancée frontale de la visière (7.4 cm)
BRIM_THICK = 0.0032
FOAM_THICK = 0.0028

SEED = 42


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def smoothstep(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


# ═══════════════════════════════════════════════════════════════════════════════
# PARAMÉTRISATION DE LA CALOTTE & VISIÈRE
# ═══════════════════════════════════════════════════════════════════════════════

def ry_at(theta):
    return RY_FRONT if math.cos(theta) >= 0.0 else RY_BACK


def front_weight(theta):
    """1.0 sur le panneau avant structuré, transition douce vers les panneaux filet."""
    deg = math.degrees(abs(theta))
    return 1.0 - smoothstep((deg - 42.0) / 36.0)


def keyhole_floor_s(theta):
    """Paramètre s_min (0..1) traçant l'ouverture arrière en demi-cercle."""
    dist_back = abs(math.pi - abs(theta))
    half_open = math.radians(34.5)
    if dist_back >= half_open:
        return 0.095
    u = dist_back / half_open
    arch = math.sqrt(max(0.0, 1.0 - u * u))
    return 0.095 + 0.345 * arch


def crown_point(theta, s, radial_offset=0.0):
    """Point Vector((x, y, z)) sur la surface de la calotte."""
    fw = front_weight(theta)

    exp_r = 2.60 * fw + 1.85 * (1.0 - fw)
    pow_r = 0.44 * fw + 0.54 * (1.0 - fw)
    r_fac = pow(max(0.0, 1.0 - pow(s, exp_r)), pow_r)

    forehead_puff = fw * 0.0065 * math.sin(math.pi * clamp(s / 0.85, 0.0, 1.0))
    z_fac = pow(s, 0.82 * fw + 0.94 * (1.0 - fw)) if s > 0.0 else 0.0
    side_dip = -0.0020 * (math.sin(theta) ** 4) * (1.0 - s)

    rx = (RX + radial_offset) * r_fac
    ry = (ry_at(theta) + radial_offset) * r_fac

    x = rx * math.sin(theta)
    y = -ry * math.cos(theta) - forehead_puff * math.cos(theta)
    z = CROWN_H * z_fac + side_dip
    return Vector((x, y, z))


def brim_point(u_lat, t_rad):
    """Point de la ligne médiane de la visière.
    u_lat in [-1, 1] (jonction [-53°, +53°]), t_rad in [0, 1] (racine -> bord avant).
    """
    ang = u_lat * math.radians(53.0)
    base = crown_point(ang, 0.032, radial_offset=-0.0002)

    # Avancée en fer à cheval continue jusqu'aux tempes (zéro pointe latérale)
    radial_profile = pow(max(0.0, 1.0 - 0.86 * (abs(u_lat) ** 2.05)), 0.72)
    forward_len = BRIM_LEN * radial_profile

    dir_x = math.sin(ang) * 0.40
    dir_y = -math.cos(ang)

    lat_pinch = 1.0 - 0.18 * (t_rad ** 1.15)
    x = base.x * lat_pinch + dir_x * forward_len * t_rad * 0.30
    y = base.y + dir_y * forward_len * t_rad

    # Chute verticale modérée + arceau central prononcé (exactement comme la vue face photo)
    pitch_drop = -0.020 * radial_profile * (t_rad ** 1.10)
    center_arch = 0.0155 * math.cos(u_lat * math.pi * 0.5) * smoothstep(t_rad / 0.42) * radial_profile
    z = base.z + pitch_drop + center_arch
    return Vector((x, y, z))


# ═══════════════════════════════════════════════════════════════════════════════
# GÉNÉRATION DES TEXTURES (PIL)
# ═══════════════════════════════════════════════════════════════════════════════

def generate_textures():
    os.makedirs(TEX_DIR, exist_ok=True)
    rng = np.random.default_rng(SEED)

    # ── 1. Texture opaque (768×768 BaseColor, 512×512 Normal & ORM) ──
    S = 768
    col = np.zeros((S, S, 3), dtype=np.float32)
    norm_h = np.zeros((S, S), dtype=np.float32)
    rough = np.full((S, S), 0.80, dtype=np.float32)
    ao = np.ones((S, S), dtype=np.float32)

    # Rouge vif saturé fidèle à la photo Temu (contrôle AgX + faible spécularité tissu)
    red_bright = np.array([168.0, 6.0, 8.0], dtype=np.float32)
    red_lining = np.array([102.0, 4.0, 6.0], dtype=np.float32)
    red_stitch = np.array([204.0, 18.0, 22.0], dtype=np.float32)
    red_plastic = np.array([162.0, 6.0, 9.0], dtype=np.float32)

    yy, xx = np.mgrid[0:S, 0:S]
    twill = (
        np.sin((xx * 1.3 + yy * 1.3) * (2.0 * math.pi / 3.5)) * 0.45
        + np.sin((xx * 1.3 - yy * 1.3) * (2.0 * math.pi / 3.5)) * 0.18
    )
    fine_grain = rng.normal(0.0, 0.010, (S, S)).astype(np.float32)

    col[:, :] = red_bright[None, None, :] * (1.0 + 0.014 * twill[:, :, None] + fine_grain[:, :, None])
    norm_h[:, :] = 0.07 * twill + 0.03 * fine_grain
    rough[:, :] = 0.82 - 0.04 * twill

    H = S // 2  # 384 px par quadrant

    # Quadrant TR (y: 0..H, x: H..S) : Visière + 4 rangées concentriques de surpiqûres
    tr_u = (xx[0:H, H:S] - float(H)) / float(H)
    tr_v = (float(H) - yy[0:H, H:S]) / float(H)
    u_lat = (tr_u - 0.5) / 0.44
    t_rad = (tr_v - 0.08) / 0.84

    # Métrique de distance arrondie au bord avant & latéral pour 4 surpiqûres bien espacées
    edge_d = 1.0 - t_rad
    stitch_targets = [0.065, 0.145, 0.225, 0.305]
    for st in stitch_targets:
        d = np.abs(edge_d - st)
        groove = np.exp(-((d / 0.0085) ** 2))
        dash_phase = u_lat * 48.0 * math.pi
        dash = np.clip(0.5 + 0.5 * np.cos(dash_phase), 0.0, 1.0) ** 1.3
        thread = groove * dash
        ao_groove = groove * (1.0 - dash * 0.65)
        col[0:H, H:S] = (
            col[0:H, H:S] * (1.0 - 0.22 * ao_groove[:, :, None] - 0.32 * thread[:, :, None])
            + red_stitch[None, None, :] * (0.32 * thread[:, :, None])
        )
        norm_h[0:H, H:S] += 0.46 * thread - 0.30 * ao_groove
        ao[0:H, H:S] *= (1.0 - 0.22 * ao_groove)
        rough[0:H, H:S] -= 0.16 * thread

    # Quadrant BL (y: H..S, x: 0..H)
    # Gauche (x 0..H//2) : doublure intérieure & dessous de visière
    Q = H // 2
    col[H:S, 0:Q] = red_lining[None, None, :] * (1.0 + 0.02 * fine_grain[H:S, 0:Q, None])
    rough[H:S, 0:Q] = 0.90
    norm_h[H:S, 0:Q] = 0.08 * fine_grain[H:S, 0:Q]

    # Droite (x Q..H) : rubans de couture & bandeau bas avec double surpiqûre
    bl_u = (xx[H:S, Q:H] - float(Q)) / float(Q)
    bl_v = (float(S) - yy[H:S, Q:H]) / float(H)
    for sv in (0.18, 0.82):
        dg = np.exp(-(((bl_v - sv) / 0.022) ** 2))
        dd = np.clip(0.5 + 0.5 * np.cos(bl_u * 40.0 * math.pi), 0.0, 1.0) ** 1.4
        th = dg * dd
        col[H:S, Q:H] = (
            col[H:S, Q:H] * (1.0 - 0.18 * dg[:, :, None])
            + red_stitch[None, None, :] * (0.28 * th[:, :, None])
        )
        norm_h[H:S, Q:H] += 0.36 * th - 0.22 * dg

    # Quadrant BR (y: H..S, x: H..S) : lanière plastique snapback + 7 picots
    br_u = (xx[H:S, H:S] - float(H)) / float(H)
    br_v = (float(S) - yy[H:S, H:S]) / float(H)
    col[H:S, H:S] = red_plastic[None, None, :]
    rough[H:S, H:S] = 0.40
    norm_h[H:S, H:S] = 0.02 * fine_grain[H:S, H:S]
    rim_lip = np.exp(-(((br_v - 0.14) / 0.035) ** 2)) + np.exp(-(((br_v - 0.86) / 0.035) ** 2))
    norm_h[H:S, H:S] += 0.25 * rim_lip
    ao[H:S, H:S] *= (1.0 - 0.16 * rim_lip)
    for i in range(7):
        pu = 0.16 + i * (0.68 / 6.0)
        dist_pin = np.sqrt(((br_u - pu) / 0.028) ** 2 + ((br_v - 0.50) / 0.12) ** 2)
        pin_bump = np.clip(1.0 - dist_pin * dist_pin, 0.0, 1.0)
        pin_shadow = np.exp(-(((dist_pin - 1.02) / 0.24) ** 2))
        norm_h[H:S, H:S] += 0.55 * pin_bump
        ao[H:S, H:S] *= (1.0 - 0.30 * pin_shadow)
        rough[H:S, H:S] -= 0.14 * pin_bump

    base_path = os.path.join(TEX_DIR, "foam_basecolor.jpg")
    Image.fromarray(np.clip(col, 0, 255).astype(np.uint8), "RGB").save(base_path, quality=88, optimize=True)

    gx = np.zeros_like(norm_h)
    gy = np.zeros_like(norm_h)
    gx[:, 1:-1] = (norm_h[:, 2:] - norm_h[:, :-2]) * 1.4
    gy[1:-1, :] = (norm_h[2:, :] - norm_h[:-2, :]) * 1.4
    nz = np.ones_like(norm_h)
    n_len = np.sqrt(gx * gx + gy * gy + nz * nz)
    n_rgb = np.stack([
        (-gx / n_len * 0.5 + 0.5),
        (gy / n_len * 0.5 + 0.5),
        (nz / n_len * 0.5 + 0.5),
    ], axis=-1)
    norm_img = Image.fromarray(np.clip(n_rgb * 255.0, 0, 255).astype(np.uint8), "RGB")
    norm_img = norm_img.resize((512, 512), Image.Resampling.BILINEAR)
    norm_path = os.path.join(TEX_DIR, "foam_normal.jpg")
    norm_img.save(norm_path, quality=84, optimize=True)

    orm = np.stack([
        np.clip(ao * 255.0, 0, 255),
        np.clip(rough * 255.0, 0, 255),
        np.zeros_like(ao),
    ], axis=-1).astype(np.uint8)
    orm_img = Image.fromarray(orm, "RGB").resize((512, 512), Image.Resampling.BILINEAR)
    orm_path = os.path.join(TEX_DIR, "foam_orm.jpg")
    orm_img.save(orm_path, quality=84, optimize=True)

    # ── 2. Texture Filet Nylon Arrière 128×128 tuilable (motif hexagonal fin) ──
    M = 128
    ny, nx = np.mgrid[0:M, 0:M]
    # 4 colonnes × 6 rangées en nid d'abeille serré par tuile
    u_m = nx / float(M) * 4.0
    v_m = ny / float(M) * 4.0
    w1 = np.abs((u_m + v_m) - np.round(u_m + v_m)) * 2.0
    w2 = np.abs((u_m - v_m) - np.round(u_m - v_m)) * 2.0
    strand_w = 0.29  # Brins robustes conservés après mipmapping WebGL
    dist_net = np.minimum(w1, w2)
    alpha_f = np.clip((strand_w - dist_net) / 0.06 + 0.5, 0.0, 1.0)
    knot = np.exp(-((w1 * w1 + w2 * w2) / 0.13))
    alpha_f = np.clip(alpha_f + 0.40 * knot, 0.0, 1.0)

    h_net = np.clip(1.0 - (dist_net / strand_w) ** 2, 0.0, 1.0) * 0.65 + 0.35 * knot
    mesh_col = np.zeros((M, M, 4), dtype=np.uint8)
    thread_rgb = np.array([174.0, 6.0, 9.0], dtype=np.float32)
    shade = 0.86 + 0.16 * h_net
    mesh_col[:, :, :3] = np.clip(thread_rgb[None, None, :] * shade[:, :, None], 0, 255).astype(np.uint8)
    mesh_col[:, :, 3] = np.clip(alpha_f * 255.0, 0, 255).astype(np.uint8)

    mesh_base_path = os.path.join(TEX_DIR, "mesh_rgba.png")
    Image.fromarray(mesh_col, "RGBA").save(mesh_base_path, optimize=True)

    mgx = (np.roll(h_net, -1, axis=1) - np.roll(h_net, 1, axis=1)) * 1.1
    mgy = (np.roll(h_net, -1, axis=0) - np.roll(h_net, 1, axis=0)) * 1.1
    mnz = np.ones_like(h_net)
    ml = np.sqrt(mgx * mgx + mgy * mgy + mnz * mnz)
    mesh_n = np.stack([
        (-mgx / ml * 0.5 + 0.5),
        (mgy / ml * 0.5 + 0.5),
        (mnz / ml * 0.5 + 0.5),
    ], axis=-1)
    mesh_norm_path = os.path.join(TEX_DIR, "mesh_normal.jpg")
    Image.fromarray(np.clip(mesh_n * 255.0, 0, 255).astype(np.uint8), "RGB").save(mesh_norm_path, quality=84, optimize=True)

    return base_path, norm_path, orm_path, mesh_base_path, mesh_norm_path


# ═══════════════════════════════════════════════════════════════════════════════
# CONSTRUCTION DU MAILLAGE & MATÉRIAUX
# ═══════════════════════════════════════════════════════════════════════════════

def build_materials(paths):
    base_path, norm_path, orm_path, mesh_base_path, mesh_norm_path = paths

    # ── Matériau 0 : Opaque ──
    mat_foam = bpy.data.materials.new("TruckerFoamRed")
    mat_foam.use_nodes = True
    nt = mat_foam.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.16
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    tex_col = nt.nodes.new("ShaderNodeTexImage")
    tex_col.image = bpy.data.images.load(base_path)
    nt.links.new(tex_col.outputs["Color"], bsdf.inputs["Base Color"])

    tex_orm = nt.nodes.new("ShaderNodeTexImage")
    tex_orm.image = bpy.data.images.load(orm_path)
    tex_orm.image.colorspace_settings.name = "Non-Color"
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(tex_orm.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])

    gltf_grp = bpy.data.node_groups.new("glTF Settings", "ShaderNodeTree")
    gltf_grp.interface.new_socket(name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    gltf_node = nt.nodes.new("ShaderNodeGroup")
    gltf_node.node_tree = gltf_grp
    nt.links.new(sep.outputs["Red"], gltf_node.inputs["Occlusion"])

    tex_nrm = nt.nodes.new("ShaderNodeTexImage")
    tex_nrm.image = bpy.data.images.load(norm_path)
    tex_nrm.image.colorspace_settings.name = "Non-Color"
    nrm_node = nt.nodes.new("ShaderNodeNormalMap")
    nrm_node.inputs["Strength"].default_value = 0.65
    nt.links.new(tex_nrm.outputs["Color"], nrm_node.inputs["Color"])
    nt.links.new(nrm_node.outputs["Normal"], bsdf.inputs["Normal"])

    # ── Matériau 1 : Filet Nylon Respirant (export glTF alphaMode=MASK + doubleSided) ──
    mat_mesh = bpy.data.materials.new("TruckerMeshRed")
    mat_mesh.use_nodes = True
    mat_mesh.blend_method = "CLIP"
    mat_mesh.alpha_threshold = 0.45
    mat_mesh.use_backface_culling = False
    nt2 = mat_mesh.node_tree
    nt2.nodes.clear()
    out2 = nt2.nodes.new("ShaderNodeOutputMaterial")
    bsdf2 = nt2.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf2.inputs["Metallic"].default_value = 0.0
    bsdf2.inputs["Roughness"].default_value = 0.58
    if "Specular IOR Level" in bsdf2.inputs:
        bsdf2.inputs["Specular IOR Level"].default_value = 0.22
    nt2.links.new(bsdf2.outputs["BSDF"], out2.inputs["Surface"])

    mtex = nt2.nodes.new("ShaderNodeTexImage")
    mtex.image = bpy.data.images.load(mesh_base_path)
    nt2.links.new(mtex.outputs["Color"], bsdf2.inputs["Base Color"])

    # ShaderNodeMath GREATER_THAN force io_scene_gltf2 (Blender 4.2+/5.x) à exporter alphaMode=MASK
    thresh = nt2.nodes.new("ShaderNodeMath")
    thresh.operation = "GREATER_THAN"
    thresh.inputs[1].default_value = 0.45
    nt2.links.new(mtex.outputs["Alpha"], thresh.inputs[0])
    nt2.links.new(thresh.outputs["Value"], bsdf2.inputs["Alpha"])

    mnrm_tex = nt2.nodes.new("ShaderNodeTexImage")
    mnrm_tex.image = bpy.data.images.load(mesh_norm_path)
    mnrm_tex.image.colorspace_settings.name = "Non-Color"
    mnrm_node = nt2.nodes.new("ShaderNodeNormalMap")
    mnrm_node.inputs["Strength"].default_value = 0.45
    nt2.links.new(mnrm_tex.outputs["Color"], mnrm_node.inputs["Color"])
    nt2.links.new(mnrm_node.outputs["Normal"], bsdf2.inputs["Normal"])

    return mat_foam, mat_mesh


def add_strip_along(bm, uv_layer, points_a, points_b, uv_rect, mat_idx, flip=False):
    u0, v0, u1, v1 = uv_rect
    n = len(points_a)
    va = [bm.verts.new(p) for p in points_a]
    vb = [bm.verts.new(p) for p in points_b]
    for i in range(n - 1):
        t0 = i / (n - 1)
        t1 = (i + 1) / (n - 1)
        ua = u0 + (u1 - u0) * t0
        ub = u0 + (u1 - u0) * t1
        verts = (va[i], va[i + 1], vb[i + 1], vb[i]) if not flip else (vb[i], vb[i + 1], va[i + 1], va[i])
        uvs = ((ua, v0), (ub, v0), (ub, v1), (ua, v1)) if not flip else ((ua, v1), (ub, v1), (ub, v0), (ua, v0))
        f = bm.faces.new(verts)
        f.material_index = mat_idx
        f.smooth = True
        for loop, uv in zip(f.loops, uvs):
            loop[uv_layer].uv = uv


def build_cap_mesh(mat_foam, mat_mesh):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    MAT_FOAM = 0
    MAT_MESH = 1

    f_half = math.radians(FRONT_HALF_DEG)

    # ── 1. Panneau mousse avant structuré (s jusqu'à 0.999 sous le bouton) ──
    n_u_front = 16
    n_v_front = 12
    thetas_f = [-f_half + (2.0 * f_half) * i / n_u_front for i in range(n_u_front + 1)]
    s_vals_f = [0.02 + 0.979 * (j / n_v_front) ** 0.95 for j in range(n_v_front + 1)]

    outer_grid = []
    inner_grid = []
    for s in s_vals_f:
        row_o = []
        row_i = []
        for th in thetas_f:
            row_o.append(bm.verts.new(crown_point(th, s, radial_offset=0.0)))
            row_i.append(bm.verts.new(crown_point(th, s, radial_offset=-FOAM_THICK)))
        outer_grid.append(row_o)
        inner_grid.append(row_i)

    for j in range(n_v_front):
        for i in range(n_u_front):
            f = bm.faces.new((outer_grid[j][i], outer_grid[j][i + 1], outer_grid[j + 1][i + 1], outer_grid[j + 1][i]))
            f.material_index = MAT_FOAM
            f.smooth = True
            u0 = 0.04 + 0.42 * (i / n_u_front)
            u1 = 0.04 + 0.42 * ((i + 1) / n_u_front)
            v0 = 0.54 + 0.42 * (j / n_v_front)
            v1 = 0.54 + 0.42 * ((j + 1) / n_v_front)
            for loop, uv in zip(f.loops, ((u0, v0), (u1, v0), (u1, v1), (u0, v1))):
                loop[uv_layer].uv = uv

            fi = bm.faces.new((inner_grid[j][i + 1], inner_grid[j][i], inner_grid[j + 1][i], inner_grid[j + 1][i + 1]))
            fi.material_index = MAT_FOAM
            fi.smooth = True
            iu0 = 0.03 + 0.19 * ((i + 1) / n_u_front)
            iu1 = 0.03 + 0.19 * (i / n_u_front)
            iv0 = 0.03 + 0.43 * (j / n_v_front)
            iv1 = 0.03 + 0.43 * ((j + 1) / n_v_front)
            for loop, uv in zip(fi.loops, ((iu0, iv0), (iu1, iv0), (iu1, iv1), (iu0, iv1))):
                loop[uv_layer].uv = uv

    for i in range(n_u_front):
        fb = bm.faces.new((inner_grid[0][i], inner_grid[0][i + 1], outer_grid[0][i + 1], outer_grid[0][i]))
        fb.material_index = MAT_FOAM
        fb.smooth = True
        for loop in fb.loops:
            loop[uv_layer].uv = (0.12, 0.24)
    for j in range(n_v_front):
        fL = bm.faces.new((outer_grid[j][0], outer_grid[j + 1][0], inner_grid[j + 1][0], inner_grid[j][0]))
        fR = bm.faces.new((inner_grid[j][-1], inner_grid[j + 1][-1], outer_grid[j + 1][-1], outer_grid[j][-1]))
        for fs in (fL, fR):
            fs.material_index = MAT_FOAM
            fs.smooth = True
            for loop in fs.loops:
                loop[uv_layer].uv = (0.12, 0.24)

    # ── 2. Visière rigide incurvée en fer à cheval + 4 surpiqûres ──
    n_bu = 16
    n_bv = 8
    brim_top = []
    brim_bot = []
    for j in range(n_bv + 1):
        t = j / n_bv
        row_t = []
        row_b = []
        half_th = 0.5 * BRIM_THICK * (1.0 - 0.25 * (t ** 1.4))
        for i in range(n_bu + 1):
            u = -1.0 + 2.0 * (i / n_bu)
            p_mid = brim_point(u, t)
            p_u = brim_point(clamp(u + 0.04, -1.0, 1.0), t) - brim_point(clamp(u - 0.04, -1.0, 1.0), t)
            p_t = brim_point(u, min(1.0, t + 0.05)) - brim_point(u, max(0.0, t - 0.05))
            nrm = p_u.cross(-p_t)
            if nrm.length > 1e-6:
                nrm.normalize()
            else:
                nrm = Vector((0.0, 0.0, 1.0))
            row_t.append(bm.verts.new(p_mid + nrm * half_th))
            row_b.append(bm.verts.new(p_mid - nrm * half_th))
        brim_top.append(row_t)
        brim_bot.append(row_b)

    for j in range(n_bv):
        t0, t1 = j / n_bv, (j + 1) / n_bv
        for i in range(n_bu):
            u0_n, u1_n = -1.0 + 2.0 * (i / n_bu), -1.0 + 2.0 * ((i + 1) / n_bu)
            tu0 = 0.5 + 0.5 * (0.5 + 0.44 * u0_n)
            tu1 = 0.5 + 0.5 * (0.5 + 0.44 * u1_n)
            tv0 = 0.5 + 0.5 * (0.08 + 0.84 * t0)
            tv1 = 0.5 + 0.5 * (0.08 + 0.84 * t1)
            ft = bm.faces.new((brim_top[j][i], brim_top[j + 1][i], brim_top[j + 1][i + 1], brim_top[j][i + 1]))
            ft.material_index = MAT_FOAM
            ft.smooth = True
            for loop, uv in zip(ft.loops, ((tu0, tv0), (tu0, tv1), (tu1, tv1), (tu1, tv0))):
                loop[uv_layer].uv = uv

            fb = bm.faces.new((brim_bot[j][i + 1], brim_bot[j + 1][i + 1], brim_bot[j + 1][i], brim_bot[j][i]))
            fb.material_index = MAT_FOAM
            fb.smooth = True
            for loop in fb.loops:
                loop[uv_layer].uv = (0.14, 0.25)

    edge_top = [brim_top[j][0] for j in range(n_bv)] + [brim_top[n_bv][i] for i in range(n_bu)] + [brim_top[n_bv - j][n_bu] for j in range(n_bv + 1)]
    edge_bot = [brim_bot[j][0] for j in range(n_bv)] + [brim_bot[n_bv][i] for i in range(n_bu)] + [brim_bot[n_bv - j][n_bu] for j in range(n_bv + 1)]
    for k in range(len(edge_top) - 1):
        fe = bm.faces.new((edge_top[k], edge_bot[k], edge_bot[k + 1], edge_top[k + 1]))
        fe.material_index = MAT_FOAM
        fe.smooth = True
        for loop in fe.loops:
            loop[uv_layer].uv = (0.20, 0.72)

    # ── 3. 4 Panneaux filet arrière plus finement maillés (UV métriques) ──
    n_mesh_u = 16
    n_mesh_v = 7
    for side in (-1.0, 1.0):
        grid = []
        uv_grid = []
        for j in range(n_mesh_v + 1):
            frac_v = j / n_mesh_v
            row = []
            uv_row = []
            for i in range(n_mesh_u + 1):
                frac_u = i / n_mesh_u
                th = side * (f_half + (math.pi - f_half) * frac_u)
                s_min = keyhole_floor_s(th)
                s = s_min + (0.999 - s_min) * (frac_v ** 0.92)
                p = crown_point(th, s, radial_offset=-0.0004)
                row.append(bm.verts.new(p))
                r_rel = max(0.24, math.sqrt(max(0.0, 1.0 - s * s * 0.78)))
                # Répétition fine fidèle aux petites mailles de la photo Temu
                u_m = (th - side * f_half) * RX * r_rel * 24.0
                v_m = s * CROWN_H * 20.0
                uv_row.append((u_m, v_m))
            grid.append(row)
            uv_grid.append(uv_row)

        for j in range(n_mesh_v):
            for i in range(n_mesh_u):
                verts = (
                    (grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i])
                    if side > 0
                    else (grid[j][i + 1], grid[j][i], grid[j + 1][i], grid[j + 1][i + 1])
                )
                uvs = (
                    (uv_grid[j][i], uv_grid[j][i + 1], uv_grid[j + 1][i + 1], uv_grid[j + 1][i])
                    if side > 0
                    else (uv_grid[j][i + 1], uv_grid[j][i], uv_grid[j + 1][i], uv_grid[j + 1][i + 1])
                )
                fm = bm.faces.new(verts)
                fm.material_index = MAT_MESH
                fm.smooth = True
                for loop, uv in zip(fm.loops, uvs):
                    loop[uv_layer].uv = uv

    # ── 4. Bandeau bas, rubans de couture & bordure keyhole (OPAQUE) ──
    n_sb = 14
    sb_thetas = [math.radians(54.0 + (145.5 - 54.0) * i / n_sb) for i in range(n_sb + 1)]
    pts_sb_lo = [crown_point(th, 0.018, radial_offset=0.0004) for th in sb_thetas]
    pts_sb_hi = [crown_point(th, 0.098, radial_offset=0.0004) for th in sb_thetas]
    pts_sb_lo_in = [crown_point(th, 0.018, radial_offset=-0.0016) for th in sb_thetas]
    pts_sb_hi_in = [crown_point(th, 0.098, radial_offset=-0.0016) for th in sb_thetas]
    for sgn in (1.0, -1.0):
        lo_o = [Vector((p.x * sgn, p.y, p.z)) for p in pts_sb_lo]
        hi_o = [Vector((p.x * sgn, p.y, p.z)) for p in pts_sb_hi]
        lo_i = [Vector((p.x * sgn, p.y, p.z)) for p in pts_sb_lo_in]
        hi_i = [Vector((p.x * sgn, p.y, p.z)) for p in pts_sb_hi_in]
        add_strip_along(bm, uv_layer, lo_o, hi_o, (0.28, 0.04, 0.48, 0.46), MAT_FOAM, flip=(sgn < 0))
        add_strip_along(bm, uv_layer, lo_i, hi_i, (0.04, 0.04, 0.22, 0.46), MAT_FOAM, flip=(sgn > 0))
        add_strip_along(bm, uv_layer, lo_i, lo_o, (0.28, 0.10, 0.48, 0.25), MAT_FOAM, flip=(sgn < 0))

    # Bordure arquée autour de l'ouverture keyhole (raccordée proprement au bas du bandeau à ±145.5°)
    n_kh = 18
    kh_thetas = [math.radians(180.0 - 34.5 + 69.0 * i / n_kh) for i in range(n_kh + 1)]
    kh_in, kh_out, kh_in_back, kh_out_back = [], [], [], []
    for th in kh_thetas:
        th_wrap = th if th <= math.pi else th - 2.0 * math.pi
        s0 = keyhole_floor_s(th_wrap)
        s_lo = max(0.018, s0 - 0.045)
        s_hi = min(0.95, s0 + 0.036)
        kh_in.append(crown_point(th_wrap, s_lo, radial_offset=0.0005))
        kh_out.append(crown_point(th_wrap, s_hi, radial_offset=0.0005))
        kh_in_back.append(crown_point(th_wrap, s_lo, radial_offset=-0.0014))
        kh_out_back.append(crown_point(th_wrap, s_hi, radial_offset=-0.0014))
    add_strip_along(bm, uv_layer, kh_in, kh_out, (0.28, 0.04, 0.48, 0.46), MAT_FOAM, flip=False)
    add_strip_along(bm, uv_layer, kh_in_back, kh_out_back, (0.04, 0.04, 0.22, 0.46), MAT_FOAM, flip=True)

    # 5 rubans de couture verticaux : bordures front/mesh (±58°), latéraux (±119°), milieu arrière (180°)
    for seam_deg in (-58.0, 58.0, -119.0, 119.0, 180.0):
        th_c = math.radians(seam_deg)
        s_start = keyhole_floor_s(th_c)
        n_sr = 8
        pts_l, pts_r = [], []
        for j in range(n_sr + 1):
            s = s_start + (0.996 - s_start) * (j / n_sr)
            d_th = math.radians(2.0) / max(0.35, 1.0 - s * 0.72)
            pts_l.append(crown_point(th_c - d_th, s, radial_offset=0.0005))
            pts_r.append(crown_point(th_c + d_th, s, radial_offset=0.0005))
        add_strip_along(bm, uv_layer, pts_l, pts_r, (0.28, 0.04, 0.48, 0.46), MAT_FOAM, flip=False)

    # ── 5. Bouton supérieur en tissu (Squatchee) ──
    apex = crown_point(0.0, 0.999, radial_offset=0.0)
    btn_r = 0.0090
    btn_h = 0.0046
    n_btn = 12
    btn_bot = [bm.verts.new((apex.x + btn_r * math.cos(2 * math.pi * i / n_btn), apex.y + btn_r * math.sin(2 * math.pi * i / n_btn), apex.z - 0.0010)) for i in range(n_btn)]
    btn_mid = [bm.verts.new((apex.x + 0.92 * btn_r * math.cos(2 * math.pi * i / n_btn), apex.y + 0.92 * btn_r * math.sin(2 * math.pi * i / n_btn), apex.z + 0.55 * btn_h)) for i in range(n_btn)]
    btn_top = bm.verts.new((apex.x, apex.y, apex.z + btn_h))
    for i in range(n_btn):
        ni = (i + 1) % n_btn
        fb1 = bm.faces.new((btn_bot[i], btn_bot[ni], btn_mid[ni], btn_mid[i]))
        fb2 = bm.faces.new((btn_mid[i], btn_mid[ni], btn_top))
        for f in (fb1, fb2):
            f.material_index = MAT_FOAM
            f.smooth = True
            for loop in f.loops:
                loop[uv_layer].uv = (0.25, 0.75)

    # ── 6. Lanière snapback plastique rouge rentrée proprement sous la bordure keyhole ──
    for th_a_deg, th_b_deg, r_off in [
        (146.5, 196.0, 0.0000),
        (166.0, 213.5, 0.0014),
    ]:
        n_st = 10
        p_lo_o, p_hi_o, p_lo_i, p_hi_i = [], [], [], []
        for i in range(n_st + 1):
            th_d = th_a_deg + (th_b_deg - th_a_deg) * (i / n_st)
            th_r = math.radians(th_d if th_d <= 180.0 else th_d - 360.0)
            p_lo_o.append(crown_point(th_r, 0.115, radial_offset=r_off))
            p_hi_o.append(crown_point(th_r, 0.220, radial_offset=r_off))
            p_lo_i.append(crown_point(th_r, 0.115, radial_offset=r_off - 0.0015))
            p_hi_i.append(crown_point(th_r, 0.220, radial_offset=r_off - 0.0015))
        add_strip_along(bm, uv_layer, p_lo_o, p_hi_o, (0.52, 0.04, 0.98, 0.46), MAT_FOAM, flip=False)
        add_strip_along(bm, uv_layer, p_lo_i, p_hi_i, (0.55, 0.20, 0.62, 0.30), MAT_FOAM, flip=True)
        add_strip_along(bm, uv_layer, p_hi_o, p_hi_i, (0.55, 0.20, 0.62, 0.30), MAT_FOAM, flip=False)
        add_strip_along(bm, uv_layer, p_lo_i, p_lo_o, (0.55, 0.20, 0.62, 0.30), MAT_FOAM, flip=False)

    bmesh.ops.recalc_face_normals(bm, faces=[f for f in bm.faces if f.material_index == MAT_FOAM])

    mesh = bpy.data.meshes.new("TruckerCapMesh")
    bm.to_mesh(mesh)
    bm.free()

    mesh.materials.append(mat_foam)
    mesh.materials.append(mat_mesh)

    obj = bpy.data.objects.new("TruckerCapRed", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def settle_on_ground_and_center(obj):
    mesh = obj.data
    best_rx = 0.0
    best_diff = 1e9
    for deg in np.linspace(-8.0, 8.0, 65):
        rad = math.radians(deg)
        mat = Matrix.Rotation(rad, 4, "X")
        z_front = 1e9
        z_back = 1e9
        for v in mesh.vertices:
            p = mat @ v.co
            if p.y < -0.10:
                z_front = min(z_front, p.z)
            elif p.y > 0.05:
                z_back = min(z_back, p.z)
        diff = abs(z_front - z_back)
        if diff < best_diff:
            best_diff = diff
            best_rx = rad

    rot_mat = Matrix.Rotation(best_rx, 4, "X")
    for v in mesh.vertices:
        v.co = rot_mat @ v.co

    xs = [v.co.x for v in mesh.vertices]
    ys = [v.co.y for v in mesh.vertices]
    zs = [v.co.z for v in mesh.vertices]
    cx = 0.5 * (min(xs) + max(xs))
    cy = 0.5 * (min(ys) + max(ys))
    zmin = min(zs)
    for v in mesh.vertices:
        v.co.x -= cx
        v.co.y -= cy
        v.co.z -= zmin
    mesh.update()

    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL")
    mod.keep_sharp = False
    bpy.ops.object.modifier_apply(modifier=mod.name)


# ═══════════════════════════════════════════════════════════════════════════════
# RENDUS EEVEE + EXPORT GLB
# ═══════════════════════════════════════════════════════════════════════════════

def render_views(obj):
    os.makedirs(RENDER_DIR, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 700
    scene.render.image_settings.file_format = "PNG"

    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.88, 0.88, 0.89, 1.0)
        bg.inputs[1].default_value = 0.70

    for name, loc, energy, size in [
        ("KeyLight", (-0.65, -0.80, 0.90), 32.0, 0.9),
        ("FillLight", (0.75, -0.50, 0.65), 14.0, 1.2),
        ("RimLight", (0.15, 0.85, 0.70), 18.0, 0.8),
    ]:
        ldata = bpy.data.lights.new(name, type="AREA")
        ldata.energy = energy
        ldata.size = size
        lobj = bpy.data.objects.new(name, ldata)
        lobj.location = loc
        direction = Vector((0.0, 0.0, 0.06)) - Vector(loc)
        lobj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lobj)

    bpy.ops.mesh.primitive_plane_add(size=1.2, location=(0.0, 0.0, -0.0005))
    plane = bpy.context.active_object
    pmat = bpy.data.materials.new("GroundPlane")
    pmat.use_nodes = True
    pmat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.90, 0.90, 0.91, 1.0)
    pmat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.85
    plane.data.materials.append(pmat)

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    views = [
        ("trucker_front_3q.png", (-0.34, -0.30, 0.16), (0.0, 0.0, 0.062)),
        ("trucker_back_3q.png", (0.28, 0.30, 0.15), (0.0, 0.01, 0.062)),
        ("trucker_side.png", (-0.42, 0.0, 0.10), (0.0, 0.0, 0.062)),
        ("trucker_front.png", (0.0, -0.40, 0.13), (0.0, -0.01, 0.062)),
    ]
    for fname, loc, target in views:
        cam_obj.location = loc
        direction = Vector(target) - Vector(loc)
        cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(RENDER_DIR, fname)
        bpy.ops.render.render(write_still=True)

    for o in list(bpy.data.objects):
        if o != obj:
            bpy.data.objects.remove(o, do_unlink=True)


def export_glb(obj):
    os.makedirs(OUT_DIR, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )


def inspect_glb_summary(glb_path, obj):
    size_bytes = os.path.getsize(glb_path)
    with open(glb_path, "rb") as f:
        magic, version, length = struct.unpack("<III", f.read(12))
        chunk_len, chunk_type = struct.unpack("<II", f.read(8))
        gltf = json.loads(f.read(chunk_len).decode("utf-8"))

    mesh = obj.data
    mesh.calc_loop_triangles()
    tris = len(mesh.loop_triangles)
    xs = [v.co.x for v in mesh.vertices]
    ys = [v.co.y for v in mesh.vertices]
    zs = [v.co.z for v in mesh.vertices]
    w_cm = (max(xs) - min(xs)) * 100.0
    d_cm = (max(ys) - min(ys)) * 100.0
    h_cm = (max(zs) - min(zs)) * 100.0
    prims = sum(len(m.get("primitives", [])) for m in gltf.get("meshes", []))
    mats = [(m.get("name"), m.get("alphaMode", "OPAQUE"), m.get("doubleSided", False)) for m in gltf.get("materials", [])]

    print(f"OUT_GLB={glb_path}")
    print(f"BYTES={size_bytes} ({size_bytes / 1024:.2f} Ko)")
    print(f"TRIS={tris} PRIMITIVES={prims}")
    print(f"DIMS_CM=({w_cm:.2f}, {d_cm:.2f}, {h_cm:.2f}) [w, d, h]")
    print(f"MATERIALS={mats}")

    if not any(m[1] == "MASK" and m[2] is True for m in mats):
        raise RuntimeError(f"Expected a doubleSided MASK material for rear mesh, got {mats}")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args(argv)

    clear_scene()
    paths = generate_textures()
    mat_foam, mat_mesh = build_materials(paths)
    obj = build_cap_mesh(mat_foam, mat_mesh)
    settle_on_ground_and_center(obj)

    if args.render:
        render_views(obj)

    export_glb(obj)
    inspect_glb_summary(OUT_GLB, obj)


if __name__ == "__main__":
    main()
