"""Generate a detailed, realistic 3D GLB of the red roll-top backpack (Temu / LIVING TRAVELING SHARE)."""
import math
import os
import tempfile
import bpy
import bmesh
from mathutils import Euler, Matrix, Vector
from PIL import Image, ImageDraw, ImageFont

OUT_PATH = "/home/dinatih/Projects/room-3d/public/items/backpack/Backpack.glb"
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)

TEX_DIR = tempfile.mkdtemp(prefix="backpack_tex_")


# ---------------------------------------------------------------------------
# Procedural Textures (packed into GLB)
# ---------------------------------------------------------------------------
def build_label_texture():
    """Create crisp woven label texture: LIVING TRAVELING SHARE / FROM YOURS / NICE TO MEET YOU."""
    w, h = 512, 320
    img = Image.new("RGB", (w, h), (15, 15, 17))
    draw = ImageDraw.Draw(img)

    for y in range(0, h, 2):
        shade = 13 if (y // 2) % 2 == 0 else 19
        draw.line([(0, y), (w, y)], fill=(shade, shade, shade + 1), width=1)

    draw.rectangle([10, 10, w - 11, h - 11], outline=(32, 32, 36), width=2)

    def load_font(size, serif=True):
        candidates = (
            [
                "/usr/share/fonts/noto/NotoSerif-Regular.ttf",
                "/usr/share/fonts/noto/NotoSerif-SemiBold.ttf",
            ]
            if serif
            else [
                "/usr/share/fonts/noto/NotoSans-Regular.ttf",
                "/usr/share/fonts/noto/NotoSans-Medium.ttf",
            ]
        )
        for p in candidates:
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
        raise RuntimeError("No Noto TTF font found for label texture")

    font_big = load_font(58, serif=True)
    font_small = load_font(20, serif=False)
    text_col = (234, 230, 224)

    y_cur = 24
    for line in ["LIVING", "TRAVELING", "SHARE"]:
        bbox = draw.textbbox((0, 0), line, font=font_big)
        tw = bbox[2] - bbox[0]
        draw.text(((w - tw) / 2, y_cur), line, fill=text_col, font=font_big)
        y_cur += 62

    y_cur += 22
    for line in ["FROM YOURS", "NICE TO MEET YOU"]:
        bbox = draw.textbbox((0, 0), line, font=font_small)
        tw = bbox[2] - bbox[0]
        draw.text(((w - tw) / 2, y_cur), line, fill=text_col, font=font_small)
        y_cur += 26

    path = os.path.join(TEX_DIR, "label_patch.png")
    img.save(path)
    b_img = bpy.data.images.load(path)
    b_img.pack()
    return b_img


def build_oxford_weave_normal():
    """Create a tileable subtle Oxford nylon fabric normal map."""
    size = 128
    img = Image.new("RGB", (size, size), (128, 128, 255))
    px = img.load()
    for y in range(size):
        for x in range(size):
            cx = (x % 8) / 8.0 * 2.0 * math.pi
            cy = (y % 8) / 8.0 * 2.0 * math.pi
            cell = ((x // 4) + (y // 4)) % 2
            if cell == 0:
                dx = math.cos(cx) * 13.0
                dy = math.sin(cy) * 5.0
            else:
                dx = math.sin(cx) * 5.0
                dy = math.cos(cy) * 13.0
            px[x, y] = (
                max(0, min(255, int(128 + dx))),
                max(0, min(255, int(128 + dy))),
                252,
            )
    path = os.path.join(TEX_DIR, "oxford_normal.png")
    img.save(path)
    b_img = bpy.data.images.load(path)
    b_img.colorspace_settings.name = 'Non-Color'
    b_img.pack()
    return b_img


def build_webbing_normal():
    """Create a tileable ribbed nylon webbing normal map."""
    size = 128
    img = Image.new("RGB", (size, size), (128, 128, 255))
    px = img.load()
    for y in range(size):
        for x in range(size):
            rib = math.sin((y % 6) / 6.0 * 2.0 * math.pi) * 26.0
            warp = math.sin((x % 8) / 8.0 * 2.0 * math.pi) * 10.0
            px[x, y] = (
                max(0, min(255, int(128 + warp))),
                max(0, min(255, int(128 + rib))),
                248,
            )
    path = os.path.join(TEX_DIR, "webbing_normal.png")
    img.save(path)
    b_img = bpy.data.images.load(path)
    b_img.colorspace_settings.name = 'Non-Color'
    b_img.pack()
    return b_img


img_label = build_label_texture()
img_oxford_nrm = build_oxford_weave_normal()
img_webbing_nrm = build_webbing_normal()


# ---------------------------------------------------------------------------
# Materials (1 material per Blender mesh object for mergeGlbByMaterial)
# ---------------------------------------------------------------------------
def make_fabric_mat(name, base_color, roughness=0.78, metallic=0.0, normal_img=None, normal_strength=0.20, uv_scale=24.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if normal_img is not None:
        tex = nt.nodes.new("ShaderNodeTexImage")
        tex.image = normal_img
        mapping = nt.nodes.new("ShaderNodeMapping")
        mapping.inputs["Scale"].default_value = (uv_scale, uv_scale, 1.0)
        uv = nt.nodes.new("ShaderNodeTexCoord")
        nrm = nt.nodes.new("ShaderNodeNormalMap")
        nrm.inputs["Strength"].default_value = normal_strength
        nt.links.new(uv.outputs["UV"], mapping.inputs["Vector"])
        nt.links.new(mapping.outputs["Vector"], tex.inputs["Vector"])
        nt.links.new(tex.outputs["Color"], nrm.inputs["Color"])
        nt.links.new(nrm.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def make_label_mat():
    mat = bpy.data.materials.new(name="LabelPatch")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 0.72
    bsdf.inputs["Metallic"].default_value = 0.0
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img_label
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


# Saturated deep crimson/cardinal red Oxford cloth matching photo & Drona palette
mat_fabric_red = make_fabric_mat(
    "BackpackFabricRed", (0.40, 0.0018, 0.0032), roughness=0.78,
    normal_img=img_oxford_nrm, normal_strength=0.18, uv_scale=24.0
)
# Deeper crimson for piping, seams & back cushion contrast
mat_fabric_dark = make_fabric_mat(
    "BackpackFabricDarkRed", (0.26, 0.0012, 0.0022), roughness=0.84,
    normal_img=img_oxford_nrm, normal_strength=0.16, uv_scale=24.0
)
# Woven nylon webbing straps (slightly warmer/brighter crimson with ribbed normal)
mat_webbing_red = make_fabric_mat(
    "BackpackWebbingRed", (0.50, 0.0040, 0.0055), roughness=0.68,
    normal_img=img_webbing_nrm, normal_strength=0.35, uv_scale=16.0
)
# Matte/satin black plastic buckles & hardware
mat_buckle_black = make_fabric_mat("BackpackBuckleBlack", (0.018, 0.018, 0.020), roughness=0.38, metallic=0.05)
# Dark recessed zipper tracks
mat_zipper_track = make_fabric_mat("BackpackZipperTrack", (0.035, 0.006, 0.008), roughness=0.62, metallic=0.12)
# Brushed chrome/silver zipper pulls
mat_metal_silver = make_fabric_mat("BackpackZipperSilver", (0.76, 0.78, 0.81), roughness=0.22, metallic=0.92)
# Woven brand patch
mat_patch_label = make_label_mat()


# ---------------------------------------------------------------------------
# Parametric Body Profile (meters, Blender Z-up, -Y = Front, +Y = Back)
# Total depth engineered to ~0.170 m (17.0 cm) to fit LivingRoomPlacements.tsx
# ---------------------------------------------------------------------------
H_BODY = 0.430


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def smoothstep(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def body_half_w(z):
    """Half-width X(z): ~0.146 at base -> 0.166 at mid -> 0.184 at top fold ears."""
    t = clamp(z / H_BODY, 0.0, 1.0)
    return 0.146 + 0.024 * math.pow(t, 0.72) + 0.014 * smoothstep(0.65, 1.0, t)


def body_half_d(z):
    """Half-depth Y(z): ~0.059 at base, ~0.062 belly at mid, tapers to 0.024 at top fold."""
    t = clamp(z / H_BODY, 0.0, 1.0)
    belly = 0.059 + 0.004 * math.sin(min(t * 2.2, 1.0) * math.pi)
    top_taper = smoothstep(0.58, 1.0, t)
    return belly * (1.0 - 0.58 * top_taper)


def body_corner_r(z):
    t = clamp(z / H_BODY, 0.0, 1.0)
    return 0.026 * (1.0 - 0.55 * smoothstep(0.65, 1.0, t))


def rounded_rect_ring(hw, hd, r, n_per_corner=6):
    """Generate 2D CCW points around a rounded rectangle centered at (0,0)."""
    r = min(r, hw * 0.85, hd * 0.85)
    ix = hw - r
    iy = hd - r
    corners = [
        (ix, iy, 0.0),
        (-ix, iy, math.pi * 0.5),
        (-ix, -iy, math.pi),
        (ix, -iy, math.pi * 1.5),
    ]
    pts = []
    edge_steps = 4
    for idx, (cx, cy, a0) in enumerate(corners):
        for i in range(n_per_corner):
            a = a0 + (math.pi * 0.5) * (i / n_per_corner)
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
        nx, ny, na0 = corners[(idx + 1) % 4]
        p_end = (cx + math.cos(a0 + math.pi * 0.5) * r, cy + math.sin(a0 + math.pi * 0.5) * r)
        p_next = (nx + math.cos(na0) * r, ny + math.sin(na0) * r)
        for s in range(1, edge_steps):
            f = s / edge_steps
            pts.append((p_end[0] + (p_next[0] - p_end[0]) * f, p_end[1] + (p_next[1] - p_end[1]) * f))
    return pts


def body_front_y(x, z):
    """Approximate front surface Y coordinate at (x, z)."""
    hd = body_half_d(z)
    hw = body_half_w(z)
    nx = clamp(abs(x) / max(hw, 1e-4), 0.0, 1.0)
    bulge = 0.0040 * (1.0 - nx * nx) * math.sin(clamp(z / H_BODY, 0.0, 1.0) * math.pi)
    edge_falloff = math.pow(max(0.0, 1.0 - math.pow(nx, 4.5)), 0.35)
    return -(hd * edge_falloff + bulge)


def body_back_y(x, z):
    """Approximate back surface Y coordinate at (x, z)."""
    hd = body_half_d(z)
    hw = body_half_w(z)
    nx = clamp(abs(x) / max(hw, 1e-4), 0.0, 1.0)
    bulge = 0.0020 * (1.0 - nx * nx) * math.sin(clamp(z / H_BODY, 0.0, 1.0) * math.pi)
    edge_falloff = math.pow(max(0.0, 1.0 - math.pow(nx, 4.5)), 0.35)
    return hd * edge_falloff + bulge


def flap_centerline(s):
    """Smooth C1 path (y, z, hw) for the fold-over top flap for s in [0, 1]."""
    # s in [0, 0.25]: back rising from z=0.378 to crest base z=0.422
    # s in [0.25, 0.45]: smooth rounded top crest peaking at z=0.431
    # s in [0.45, 1.0]: draping down front from z=0.422 to z=0.332
    if s <= 0.25:
        u = s / 0.25
        z = 0.378 + (0.422 - 0.378) * u
        y = body_back_y(0.0, z) + 0.003
        hw = 0.174 + 0.011 * u
    elif s <= 0.45:
        u = (s - 0.25) / 0.20
        ang = math.pi * u  # 0 -> pi
        z = 0.422 + 0.009 * math.sin(ang)
        y_back = body_back_y(0.0, 0.422) + 0.003
        y_front = body_front_y(0.0, 0.422) - 0.007
        y = y_back + (y_front - y_back) * (0.5 - 0.5 * math.cos(ang))
        hw = 0.185 + 0.001 * math.sin(ang)
    else:
        u = (s - 0.45) / 0.55
        z = 0.422 - (0.422 - 0.332) * u
        y = body_front_y(0.0, z) - 0.0075
        hw = 0.185 - 0.011 * u
    return y, z, hw


def finish_mesh(name, bm, mat, smooth=True, loc=(0, 0, 0), rot=(0, 0, 0)):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    uv_layer = bm.loops.layers.uv.verify()
    for f in bm.faces:
        all_zero = all(l[uv_layer].uv.length < 1e-6 for l in f.loops)
        if all_zero:
            n = f.normal
            ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
            for l in f.loops:
                co = l.vert.co
                if az >= ax and az >= ay:
                    l[uv_layer].uv = (co.x * 2.5, co.y * 2.5)
                elif ay >= ax:
                    l[uv_layer].uv = (co.x * 2.5, co.z * 2.5)
                else:
                    l[uv_layer].uv = (co.y * 2.5, co.z * 2.5)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = smooth
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = rot
    obj.data.materials.append(mat)
    return obj


def sweep_ribbon(bm, points, widths, thickness, face_normal_hint=None, uv_v_scale=4.0):
    """Sweep a flat-rounded webbing ribbon along a 3D centerline path."""
    n = len(points)
    rings = []
    for i, p in enumerate(points):
        p_vec = Vector(p)
        if i == 0:
            tan = (Vector(points[1]) - p_vec).normalized()
        elif i == n - 1:
            tan = (p_vec - Vector(points[n - 2])).normalized()
        else:
            tan = (Vector(points[i + 1]) - Vector(points[i - 1])).normalized()

        if face_normal_hint is not None:
            hint = Vector(face_normal_hint[i] if isinstance(face_normal_hint, list) else face_normal_hint).normalized()
            side = hint.cross(tan).normalized()
            if side.length < 1e-4:
                side = Vector((1, 0, 0))
            norm = tan.cross(side).normalized()
        else:
            up_ref = Vector((0, -1, 0)) if abs(tan.y) < 0.85 else Vector((0, 0, 1))
            side = tan.cross(up_ref).normalized()
            if side.length < 1e-4:
                side = Vector((1, 0, 0))
            norm = side.cross(tan).normalized()

        hw = (widths[i] if isinstance(widths, list) else widths) * 0.5
        ht = thickness * 0.5

        profile = [
            (-hw, -ht * 0.65),
            (-hw * 0.72, -ht),
            (hw * 0.72, -ht),
            (hw, -ht * 0.65),
            (hw, ht * 0.65),
            (hw * 0.72, ht),
            (-hw * 0.72, ht),
            (-hw, ht * 0.65),
        ]
        ring = [bm.verts.new(p_vec + side * px + norm * py) for px, py in profile]
        rings.append(ring)

    uv_layer = bm.loops.layers.uv.verify()
    m = len(rings[0])
    dist = 0.0
    for i in range(n - 1):
        seg_len = (Vector(points[i + 1]) - Vector(points[i])).length
        v0 = dist * uv_v_scale
        v1 = (dist + seg_len) * uv_v_scale
        dist += seg_len
        for j in range(m):
            nj = (j + 1) % m
            f = bm.faces.new((rings[i][j], rings[i][nj], rings[i + 1][nj], rings[i + 1][j]))
            f.loops[0][uv_layer].uv = (j / m, v0)
            f.loops[1][uv_layer].uv = ((j + 1) / m, v0)
            f.loops[2][uv_layer].uv = ((j + 1) / m, v1)
            f.loops[3][uv_layer].uv = (j / m, v1)

    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])


def add_rounded_box_bm(bm, center, size, bevel=0.002, segs=2, rot=(0, 0, 0)):
    sub = bmesh.new()
    bmesh.ops.create_cube(sub, size=1.0)
    bmesh.ops.scale(sub, vec=size, verts=sub.verts)
    if bevel > 0:
        bmesh.ops.bevel(sub, geom=list(sub.edges), offset=bevel, segments=segs, affect='EDGES', clamp_overlap=True)
    xf = Matrix.Translation(Vector(center)) @ Euler(rot, 'XYZ').to_matrix().to_4x4()
    bmesh.ops.transform(sub, matrix=xf, verts=sub.verts)
    vmap = {v: bm.verts.new(v.co) for v in sub.verts}
    for f in sub.faces:
        bm.faces.new([vmap[v] for v in f.verts])
    sub.free()


def add_tube_along_points(bm, pts, radius, segs=8, closed=False):
    n = len(pts)
    rings = []
    for i, p in enumerate(pts):
        pv = Vector(p)
        if closed:
            tan = (Vector(pts[(i + 1) % n]) - Vector(pts[(i - 1) % n])).normalized()
        else:
            if i == 0:
                tan = (Vector(pts[1]) - pv).normalized()
            elif i == n - 1:
                tan = (pv - Vector(pts[n - 2])).normalized()
            else:
                tan = (Vector(pts[i + 1]) - Vector(pts[i - 1])).normalized()
        ref = Vector((0, 0, 1)) if abs(tan.z) < 0.9 else Vector((1, 0, 0))
        u = tan.cross(ref).normalized()
        v = tan.cross(u).normalized()
        ring = []
        for k in range(segs):
            a = 2.0 * math.pi * k / segs
            ring.append(bm.verts.new(pv + (u * math.cos(a) + v * math.sin(a)) * radius))
        rings.append(ring)

    limit = n if closed else n - 1
    for i in range(limit):
        ni = (i + 1) % n
        for k in range(segs):
            nk = (k + 1) % segs
            bm.faces.new((rings[i][k], rings[ni][k], rings[ni][nk], rings[i][nk]))
    if not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])


# ---------------------------------------------------------------------------
# 1. Main Bag Body Shell
# ---------------------------------------------------------------------------
def build_main_body():
    bm = bmesh.new()
    z_levels = [
        0.000, 0.005, 0.015, 0.032, 0.070, 0.120, 0.175,
        0.230, 0.285, 0.335, 0.375, 0.405, 0.422,
    ]
    rings = []
    for zi, z in enumerate(z_levels):
        bot_scale = 1.0
        if zi == 0:
            bot_scale = 0.87
        elif zi == 1:
            bot_scale = 0.94
        elif zi == 2:
            bot_scale = 0.985

        hw = body_half_w(z) * bot_scale
        hd = body_half_d(z) * bot_scale
        r = body_corner_r(z) * bot_scale
        pts = rounded_rect_ring(hw, hd, r, n_per_corner=5)

        ring = []
        t_h = clamp(z / H_BODY, 0.0, 1.0)
        for px, py in pts:
            nx = abs(px) / max(hw, 1e-4)
            ny = abs(py) / max(hd, 1e-4)
            if abs(py) > hd * 0.55 and z > 0.02:
                bulge = 0.0040 * (1.0 - nx * nx) * math.sin(t_h * math.pi)
                if py < 0:
                    py -= bulge
                else:
                    py += bulge * 0.5
            if abs(px) > hw * 0.85 and z > 0.25:
                py *= 1.0 - 0.12 * smoothstep(0.25, 0.42, z) * (1.0 - ny)
            ring.append(bm.verts.new((px, py, z)))
        rings.append(ring)

    n_ring = len(rings[0])
    for k in range(len(rings) - 1):
        r0, r1 = rings[k], rings[k + 1]
        for i in range(n_ring):
            ni = (i + 1) % n_ring
            bm.faces.new((r0[i], r0[ni], r1[ni], r1[i]))

    bot_center = bm.verts.new((0.0, 0.0, 0.0))
    for i in range(n_ring):
        ni = (i + 1) % n_ring
        bm.faces.new((bot_center, rings[0][ni], rings[0][i]))

    top_center = bm.verts.new((0.0, 0.0, 0.424))
    for i in range(n_ring):
        ni = (i + 1) % n_ring
        bm.faces.new((top_center, rings[-1][i], rings[-1][ni]))

    finish_mesh("MainBody", bm, mat_fabric_red, smooth=True)


# ---------------------------------------------------------------------------
# 2. Fold-Over Top Flap (smooth C1 wrap over the top edge, no corner fins)
# ---------------------------------------------------------------------------
def build_fold_flap():
    bm = bmesh.new()
    nx = 34
    ns = 24
    thick = 0.0052
    grid_outer = []
    grid_inner = []

    center_pts = [flap_centerline(is_ / ns) for is_ in range(ns + 1)]
    for is_ in range(ns + 1):
        s = is_ / ns
        y_base, z_base, hw = center_pts[is_]
        # Compute smooth 2D tangent in (Y, Z) plane for clean normal offset
        y_prev, z_prev, _ = center_pts[max(0, is_ - 1)]
        y_next, z_next, _ = center_pts[min(ns, is_ + 1)]
        ty, tz = y_next - y_prev, z_next - z_prev
        # Outward normal in (Y, Z): rotate tangent 90 deg CCW -> (-tz, ty) wait:
        # From back rising (+Z) over top (-Y) down front (-Z): tangent=(0,+1)->( -1,0)->(0,-1),
        # so outward normal = (tz, -ty) gives (+1,0)->(0,+1)->(-1,0)!
        n_yz = Vector((0.0, tz, -ty)).normalized()

        front_amount = smoothstep(0.32, 0.52, s)
        back_amount = 1.0 - smoothstep(0.20, 0.40, s)

        row_o = []
        row_i = []
        for ix in range(nx + 1):
            fx = (ix / nx) * 2.0 - 1.0
            x = fx * hw
            # Wrap back gently at outer edges on the front; wrap forward slightly on the back
            wrap_front = math.pow(abs(fx), 3.6) * 0.018 * front_amount
            wrap_back = math.pow(abs(fx), 3.6) * 0.010 * back_amount
            strap_pinch = 0.0032 * math.exp(-(fx * 7.5) ** 2) * smoothstep(0.45, 0.98, s)
            hem_wave = 0.0014 * math.cos(fx * math.pi * 3.0) * smoothstep(0.60, 1.0, s)

            y = y_base + wrap_front - wrap_back + strap_pinch + hem_wave
            po = Vector((x, y, z_base)) + n_yz * (thick * 0.5)
            pi = Vector((x, y, z_base)) - n_yz * (thick * 0.5)
            row_o.append(bm.verts.new(po))
            row_i.append(bm.verts.new(pi))
        grid_outer.append(row_o)
        grid_inner.append(row_i)

    for is_ in range(ns):
        for ix in range(nx):
            bm.faces.new((grid_outer[is_][ix], grid_outer[is_][ix + 1], grid_outer[is_ + 1][ix + 1], grid_outer[is_ + 1][ix]))
            bm.faces.new((grid_inner[is_][ix], grid_inner[is_ + 1][ix], grid_inner[is_ + 1][ix + 1], grid_inner[is_][ix + 1]))

    for ix in range(nx):
        bm.faces.new((grid_outer[0][ix], grid_inner[0][ix], grid_inner[0][ix + 1], grid_outer[0][ix + 1]))
        bm.faces.new((grid_outer[ns][ix], grid_outer[ns][ix + 1], grid_inner[ns][ix + 1], grid_inner[ns][ix]))
    for is_ in range(ns):
        bm.faces.new((grid_outer[is_][0], grid_outer[is_ + 1][0], grid_inner[is_ + 1][0], grid_inner[is_][0]))
        bm.faces.new((grid_outer[is_][nx], grid_inner[is_][nx], grid_inner[is_ + 1][nx], grid_outer[is_ + 1][nx]))

    finish_mesh("FoldFlap", bm, mat_fabric_red, smooth=True)


# ---------------------------------------------------------------------------
# 3. Flush Perimeter Piping & Flap Hem Trim
# ---------------------------------------------------------------------------
def build_piping():
    bm = bmesh.new()
    # Sample exact seam positions on the rounded-rectangle body surface
    for side_y in (-1.0, 1.0):
        pts = []
        # Left seam going down (x = -(hw - r*0.35), y = side_y * (hd - r*0.18))
        for i in range(14):
            z = 0.34 - (0.312 * i / 13.0)
            hw = body_half_w(z)
            hd = body_half_d(z)
            r = body_corner_r(z)
            x = -(hw - r * 0.42)
            y = side_y * (hd - r * 0.14)
            pts.append((x, y, z))
        # Bottom edge across X
        for i in range(1, 10):
            f = i / 10.0
            hw = body_half_w(0.012) * 0.94
            hd = body_half_d(0.012) * 0.94
            r = body_corner_r(0.012) * 0.94
            x = -(hw - r * 0.42) + 2.0 * (hw - r * 0.42) * f
            z = 0.008 + 0.004 * (1.0 - math.sin(f * math.pi))
            y = side_y * (hd - r * 0.14)
            pts.append((x, y, z))
        # Right seam going up
        for i in range(14):
            z = 0.028 + (0.312 * i / 13.0)
            hw = body_half_w(z)
            hd = body_half_d(z)
            r = body_corner_r(z)
            x = hw - r * 0.42
            y = side_y * (hd - r * 0.14)
            pts.append((x, y, z))
        add_tube_along_points(bm, pts, radius=0.0020, segs=6, closed=False)

    # Stitched hem along bottom edge of fold-over flap
    y_hem, z_hem, hw_hem = flap_centerline(1.0)
    hem_pts = []
    for ix in range(19):
        fx = (ix / 18.0) * 2.0 - 1.0
        x = fx * hw_hem
        wrap_front = math.pow(abs(fx), 3.6) * 0.018
        strap_pinch = 0.0032 * math.exp(-(fx * 7.5) ** 2)
        hem_pts.append((x, y_hem - 0.0025 + wrap_front + strap_pinch, z_hem + 0.0015))
    add_tube_along_points(bm, hem_pts, radius=0.0016, segs=6, closed=False)

    finish_mesh("BodyPiping", bm, mat_fabric_dark, smooth=True)


# ---------------------------------------------------------------------------
# 4. Large Front Gusseted Pocket + Rain Hood + Brand Patch
# ---------------------------------------------------------------------------
def build_front_pocket():
    bm = bmesh.new()
    pw, ph, pd = 0.236, 0.188, 0.024
    z0 = 0.024

    n_x, n_z = 20, 16
    front_grid = []
    back_grid = []
    for iz in range(n_z + 1):
        fz = iz / n_z
        z = z0 + ph * fz
        corner_taper = 1.0 - 0.04 * (1.0 - smoothstep(0.0, 0.15, fz))
        row_f = []
        row_b = []
        for ix in range(n_x + 1):
            fx = (ix / n_x) * 2.0 - 1.0
            x = fx * (pw * 0.5) * corner_taper
            y_body = body_front_y(x, z) + 0.004
            edge_x = smoothstep(0.80, 1.0, abs(fx))
            edge_z_bot = 1.0 - smoothstep(0.0, 0.14, fz)
            edge_z_top = smoothstep(0.88, 1.0, fz)
            depth = pd * (1.0 - 0.55 * edge_x * edge_x) * (1.0 - 0.45 * edge_z_bot * edge_z_bot) * (1.0 - 0.35 * edge_z_top * edge_z_top)
            depth += 0.0025 * (1.0 - fx * fx) * math.sin(fz * math.pi)
            y_front = body_front_y(0.0, z) - depth
            row_f.append(bm.verts.new((x, y_front, z)))
            row_b.append(bm.verts.new((x, y_body, z)))
        front_grid.append(row_f)
        back_grid.append(row_b)

    for iz in range(n_z):
        for ix in range(n_x):
            bm.faces.new((front_grid[iz][ix], front_grid[iz][ix + 1], front_grid[iz + 1][ix + 1], front_grid[iz + 1][ix]))
            bm.faces.new((back_grid[iz][ix], back_grid[iz + 1][ix], back_grid[iz + 1][ix + 1], back_grid[iz][ix + 1]))
    for ix in range(n_x):
        bm.faces.new((front_grid[0][ix], back_grid[0][ix], back_grid[0][ix + 1], front_grid[0][ix + 1]))
        bm.faces.new((front_grid[n_z][ix], front_grid[n_z][ix + 1], back_grid[n_z][ix + 1], back_grid[n_z][ix]))
    for iz in range(n_z):
        bm.faces.new((front_grid[iz][0], front_grid[iz + 1][0], back_grid[iz + 1][0], back_grid[iz][0]))
        bm.faces.new((front_grid[iz][n_x], back_grid[iz][n_x], back_grid[iz + 1][n_x], front_grid[iz + 1][n_x]))

    # Horizontal zipper rain hood / storm flap near top of front pocket
    hood_y_front = body_front_y(0.0, 0.182) - pd - 0.0025
    add_rounded_box_bm(
        bm,
        center=(0.0, hood_y_front + 0.004, 0.183),
        size=(pw * 0.99, 0.011, 0.022),
        bevel=0.003,
        segs=2,
        rot=(0.14, 0.0, 0.0),
    )
    finish_mesh("FrontPocket", bm, mat_fabric_red, smooth=True)

    # Woven Label Patch ("LIVING TRAVELING SHARE") at bottom-right of front pocket
    bm_lbl = bmesh.new()
    lw, lh, ld = 0.056, 0.036, 0.0020
    lx, lz = 0.068, 0.058
    ly = body_front_y(0.0, lz) - pd - 0.0018
    v0 = bm_lbl.verts.new((lx - lw * 0.5, ly - ld, lz - lh * 0.5))
    v1 = bm_lbl.verts.new((lx + lw * 0.5, ly - ld, lz - lh * 0.5))
    v2 = bm_lbl.verts.new((lx + lw * 0.5, ly - ld, lz + lh * 0.5))
    v3 = bm_lbl.verts.new((lx - lw * 0.5, ly - ld, lz + lh * 0.5))
    b0 = bm_lbl.verts.new((lx - lw * 0.5, ly + 0.001, lz - lh * 0.5))
    b1 = bm_lbl.verts.new((lx + lw * 0.5, ly + 0.001, lz - lh * 0.5))
    b2 = bm_lbl.verts.new((lx + lw * 0.5, ly + 0.001, lz + lh * 0.5))
    b3 = bm_lbl.verts.new((lx - lw * 0.5, ly + 0.001, lz + lh * 0.5))

    uv_layer = bm_lbl.loops.layers.uv.verify()
    f_front = bm_lbl.faces.new((v0, v1, v2, v3))
    f_front.loops[0][uv_layer].uv = (0.0, 0.0)
    f_front.loops[1][uv_layer].uv = (1.0, 0.0)
    f_front.loops[2][uv_layer].uv = (1.0, 1.0)
    f_front.loops[3][uv_layer].uv = (0.0, 1.0)
    for verts in [(b0, b3, b2, b1), (v0, v3, b3, b0), (v1, b1, b2, v2), (v3, v2, b2, b3), (v0, b0, b1, v1)]:
        fe = bm_lbl.faces.new(verts)
        for lp in fe.loops:
            lp[uv_layer].uv = (0.02, 0.02)
    finish_mesh("BrandPatch", bm_lbl, mat_patch_label, smooth=False)


# ---------------------------------------------------------------------------
# 5. Side Slip Pockets (Left & Right)
# ---------------------------------------------------------------------------
def build_side_pockets():
    bm = bmesh.new()
    for s in (-1.0, 1.0):
        nz = 10
        ny = 10
        outer = []
        inner = []
        for iz in range(nz + 1):
            fz = iz / nz
            z = 0.025 + 0.140 * fz
            hw = body_half_w(z)
            hd = body_half_d(z)
            out_bulge = 0.0055 * math.sin(fz * math.pi * 0.85) + 0.0015 * smoothstep(0.85, 1.0, fz)
            row_o = []
            row_i = []
            for iy in range(ny + 1):
                fy = (iy / ny) * 2.0 - 1.0
                y = fy * (hd * 0.68)
                x_wall = s * (hw - 0.004)
                x_out = s * (hw + out_bulge * (1.0 - 0.55 * fy * fy))
                row_o.append(bm.verts.new((x_out, y, z)))
                row_i.append(bm.verts.new((x_wall, y, z)))
            outer.append(row_o)
            inner.append(row_i)

        for iz in range(nz):
            for iy in range(ny):
                if s > 0:
                    bm.faces.new((outer[iz][iy], outer[iz][iy + 1], outer[iz + 1][iy + 1], outer[iz + 1][iy]))
                    bm.faces.new((inner[iz][iy], inner[iz + 1][iy], inner[iz + 1][iy + 1], inner[iz][iy + 1]))
                else:
                    bm.faces.new((outer[iz][iy], outer[iz + 1][iy], outer[iz + 1][iy + 1], outer[iz][iy + 1]))
                    bm.faces.new((inner[iz][iy], inner[iz][iy + 1], inner[iz + 1][iy + 1], inner[iz + 1][iy]))
        for iy in range(ny):
            if s > 0:
                bm.faces.new((outer[nz][iy], outer[nz][iy + 1], inner[nz][iy + 1], inner[nz][iy]))
                bm.faces.new((outer[0][iy], inner[0][iy], inner[0][iy + 1], outer[0][iy + 1]))
            else:
                bm.faces.new((outer[nz][iy], inner[nz][iy], inner[nz][iy + 1], outer[nz][iy + 1]))
                bm.faces.new((outer[0][iy], outer[0][iy + 1], inner[0][iy + 1], inner[0][iy]))
        for iz in range(nz):
            if s > 0:
                bm.faces.new((outer[iz][0], outer[iz + 1][0], inner[iz + 1][0], inner[iz][0]))
                bm.faces.new((outer[iz][ny], inner[iz][ny], inner[iz + 1][ny], outer[iz + 1][ny]))
            else:
                bm.faces.new((outer[iz][0], inner[iz][0], inner[iz + 1][0], outer[iz + 1][0]))
                bm.faces.new((outer[iz][ny], outer[iz + 1][ny], inner[iz + 1][ny], inner[iz][ny]))

    finish_mesh("SidePockets", bm, mat_fabric_red, smooth=True)


# ---------------------------------------------------------------------------
# 6. Dual Tote Carry Handles + Top Snap Cuff + Center Compression Strap
# ---------------------------------------------------------------------------
def build_straps_and_handles():
    bm = bmesh.new()

    # A. Front & Back U-arch tote handles meeting inside top snap cuff at z = 0.506
    for side_y_sign, y_offset in ((-1.0, -0.010), (1.0, 0.010)):
        pts = []
        widths = []
        x_anc = 0.064
        for i in range(6):
            z = 0.225 + (0.112 * i / 5.0)
            y_surf = (body_front_y(-x_anc, z) - 0.002) if side_y_sign < 0 else (body_back_y(-x_anc, z) + 0.002)
            pts.append((-x_anc, y_surf, z))
            widths.append(0.025)

        n_arch = 26
        for i in range(1, n_arch):
            t = i / n_arch
            ang = math.pi * (1.0 - t)
            # Slightly wider bow at flap clearance, then smooth arch to peak
            x = math.cos(ang) * (x_anc + 0.006 * math.sin(ang * 2.0) * math.copysign(1.0, math.cos(ang)))
            z_base = 0.337
            z = z_base + math.sin(ang) * (0.506 - z_base)
            y_start = (body_front_y(-x_anc, 0.36) - 0.010) if side_y_sign < 0 else (body_back_y(-x_anc, 0.36) + 0.006)
            arch_blend = math.sin(ang)
            y = y_start * (1.0 - arch_blend) + y_offset * arch_blend
            w = 0.025 - 0.009 * math.pow(arch_blend, 1.4)
            pts.append((x, y, z))
            widths.append(w)

        for i in range(6):
            z = 0.337 - (0.112 * i / 5.0)
            y_surf = (body_front_y(x_anc, z) - 0.002) if side_y_sign < 0 else (body_back_y(x_anc, z) + 0.002)
            pts.append((x_anc, y_surf, z))
            widths.append(0.025)

        sweep_ribbon(bm, pts, widths, thickness=0.0034)

    # B. Top handle wrap snap-button cuff
    add_rounded_box_bm(bm, center=(0.0, 0.0, 0.507), size=(0.028, 0.026, 0.016), bevel=0.0035, segs=3)

    # C. Center vertical compression strap hugging the exact FoldFlap crest curve
    strap_pts = []
    strap_norms = []
    for k in range(12):
        s = k / 11.0 * 0.65  # back attachment (s=0) over crest to buckle (s=0.65 -> z=0.39)
        y_f, z_f, _ = flap_centerline(s)
        y_p, z_p, _ = flap_centerline(max(0.0, s - 0.03))
        y_n, z_n, _ = flap_centerline(min(1.0, s + 0.03))
        n_yz = Vector((0.0, z_n - z_p, -(y_n - y_p))).normalized()
        strap_pts.append(Vector((0.0, y_f, z_f)) + n_yz * 0.0042)
        strap_norms.append(n_yz)
    sweep_ribbon(bm, strap_pts, 0.024, thickness=0.0034, face_normal_hint=strap_norms)

    # Lower strap tail emerging from buckle down through keeper loop to z = 0.252
    tail_pts = [
        (0.0, body_front_y(0.0, 0.372) - 0.011, 0.372),
        (0.0, body_front_y(0.0, 0.335) - 0.009, 0.335),
        (0.0, body_front_y(0.0, 0.300) - 0.004, 0.300),
        (0.0, body_front_y(0.0, 0.252) - 0.003, 0.252),
    ]
    sweep_ribbon(bm, tail_pts, 0.023, thickness=0.0032, face_normal_hint=Vector((0, -1, 0)))

    # Horizontal keeper loop stitched on front panel at z = 0.296
    add_rounded_box_bm(
        bm,
        center=(0.0, body_front_y(0.0, 0.296) - 0.0055, 0.296),
        size=(0.032, 0.008, 0.016),
        bevel=0.0018,
        segs=2,
    )

    # D. Back shoulder strap lower webbing tails & bottom corner anchor tabs
    for s in (-1.0, 1.0):
        low_pts = [
            (s * 0.088, body_back_y(s * 0.088, 0.132) + 0.007, 0.132),
            (s * 0.108, body_back_y(s * 0.108, 0.082) + 0.006, 0.082),
            (s * 0.126, body_back_y(s * 0.126, 0.034) + 0.004, 0.034),
        ]
        sweep_ribbon(bm, low_pts, 0.024, thickness=0.0032, face_normal_hint=Vector((0, 1, 0)))
        add_rounded_box_bm(
            bm,
            center=(s * 0.128, body_back_y(s * 0.128, 0.030) + 0.004, 0.030),
            size=(0.028, 0.007, 0.022),
            bevel=0.002,
            rot=(0.0, s * 0.32, 0.0),
        )

    finish_mesh("WebbingStraps", bm, mat_webbing_red, smooth=True)


# ---------------------------------------------------------------------------
# 7. Back Panel Quilted Cushion & Ergonomic Padded Shoulder Straps
# ---------------------------------------------------------------------------
def build_back_and_shoulder_straps():
    # Contoured quilted back lumbar cushion conforming to body_back_y(x, z) (zero intersection)
    bm_back = bmesh.new()
    for sx in (-0.064, 0.0, 0.064):
        pad_w, pad_h, pad_d = 0.048, 0.230, 0.0045
        z_bot = 0.065
        nx, nz = 4, 12
        front_g, back_g = [], []
        for iz in range(nz + 1):
            fz = iz / nz
            z = z_bot + pad_h * fz
            r_top_bot = 1.0 - 0.45 * math.pow(abs(fz * 2.0 - 1.0), 6.0)
            row_f, row_b = [], []
            for ix in range(nx + 1):
                fx = (ix / nx) * 2.0 - 1.0
                x = sx + fx * pad_w * 0.5
                y_in = body_back_y(x, z) - 0.002
                edge_x = 1.0 - 0.45 * math.pow(abs(fx), 4.0)
                y_out = body_back_y(x, z) + pad_d * edge_x * r_top_bot
                row_f.append(bm_back.verts.new((x, y_in, z)))
                row_b.append(bm_back.verts.new((x, y_out, z)))
            front_g.append(row_f)
            back_g.append(row_b)
        for iz in range(nz):
            for ix in range(nx):
                bm_back.faces.new((back_g[iz][ix], back_g[iz][ix + 1], back_g[iz + 1][ix + 1], back_g[iz + 1][ix]))
                bm_back.faces.new((front_g[iz][ix], front_g[iz + 1][ix], front_g[iz + 1][ix + 1], front_g[iz][ix + 1]))
        for ix in range(nx):
            bm_back.faces.new((back_g[0][ix], front_g[0][ix], front_g[0][ix + 1], back_g[0][ix + 1]))
            bm_back.faces.new((back_g[nz][ix], back_g[nz][ix + 1], front_g[nz][ix + 1], front_g[nz][ix]))
        for iz in range(nz):
            bm_back.faces.new((back_g[iz][0], back_g[iz + 1][0], front_g[iz + 1][0], front_g[iz][0]))
            bm_back.faces.new((back_g[iz][nx], front_g[iz][nx], front_g[iz + 1][nx], back_g[iz + 1][nx]))

    # Contoured upper yoke band tucked cleanly under the flap edge
    y_yoke = body_back_y(0.0, 0.366) + 0.0015
    add_rounded_box_bm(
        bm_back,
        center=(0.0, y_yoke, 0.366),
        size=(0.220, 0.004, 0.024),
        bevel=0.0018,
        segs=2,
    )
    finish_mesh("BackPaddingMesh", bm_back, mat_fabric_dark, smooth=True)

    # Two anatomically S-curved padded shoulder straps (flush against +Y back face)
    bm_ss = bmesh.new()
    for s in (-1.0, 1.0):
        pts = []
        widths = []
        norms = []
        n_ss = 16
        for i in range(n_ss + 1):
            t = i / n_ss
            z = 0.362 - t * 0.230  # 0.362 down to 0.132
            x = s * (0.044 + 0.050 * math.sin(t * math.pi * 0.70))
            y = body_back_y(x, z) + 0.006 + 0.0025 * math.sin(t * math.pi)
            w = 0.046 * (1.0 - 0.18 * smoothstep(0.75, 1.0, t))
            pts.append((x, y, z))
            widths.append(w)
            norms.append(Vector((s * 0.12, 1.0, 0.0)).normalized())
        sweep_ribbon(bm_ss, pts, widths, thickness=0.0095, face_normal_hint=norms)
    finish_mesh("ShoulderStraps", bm_ss, mat_fabric_red, smooth=True)


# ---------------------------------------------------------------------------
# 8. Black Plastic Buckles (Front Side-Release Buckle + Back Tri-Glides)
# ---------------------------------------------------------------------------
def build_buckles():
    bm = bmesh.new()
    # Front contoured side-release buckle at (0, y, 0.382)
    by = body_front_y(0.0, 0.382) - 0.013
    bz = 0.382
    add_rounded_box_bm(bm, center=(0.0, by, bz + 0.012), size=(0.032, 0.0095, 0.024), bevel=0.002, segs=2)
    add_rounded_box_bm(bm, center=(0.0, by, bz - 0.008), size=(0.028, 0.0085, 0.020), bevel=0.0018, segs=2)
    for s in (-1.0, 1.0):
        add_rounded_box_bm(bm, center=(s * 0.0165, by, bz - 0.002), size=(0.006, 0.0075, 0.014), bevel=0.0015, segs=2)
    add_rounded_box_bm(bm, center=(0.0, by, bz - 0.018), size=(0.030, 0.0075, 0.005), bevel=0.001, segs=2)

    # Dark center insert on front pocket zipper pull (matches photo)
    add_rounded_box_bm(
        bm,
        center=(-0.098, body_front_y(-0.098, 0.162) - 0.0305, 0.158),
        size=(0.0036, 0.0036, 0.011),
        bevel=0.0005,
    )

    # Two rear shoulder strap adjustment buckles (tri-glides)
    for s in (-1.0, 1.0):
        bx = s * 0.088
        bky = body_back_y(bx, 0.132) + 0.0075
        add_rounded_box_bm(bm, center=(bx, bky, 0.132), size=(0.032, 0.0075, 0.022), bevel=0.0015, segs=2)

    finish_mesh("PlasticBuckles", bm, mat_buckle_black, smooth=True)


# ---------------------------------------------------------------------------
# 9. Zipper Tracks & Silver Metallic Zipper Pulls
# ---------------------------------------------------------------------------
def build_zippers():
    bm_track = bmesh.new()
    add_rounded_box_bm(
        bm_track,
        center=(0.0, body_front_y(0.0, 0.174) - 0.023, 0.174),
        size=(0.228, 0.005, 0.006),
        bevel=0.001,
    )
    add_rounded_box_bm(
        bm_track,
        center=(0.134, body_front_y(0.134, 0.155) - 0.002, 0.155),
        size=(0.006, 0.006, 0.140),
        bevel=0.001,
    )
    add_rounded_box_bm(
        bm_track,
        center=(-0.105, body_back_y(-0.105, 0.185) + 0.0025, 0.185),
        size=(0.005, 0.005, 0.165),
        bevel=0.001,
    )
    finish_mesh("ZipperTracks", bm_track, mat_zipper_track, smooth=True)

    bm_pull = bmesh.new()
    pulls = [
        # 1. Peeking under left side of fold-over flap (visible in photo!)
        ((-0.146, body_front_y(-0.146, 0.324) - 0.009, 0.322), (0.0, 0.0, 0.0)),
        # 2. Front pocket left zipper pull under rain flap (visible in photo!)
        ((-0.098, body_front_y(-0.098, 0.164) - 0.029, 0.162), (0.0, 0.0, 0.0)),
        # 3. Right side-access zipper pull peeking on right edge (visible in photo!)
        ((0.164, -0.020, 0.182), (0.0, 0.25, 0.0)),
        # 4. Rear vertical zipper pull
        ((-0.106, body_back_y(-0.106, 0.238) + 0.005, 0.238), (0.0, 0.0, 0.0)),
    ]
    for (px, py, pz), rot in pulls:
        add_rounded_box_bm(bm_pull, center=(px, py, pz + 0.007), size=(0.0075, 0.0055, 0.0085), bevel=0.001, rot=rot)
        add_rounded_box_bm(bm_pull, center=(px, py, pz - 0.005), size=(0.0060, 0.0028, 0.016), bevel=0.0008, rot=rot)

    finish_mesh("ZipperPulls", bm_pull, mat_metal_silver, smooth=True)


# ---------------------------------------------------------------------------
# Build all parts & export GLB
# ---------------------------------------------------------------------------
build_main_body()
build_fold_flap()
build_piping()
build_front_pocket()
build_side_pockets()
build_straps_and_handles()
build_back_and_shoulder_straps()
build_buckles()
build_zippers()

bpy.context.view_layer.update()
xs, ys, zs = [], [], []
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        for corner in obj.bound_box:
            wc = obj.matrix_world @ Vector(corner)
            xs.append(wc.x)
            ys.append(wc.y)
            zs.append(wc.z)

dx, dy, dz = max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)
total_tris = sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')
print(f"Backpack bbox (m): X={dx:.4f} ({dx*100:.1f} cm), Y={dy:.4f} ({dy*100:.1f} cm), Z={dz:.4f} ({dz*100:.1f} cm)")
print(f"Mesh count: {len(bpy.context.scene.objects)}, approx polys: {total_tris}")

bpy.ops.export_scene.gltf(
    filepath=OUT_PATH,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
print(f"Exported {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)")
