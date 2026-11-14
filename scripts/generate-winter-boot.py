"""Generate a faithful 3D GLB of the red high-top spring-sole winter sneakers (Temu EU 46 / US 12)."""
import math
import os
import tempfile
import bpy
import bmesh
from mathutils import Euler, Matrix, Vector
from PIL import Image

OUT_PATH = "/home/dinatih/Projects/room-3d/public/items/winter-boot/WinterOutdoorBoot.glb"
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
TEX_DIR = tempfile.mkdtemp(prefix="winter_boot_tex_")


# ---------------------------------------------------------------------------
# Procedural Micro-Normal Textures (packed into GLB)
# ---------------------------------------------------------------------------
def build_pebbled_leather_normal():
    """Subtle pebbled PU leather grain normal map."""
    size = 128
    img = Image.new("RGB", (size, size), (128, 128, 255))
    px = img.load()
    for y in range(size):
        for x in range(size):
            a1 = x * 2.0 * math.pi / 8.0
            b1 = y * 2.0 * math.pi / 8.0
            a2 = (x + y * 0.5) * 2.0 * math.pi / 5.0
            b2 = (y - x * 0.4) * 2.0 * math.pi / 5.0
            dx = math.sin(a1) * math.cos(b1) * 14.0 + math.cos(a2) * 8.0
            dy = math.cos(a1) * math.sin(b1) * 14.0 + math.sin(b2) * 8.0
            px[x, y] = (
                max(0, min(255, int(128 + dx))),
                max(0, min(255, int(128 + dy))),
                250,
            )
    path = os.path.join(TEX_DIR, "pu_grain_nrm.png")
    img.save(path)
    b_img = bpy.data.images.load(path)
    b_img.colorspace_settings.name = 'Non-Color'
    b_img.pack()
    return b_img


def build_fabric_mesh_normal():
    """Woven breathable fabric/piping normal map."""
    size = 128
    img = Image.new("RGB", (size, size), (128, 128, 255))
    px = img.load()
    for y in range(size):
        for x in range(size):
            dx = math.sin(x * 2.0 * math.pi / 6.0) * 18.0
            dy = math.sin(y * 2.0 * math.pi / 6.0) * 18.0
            px[x, y] = (
                max(0, min(255, int(128 + dx))),
                max(0, min(255, int(128 + dy))),
                248,
            )
    path = os.path.join(TEX_DIR, "mesh_nrm.png")
    img.save(path)
    b_img = bpy.data.images.load(path)
    b_img.colorspace_settings.name = 'Non-Color'
    b_img.pack()
    return b_img


img_pu_nrm = build_pebbled_leather_normal()
img_mesh_nrm = build_fabric_mesh_normal()


# ---------------------------------------------------------------------------
# Materials (1 material per mesh object for mergeGlbByMaterial)
# ---------------------------------------------------------------------------
def make_mat(name, base_color, roughness=0.5, metallic=0.0, normal_img=None, normal_strength=0.18, uv_scale=28.0):
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


# Rich deep cardinal crimson matching the real Temu red colorway
mat_red_pu = make_mat(
    "BootRedPU", (0.21, 0.0010, 0.0024), roughness=0.44, metallic=0.02,
    normal_img=img_pu_nrm, normal_strength=0.16, uv_scale=34.0
)
mat_red_pvc = make_mat(
    "BootRedPVC", (0.28, 0.0010, 0.0022), roughness=0.14, metallic=0.04
)
mat_red_lining = make_mat(
    "BootRedLining", (0.16, 0.0008, 0.0018), roughness=0.86, metallic=0.0,
    normal_img=img_mesh_nrm, normal_strength=0.28, uv_scale=24.0
)
mat_black_rubber = make_mat(
    "BootBlackRubber", (0.012, 0.012, 0.014), roughness=0.78, metallic=0.02
)


# ---------------------------------------------------------------------------
# Parametric Right-Shoe Last & Sole Functions
# Blender coordinates: Z=up (0=ground), -Y=forward (toe), +Y=backward (heel)
# For Right Shoe: -X = lateral (outer), +X = medial (inner)
# ---------------------------------------------------------------------------
L_SHOE = 0.310  # EU 46 outer length (~31.0 cm for 29.2 cm foot)
Y_HEEL = +0.155
Y_TOE = -0.155
PAIR_HALF_X = 0.068  # pair width ~25.5 cm
S_JOIN = 0.45        # seamless bridge station between forefoot vamp and quarter/collar


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def smoothstep(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def s_to_y(s):
    """Map s in [0..1] (0=heel, 1=toe) to local Y."""
    return Y_HEEL - s * L_SHOE


def foot_bounds_x(s):
    """Return (x_lat, x_med) for Right shoe (-X lateral, +X medial) at s in [0, 1]."""
    cx = 0.004 * smoothstep(0.35, 0.95, s) - 0.003 * math.sin(clamp(s, 0, 1) * math.pi)
    if s < 0.18:
        u = s / 0.18
        w_base = 0.041 * math.pow(math.sin(u * math.pi * 0.5), 0.55)
        w_lat = max(0.006, w_base)
        w_med = max(0.006, w_base * 0.96)
    elif s < 0.44:
        u = (s - 0.18) / 0.26
        w_lat = 0.041 - 0.002 * math.sin(u * math.pi)
        w_med = 0.0394 - 0.0095 * math.sin(u * math.pi)
    elif s < 0.72:
        u = (s - 0.44) / 0.28
        t = smoothstep(0.0, 1.0, u)
        w_lat = 0.041 + 0.015 * t
        w_med = 0.0394 + 0.0125 * t
    else:
        u = (s - 0.72) / 0.28
        t = math.pow(max(0.0, 1.0 - math.pow(u, 1.65)), 0.58)
        w_lat = max(0.005, 0.056 * t)
        w_med = max(0.005, 0.0519 * t)
    return cx - w_lat, cx + w_med


def sole_deck_z(s):
    """Top of midsole footbed deck Z(s): ~4.7 cm at heel, sloping smoothly to ~2.4 cm at toe."""
    toe_rocker = 0.008 * smoothstep(0.84, 1.0, s)
    drop = 0.047 - 0.025 * smoothstep(0.10, 0.78, s)
    return drop + toe_rocker


def sole_underside_z(s):
    """Bottom of upper midsole plate Z(s), arching up cleanly at the midfoot."""
    arch = 0.017 * math.exp(-((s - 0.43) / 0.095) ** 2)
    base = 0.025 - 0.011 * smoothstep(0.25, 0.85, s)
    toe_rocker = 0.008 * smoothstep(0.84, 1.0, s)
    return base + arch + toe_rocker


def vamp_ridge_height(s):
    """Dorsal height above sole_deck_z(s) from toe tip (s=1.0 -> 0) back to instep join (s=S_JOIN)."""
    u = clamp((1.0 - s) / (1.0 - S_JOIN), 0.0, 1.0)
    # Convex curved toe profile rising smoothly to ~6.4 cm at s=S_JOIN
    return 0.064 * math.pow(u, 0.68)


def upper_section_point(s, phi):
    """
    Cross-section of forefoot vamp at s in [S_JOIN, 1.0] and angle phi in [-pi/2, +pi/2].
    At s -> 1.0, ridge smoothly drops to 0 so the toe nose closes cleanly onto the sole deck.
    """
    x_lat, x_med = foot_bounds_x(s)
    cx = 0.5 * (x_lat + x_med)
    hw = 0.5 * (x_med - x_lat)
    z0 = sole_deck_z(s)
    h_ridge = vamp_ridge_height(s)

    sin_p = math.sin(phi)
    cos_p = math.cos(phi)
    x = cx + hw * math.copysign(math.pow(abs(sin_p), 0.80), sin_p)
    z = z0 + h_ridge * math.pow(max(0.0, cos_p), 0.88)
    return Vector((x, s_to_y(s), z))


def collar_ring_xy(theta):
    """
    Ankle opening horizontal footprint for theta in [-pi, pi]:
    theta=0 is front tongue (-Y), pi/2 is medial (+X), +-pi is heel (+Y), -pi/2 is lateral (-X).
    """
    y_center = 0.072
    x_center = -0.001
    c = math.cos(theta)
    s = math.sin(theta)
    rx = 0.043 * (1.0 + 0.06 * max(0.0, c) - 0.22 * smoothstep(0.35, 1.0, max(0.0, -c)))
    ry = 0.072 + 0.006 * max(0.0, -c)
    x = x_center + rx * s
    y = y_center - ry * c
    return x, y


def collar_rim_z(theta):
    """
    Signature smooth U-cutout collar silhouette (C1 smooth, zero V-pinch):
    - Broad rounded sneaker tongue at front (theta ~ 0): z ~ 0.188 m
    - Wide smooth U-shaped lateral & medial ankle cutouts around |theta| ~ 0.56*pi: z ~ 0.112 m
    - Tall sculpted rear heel pull tab (|theta| ~ pi): z ~ 0.172 m
    """
    a = (theta + math.pi) % (2.0 * math.pi) - math.pi  # [-pi, pi]
    aa = abs(a)
    z_floor = 0.112

    u_front = clamp(aa / (0.48 * math.pi), 0.0, 1.0)
    front_lobe = math.pow(0.5 * (1.0 + math.cos(u_front * math.pi)), 0.55)

    u_heel = clamp((math.pi - aa) / (0.34 * math.pi), 0.0, 1.0)
    heel_lobe = math.pow(0.5 * (1.0 + math.cos(u_heel * math.pi)), 0.80)

    return z_floor + (0.188 - z_floor) * front_lobe + (0.172 - z_floor) * heel_lobe


def collar_bottom_point(theta):
    """
    Closed bottom boundary loop of the seamless ankle/quarter/heel shell:
    - Front half (theta in [-pi/2, +pi/2]): EXACTLY matches vamp cross-section at s = S_JOIN!
    - Back half (theta in [+pi/2, 3pi/2]): walks smoothly along sole deck perimeter from S_JOIN to heel s=0 and back!
    Returns (Vector, is_front_arch_bool)
    """
    a = (theta + math.pi) % (2.0 * math.pi) - math.pi  # [-pi, pi]
    if abs(a) <= math.pi * 0.5:
        # Front half: map a in [-pi/2, +pi/2] -> phi in [-pi/2, +pi/2]
        # Wait: theta=+pi/2 is medial (+X), phi=+pi/2 is medial (+X)! Exact match!
        p = upper_section_point(S_JOIN, a)
        # Tuck lateral/medial sole endpoints 2 mm into sole deck
        edge_tuck = 0.002 * math.pow(abs(math.sin(a)), 6.0)
        p.z -= edge_tuck
        return p, True
    else:
        # Back half: medial (a = +pi/2 -> s=S_JOIN) -> heel (|a|=pi -> s=0.0) -> lateral (a = -pi/2 -> s=S_JOIN)
        # Parameterize u_back in [0..1] where 0 is heel (|a|=pi) and 1 is S_JOIN (|a|=pi/2)
        u_back = (math.pi - abs(a)) / (math.pi * 0.5)
        s = S_JOIN * smoothstep(0.0, 1.0, u_back)
        xl, xm = foot_bounds_x(s)
        cx = 0.5 * (xl + xm)
        hw = 0.5 * (xm - xl)
        # Wrap seamlessly around heel curve at small s
        heel_wrap = math.sin(a)  # +1 at medial a=+pi/2, 0 at back a=+-pi, -1 at lateral a=-pi/2
        # At heel center (s -> 0), y should reach s_to_y(0), and x = cx
        x = cx + hw * math.copysign(math.pow(abs(heel_wrap), 0.72), heel_wrap)
        y = s_to_y(s)
        z = sole_deck_z(s) - 0.002
        return Vector((x, y, z)), False


# ---------------------------------------------------------------------------
# Mesh Helpers
# ---------------------------------------------------------------------------
def add_beveled_cylinder(bm, center, rx, ry, z_bot, z_top, n_rings=7, r_profile=None, segs=24):
    """Add a smooth solid/ribbed oval column from z_bot to z_top."""
    rings = []
    for iz in range(n_rings):
        fz = iz / (n_rings - 1)
        z = z_bot + (z_top - z_bot) * fz
        scale = r_profile(fz) if r_profile else 1.0
        ring = []
        for i in range(segs):
            a = 2.0 * math.pi * i / segs
            ring.append(bm.verts.new((center[0] + math.cos(a) * rx * scale, center[1] + math.sin(a) * ry * scale, z)))
        rings.append(ring)

    for iz in range(n_rings - 1):
        for i in range(segs):
            ni = (i + 1) % segs
            bm.faces.new((rings[iz][i], rings[iz][ni], rings[iz + 1][ni], rings[iz + 1][i]))

    c_bot = bm.verts.new((center[0], center[1], z_bot))
    c_top = bm.verts.new((center[0], center[1], z_top))
    for i in range(segs):
        ni = (i + 1) % segs
        bm.faces.new((c_bot, rings[0][ni], rings[0][i]))
        bm.faces.new((c_top, rings[-1][i], rings[-1][ni]))


def add_ribbed_pillar(bm, cx, cy, rx, ry, z_bot, z_top, num_ribs=3, segs=20):
    """Create a glossy shock-absorbing PVC spring column with horizontal flange ribs."""
    n_z = num_ribs * 4 + 1
    def profile(fz):
        waist = 1.0 - 0.12 * math.sin(fz * math.pi)
        rib = 0.16 * math.cos(fz * num_ribs * 2.0 * math.pi)
        return waist + rib
    add_beveled_cylinder(bm, (cx, cy), rx, ry, z_bot, z_top, n_rings=n_z, r_profile=profile, segs=segs)


def add_rounded_box_bm(bm, center, size, bevel=0.0015, segs=2, rot=(0, 0, 0)):
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


def sweep_strap(bm, points, normals, width, thickness, slant_end=0.0):
    """
    Sweep a flat beveled leather strap along points with explicit outward normals.
    If slant_end != 0, angles the final Velcro tip along the strap tangent while keeping full width.
    """
    n = len(points)
    rings = []
    hw = width * 0.5
    ht = thickness * 0.5
    for i in range(n):
        p = Vector(points[i])
        nrm = Vector(normals[i]).normalized()
        if i == 0:
            tan = (Vector(points[1]) - p).normalized()
        elif i == n - 1:
            tan = (p - Vector(points[n - 2])).normalized()
        else:
            tan = (Vector(points[i + 1]) - Vector(points[i - 1])).normalized()
        side = nrm.cross(tan).normalized()
        if side.length < 1e-4:
            side = Vector((1, 0, 0))
        n_ortho = tan.cross(side).normalized()

        prof = [
            (-hw, -ht * 0.6),
            (-hw * 0.85, -ht),
            (hw * 0.85, -ht),
            (hw, -ht * 0.6),
            (hw, ht * 0.6),
            (hw * 0.85, ht),
            (-hw * 0.85, ht),
            (-hw, ht * 0.6),
        ]
        end_slant = slant_end if (i == n - 1) else 0.0
        rings.append([
            bm.verts.new(p + side * px + n_ortho * py + tan * (end_slant * (px / hw) * 0.005))
            for px, py in prof
        ])

    m = len(rings[0])
    for i in range(n - 1):
        for j in range(m):
            nj = (j + 1) % m
            bm.faces.new((rings[i][j], rings[i][nj], rings[i + 1][nj], rings[i + 1][j]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])


def finalize_pair_mesh(name, right_bm, mat):
    """Duplicate right_bm mirrored across X for the Left shoe, translate pair to +/-PAIR_HALF_X, and export."""
    combined = bmesh.new()

    for shift_x, mirror in ((-PAIR_HALF_X, False), (PAIR_HALF_X, True)):
        vmap = {}
        for v in right_bm.verts:
            co = Vector((-v.co.x if mirror else v.co.x, v.co.y, v.co.z))
            co.x += shift_x
            vmap[v] = combined.verts.new(co)
        for f in right_bm.faces:
            verts = [vmap[v] for v in (reversed(f.verts) if mirror else f.verts)]
            combined.faces.new(verts)

    right_bm.free()
    bmesh.ops.recalc_face_normals(combined, faces=combined.faces)

    uv_layer = combined.loops.layers.uv.verify()
    for f in combined.faces:
        n = f.normal
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
        for l in f.loops:
            co = l.vert.co
            if az >= ax and az >= ay:
                l[uv_layer].uv = (co.x * 4.0, co.y * 4.0)
            elif ay >= ax:
                l[uv_layer].uv = (co.x * 4.0, co.z * 4.0)
            else:
                l[uv_layer].uv = (co.y * 4.0, co.z * 4.0)

    mesh = bpy.data.meshes.new(name)
    combined.to_mesh(mesh)
    combined.free()
    for p in mesh.polygons:
        p.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


# ---------------------------------------------------------------------------
# 1. Black Rubber Outsole Pads & Curved Front Toe Bumper
# ---------------------------------------------------------------------------
def build_black_outsole():
    bm = bmesh.new()

    # Rear heel horseshoe tread pad
    s_heel = 0.115
    x_l, x_m = foot_bounds_x(s_heel)
    add_beveled_cylinder(
        bm,
        center=(0.5 * (x_l + x_m), s_to_y(s_heel), 0.0),
        rx=0.5 * (x_m - x_l) * 1.04,
        ry=0.036,
        z_bot=0.000,
        z_top=0.0045,
        n_rings=3,
        r_profile=lambda fz: 1.0 - 0.04 * fz,
        segs=24,
    )

    # Mid-heel paired tread pads
    for side in (-1, 1):
        s_mid = 0.305
        xl, xm = foot_bounds_x(s_mid)
        cx = xl + 0.015 if side < 0 else xm - 0.014
        add_beveled_cylinder(bm, (cx, s_to_y(s_mid), 0.0), 0.016, 0.018, 0.000, 0.0045, n_rings=3, segs=16)

    # 4 Forefoot paired tread pads
    forefoot_s = [0.560, 0.670, 0.780, 0.895]
    for idx, sf in enumerate(forefoot_s):
        xl, xm = foot_bounds_x(sf)
        hw = 0.5 * (xm - xl)
        rx = min(0.019, hw * 0.48)
        ry = 0.0155 if idx < 3 else 0.014
        z_lift = 0.005 * smoothstep(0.84, 1.0, sf)
        for side in (-1, 1):
            cx = (xl + rx * 0.85) if side < 0 else (xm - rx * 0.85)
            add_beveled_cylinder(bm, (cx, s_to_y(sf), 0.0), rx, ry, z_lift, z_lift + 0.0042, n_rings=3, segs=16)

    # Signature curved black rubber toe bumper wrapping cleanly over the toe nose
    pts = []
    for k in range(11):
        u = k / 10.0
        ang = -math.pi * 0.42 + u * math.pi * 0.84
        x = 0.004 + math.sin(ang) * 0.025
        y = Y_TOE - 0.0055 + (1.0 - math.cos(ang)) * 0.016
        pts.append((x, y))

    n_p = len(pts)
    bot_ring, mid_ring, top_ring = [], [], []
    in_bot, in_top = [], []
    for k, (x, y) in enumerate(pts):
        center_taper = math.cos(((k / (n_p - 1)) - 0.5) * math.pi * 0.7)
        bot_ring.append(bm.verts.new((x, y, 0.008)))
        mid_ring.append(bm.verts.new((x, y - 0.0030 * center_taper, 0.022)))
        top_ring.append(bm.verts.new((x, y + 0.0035, 0.032 + 0.005 * center_taper)))
        in_bot.append(bm.verts.new((x, y + 0.012, 0.009)))
        in_top.append(bm.verts.new((x, y + 0.013, 0.028)))

    for i in range(n_p - 1):
        bm.faces.new((bot_ring[i], bot_ring[i + 1], mid_ring[i + 1], mid_ring[i]))
        bm.faces.new((mid_ring[i], mid_ring[i + 1], top_ring[i + 1], top_ring[i]))
        bm.faces.new((top_ring[i], top_ring[i + 1], in_top[i + 1], in_top[i]))
        bm.faces.new((in_top[i], in_top[i + 1], in_bot[i + 1], in_bot[i]))
        bm.faces.new((in_bot[i], in_bot[i + 1], bot_ring[i + 1], bot_ring[i]))
    bm.faces.new((bot_ring[0], mid_ring[0], top_ring[0], in_top[0], in_bot[0]))
    bm.faces.new((bot_ring[-1], in_bot[-1], in_top[-1], top_ring[-1], mid_ring[-1]))

    finalize_pair_mesh("BlackOutsole", bm, mat_black_rubber)


# ---------------------------------------------------------------------------
# 2. Glossy Red PVC Midsole Plate, Heel Ribs & Spring Shock Columns
# ---------------------------------------------------------------------------
def build_pvc_midsole_and_springs():
    bm = bmesh.new()

    n_s = 36
    rings = []
    for is_ in range(n_s + 1):
        s = is_ / n_s
        xl, xm = foot_bounds_x(s)
        cx = 0.5 * (xl + xm)
        hw = 0.5 * (xm - xl) + 0.0038
        y = s_to_y(s)
        if s < 0.06:
            y += 0.009 * (1.0 - s / 0.06)
        zt = sole_deck_z(s) + 0.0020
        zb = sole_underside_z(s)
        zm = 0.5 * (zt + zb)
        hh = max(0.004, 0.5 * (zt - zb))

        ring = []
        heel_rib = 1.0 + 0.06 * (1.0 - smoothstep(0.0, 0.45, s))
        pts_xz = [
            (0.0, -hh),
            (0.65, -hh * 0.96),
            (0.96, -hh * 0.68),
            (1.04 * heel_rib, -hh * 0.25),
            (0.95, 0.0),
            (1.03 * heel_rib, hh * 0.35),
            (0.94, hh * 0.85),
            (0.65, hh),
            (0.0, hh),
            (-0.65, hh),
            (-0.94, hh * 0.85),
            (-1.03 * heel_rib, hh * 0.35),
            (-0.95, 0.0),
            (-1.04 * heel_rib, -hh * 0.25),
            (-0.96, -hh * 0.68),
            (-0.65, -hh * 0.96),
        ]
        for fx, fz in pts_xz:
            ring.append(bm.verts.new((cx + fx * hw, y, zm + fz)))
        rings.append(ring)

    m = len(rings[0])
    for is_ in range(n_s):
        for j in range(m):
            nj = (j + 1) % m
            bm.faces.new((rings[is_][j], rings[is_][nj], rings[is_ + 1][nj], rings[is_ + 1][j]))

    c_h = bm.verts.new((0.0, s_to_y(0.0) + 0.010, 0.5 * (sole_deck_z(0.0) + sole_underside_z(0.0))))
    c_t = bm.verts.new((0.004, s_to_y(0.992), 0.5 * (sole_deck_z(1.0) + sole_underside_z(1.0))))
    for j in range(m):
        nj = (j + 1) % m
        bm.faces.new((c_h, rings[0][nj], rings[0][j]))
        bm.faces.new((c_t, rings[-1][j], rings[-1][nj]))

    # Rear heel wide 4-rib spring block
    s_heel = 0.115
    xl, xm = foot_bounds_x(s_heel)
    add_ribbed_pillar(
        bm,
        cx=0.5 * (xl + xm),
        cy=s_to_y(s_heel) + 0.003,
        rx=0.5 * (xm - xl) * 1.00,
        ry=0.036,
        z_bot=0.004,
        z_top=sole_underside_z(s_heel) + 0.004,
        num_ribs=4,
        segs=24,
    )

    # Mid-heel paired 3-rib shock columns
    s_mid = 0.305
    xl, xm = foot_bounds_x(s_mid)
    for side in (-1, 1):
        cx = xl + 0.015 if side < 0 else xm - 0.014
        add_ribbed_pillar(
            bm, cx, s_to_y(s_mid), 0.0155, 0.0175,
            z_bot=0.004, z_top=sole_underside_z(s_mid) + 0.004,
            num_ribs=3, segs=18,
        )

    # 4 Forefoot paired shock columns
    for idx, sf in enumerate([0.560, 0.670, 0.780, 0.895]):
        xl, xm = foot_bounds_x(sf)
        hw = 0.5 * (xm - xl)
        rx = min(0.0185, hw * 0.46)
        ry = 0.015 if idx < 3 else 0.013
        z_lift = 0.005 * smoothstep(0.84, 1.0, sf)
        n_ribs = 3 if idx < 2 else 2
        for side in (-1, 1):
            cx = (xl + rx * 0.85) if side < 0 else (xm - rx * 0.85)
            add_ribbed_pillar(
                bm, cx, s_to_y(sf), rx, ry,
                z_bot=z_lift + 0.0038,
                z_top=sole_underside_z(sf) + 0.004,
                num_ribs=n_ribs,
                segs=16,
            )

    finalize_pair_mesh("PvcMidsoleAndSprings", bm, mat_red_pvc)


# ---------------------------------------------------------------------------
# 3. Seamless High-Top Leatherette Upper, Straps & Center Vamp Seam
# ---------------------------------------------------------------------------
def build_upper_and_straps():
    bm = bmesh.new()

    # Shared angular resolution so vamp arch and ankle collar stitch vertex-to-vertex
    n_half = 24
    n_th = n_half * 2  # 48 total loop segments around collar

    # A. Sealed Forefoot Vamp (s = 1.0 toe tip back to s = S_JOIN instep join)
    # Close the sole underside along each arch too so the toe tip has zero openings.
    n_s_vamp = 22
    vamp_rings = []
    for is_ in range(n_s_vamp + 1):
        # s goes from 0.996 (just at sealed toe tip) down to S_JOIN (exact bridge edge)
        s = 0.996 - ((0.996 - S_JOIN) * is_ / n_s_vamp)
        ring = []
        for ip in range(n_half + 1):
            phi = -math.pi * 0.5 + math.pi * (ip / n_half)
            pt = upper_section_point(s, phi)
            if ip == 0 or ip == n_half:
                pt.z -= 0.002  # tuck sole edge 2 mm into midsole
            ring.append(bm.verts.new(pt))
        vamp_rings.append(ring)

    for is_ in range(n_s_vamp):
        for ip in range(n_half):
            bm.faces.new((
                vamp_rings[is_][ip],
                vamp_rings[is_][ip + 1],
                vamp_rings[is_ + 1][ip + 1],
                vamp_rings[is_ + 1][ip],
            ))

    # Close the very front toe nose seamlessly onto a sole-deck center vertex (ZERO hole!)
    toe_xl, toe_xm = foot_bounds_x(1.0)
    toe_seal = bm.verts.new((0.5 * (toe_xl + toe_xm), s_to_y(1.0) + 0.001, sole_deck_z(1.0) - 0.002))
    for ip in range(n_half):
        bm.faces.new((toe_seal, vamp_rings[0][ip + 1], vamp_rings[0][ip]))

    # B. Seamless Ankle Shaft, Side Quarters & Heel Counter sharing EXACT vertices at S_JOIN!
    # Loop ordering around theta in [-pi, pi]:
    # ith = 0..n_th-1 -> theta = -pi + 2*pi*(ith/n_th)
    # Notice:
    # - ith in [n_half//2 .. 3*n_half//2] (i.e. theta in [-pi/2 .. +pi/2]) corresponds to front instep!
    #   Specifically ith = n_half//2 + ip maps to vamp_rings[-1][ip] for ip = 0..n_half!
    n_h = 14
    collar_grid = []
    i_front_start = n_half // 2        # 12 -> theta = -pi/2 (lateral S_JOIN)
    i_front_end = 3 * n_half // 2      # 36 -> theta = +pi/2 (medial S_JOIN)

    for ih in range(n_h + 1):
        fh = ih / n_h
        row = []
        for ith in range(n_th):
            if ih == 0 and i_front_start <= ith <= i_front_end:
                # Reuse exact vertex from vamp_rings[-1] so mesh is topologically continuous!
                row.append(vamp_rings[-1][ith - i_front_start])
                continue

            theta = -math.pi + 2.0 * math.pi * (ith / n_th)
            p_bot, is_front = collar_bottom_point(theta)
            x_top, y_top = collar_ring_xy(theta)
            z_top = collar_rim_z(theta)
            p_top = Vector((x_top, y_top, z_top))

            if ih == 0:
                p = p_bot
            else:
                p = p_bot.lerp(p_top, fh)
                mid_bell = math.sin(fh * math.pi)
                c = math.cos(theta)
                if c < 0.0:
                    p.y -= 0.003 * mid_bell * (-c)
                else:
                    # Smooth convex front tongue arch without sharp creases
                    p.y -= 0.004 * mid_bell * (c * c)
                    p.z += 0.002 * mid_bell * (c * c)
            row.append(bm.verts.new(p))
        collar_grid.append(row)

    for ih in range(n_h):
        for ith in range(n_th):
            nth = (ith + 1) % n_th
            bm.faces.new((
                collar_grid[ih][ith],
                collar_grid[ih][nth],
                collar_grid[ih + 1][nth],
                collar_grid[ih + 1][ith],
            ))

    # C. Subtle Flat-Stitched Center Front Vamp Seam Spine
    seam_pts = []
    for k in range(14):
        s = S_JOIN + (0.988 - S_JOIN) * (k / 13.0)
        p = upper_section_point(s, 0.0)
        seam_pts.append((p.x, p.y, p.z + 0.0004))
    add_tube_along_points(bm, seam_pts, radius=0.0014, segs=6, closed=False)

    # D. Diagonal Instep Strap (lateral sole anchor -> across vamp -> medial instep groove)
    instep_pts, instep_norms = [], []
    n_is = 18
    for k in range(n_is + 1):
        u = k / n_is
        s = 0.65 - 0.17 * u
        phi = -math.pi * 0.49 + u * math.pi * 0.88
        p = upper_section_point(s, phi)
        p_dx = upper_section_point(s, phi + 0.05) - p
        p_ds = upper_section_point(min(0.98, s + 0.02), phi) - p
        nrm = p_dx.cross(p_ds).normalized()
        if nrm.dot(Vector((math.sin(phi), -0.35, math.cos(phi)))) < 0:
            nrm = -nrm
        instep_pts.append(p + nrm * 0.0016)
        instep_norms.append(nrm)
    sweep_strap(bm, instep_pts, instep_norms, width=0.024, thickness=0.0028)

    # E. Horizontal Ankle Velcro Strap: starts anchored inside rear heel keeper (theta=pi),
    # wraps around medial side -> smoothly across front tongue -> sweeps BACK across lateral
    # U-cutout and finishes just in front of the heel tab as an angled Velcro flap.
    strap_pts, strap_norms = [], []
    n_st = 38
    theta_start = math.pi * 1.00
    theta_end = -math.pi * 0.78
    for k in range(n_st + 1):
        u = k / n_st
        theta = theta_start + (theta_end - theta_start) * u
        xt, yt = collar_ring_xy(theta)
        nrm = Vector((xt + 0.001, yt - 0.072, 0.0)).normalized()
        # Slightly lower across the front tongue (~4 deg forward pitch like real shoe)
        z_local = 0.150 - 0.005 * math.cos(theta)
        # Overlap lift over final 20% across the lateral U-cutout + flap
        overlap_lift = 0.0032 * smoothstep(0.75, 0.96, u)
        p = Vector((xt, yt, z_local)) + nrm * (0.0024 + overlap_lift)
        strap_pts.append(p)
        strap_norms.append(nrm)
    sweep_strap(bm, strap_pts, strap_norms, width=0.026, thickness=0.0032, slant_end=1.0)

    # Rear vertical strap keeper loop centered on heel back sitting outside the strap
    xh_b, yh_b = collar_ring_xy(math.pi)
    add_rounded_box_bm(bm, center=(xh_b, yh_b + 0.0055, 0.155), size=(0.015, 0.009, 0.036), bevel=0.0018)

    finalize_pair_mesh("LeatherUpperAndStraps", bm, mat_red_pu)


# ---------------------------------------------------------------------------
# 4. Fabric Collar Binding Piping & Inner Breathable Lining + Insole
# ---------------------------------------------------------------------------
def build_fabric_lining_and_piping():
    bm = bmesh.new()
    n_th = 48

    # A. Thick rolled ribbed fabric collar piping along the entire collar rim & U-cutouts
    rim_pts = []
    for ith in range(n_th):
        theta = -math.pi + 2.0 * math.pi * (ith / n_th)
        xt, yt = collar_ring_xy(theta)
        zt = collar_rim_z(theta)
        rim_pts.append((xt, yt, zt))
    add_tube_along_points(bm, rim_pts, radius=0.0044, segs=8, closed=True)

    # B. Seamless inner breathable fabric lining (cleanly inset inside the collar cavity)
    n_h = 10
    inner_grid = []
    for ih in range(n_h + 1):
        fh = ih / n_h
        row = []
        for ith in range(n_th):
            theta = -math.pi + 2.0 * math.pi * (ith / n_th)
            x_top, y_top = collar_ring_xy(theta)
            nrm = Vector((x_top + 0.001, y_top - 0.072, 0.0)).normalized()
            p_top = Vector((x_top, y_top, collar_rim_z(theta))) - nrm * 0.0042

            p_foot = Vector((
                0.000 + (x_top - 0.000) * 0.56,
                0.076 + (y_top - 0.072) * 0.52,
                sole_deck_z(0.28) + 0.004,
            ))
            p_in = p_foot.lerp(p_top, fh)
            # Ensure midpoint bows safely inward away from outer leather shell
            p_in -= nrm * (0.0030 * math.sin(fh * math.pi))
            row.append(bm.verts.new(p_in))
        inner_grid.append(row)

    # Normals face INWARD into ankle cavity
    for ih in range(n_h):
        for ith in range(n_th):
            nth = (ith + 1) % n_th
            bm.faces.new((
                inner_grid[ih][ith],
                inner_grid[ih + 1][ith],
                inner_grid[ih + 1][nth],
                inner_grid[ih][nth],
            ))

    # C. Cushioned red insole footbed floor inside the boot cavity
    insole_hub = bm.verts.new((0.0, 0.064, sole_deck_z(0.28) + 0.003))
    for ith in range(n_th):
        nth = (ith + 1) % n_th
        bm.faces.new((insole_hub, inner_grid[0][ith], inner_grid[0][nth]))

    finalize_pair_mesh("FabricCollarAndLining", bm, mat_red_lining)


# ---------------------------------------------------------------------------
# Build all parts & export GLB
# ---------------------------------------------------------------------------
build_black_outsole()
build_pvc_midsole_and_springs()
build_upper_and_straps()
build_fabric_lining_and_piping()

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
print(f"WinterOutdoorBoot pair bbox (m): X={dx:.4f} ({dx*100:.1f} cm), Y={dy:.4f} ({dy*100:.1f} cm), Z={dz:.4f} ({dz*100:.1f} cm)")
print(f"Mesh count: {len(bpy.context.scene.objects)}, approx polys: {total_tris}")

bpy.ops.export_scene.gltf(
    filepath=OUT_PATH,
    export_format='GLB',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)
print(f"Exported {OUT_PATH} ({os.path.getsize(OUT_PATH)} bytes)")
