"""Swimwear & bodysuit generators for Lara:
- One-piece swimsuit / bodysuit (lara_swimsuit_onepiece.glb)
- One-piece shorty / light diving wetsuit (lara_swimsuit_shorty.glb)
- Regenerated 2-piece bikini top (lara_bikini_top_red.glb)
- 2-piece bikini bottoms: slip, shorty, tanga, string
"""

import math
import bpy
import bmesh
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

from .geometry import (
    add_tucked_edge,
    bridge_convex_radii,
    ensure_3d_surface_clearance,
    ensure_z_plane_clearance,
    radial_surface_radius,
    slice_centroid_z,
    smooth_ring_radii,
)
from .rigging import bind_and_transfer_weights, export_garment_glb


def _torso_uv(co: Vector) -> tuple[float, float]:
    ang = math.atan2(co.y, co.x)
    return ((ang / (2.0 * math.pi) + 0.5) * 1.8, co.z * 2.2)


def _create_straps(
    bm: bmesh.types.BMesh,
    bvh_torso: BVHTree,
    verts_torso,
    x_front: float,
    x_back: float,
    z_front: float,
    z_back: float,
    half_width: float,
    clearance: float = 0.0042,
    thickness: float = 0.0028,
    n_steps: int = 20,
    n_width: int = 4,
):
    strap_faces = []
    for side in (1, -1):
        rows_outer = []
        rows_inner = []
        for i in range(n_steps):
            t = i / (n_steps - 1)
            x_c = side * (x_front * (1.0 - t) + x_back * t)
            if t <= 0.5:
                u = t / 0.5
                z_c = z_front + (1.468 - z_front) * math.sin(u * math.pi * 0.5)
                y_dir = -1.0 * math.cos(u * math.pi * 0.5)
            else:
                u = (t - 0.5) / 0.5
                z_c = z_back + (1.468 - z_back) * math.cos(u * math.pi * 0.5)
                y_dir = 1.0 * math.sin(u * math.pi * 0.5)

            z_dir = 1.0 if (0.35 < t < 0.65) else 0.0
            c_ref = slice_centroid_z(verts_torso, min(z_c, 1.46), tol=0.03, fallback=Vector((0.002, -0.005, z_c)))

            row_o = []
            row_i = []
            for wi in range(n_width):
                w_off = ((wi / (n_width - 1)) - 0.5) * 2.0 * half_width
                x = x_c + w_off
                if 0.30 <= t <= 0.70:
                    probe = Vector((x, (t - 0.5) * 0.06, 1.54))
                    hit, _, _, _ = bvh_torso.ray_cast(probe, Vector((0.0, 0.0, -1.0)), 0.16)
                    if hit is not None:
                        p_o = hit + Vector((0.0, (t - 0.5) * 0.01, clearance))
                    else:
                        p_o = Vector((x, (t - 0.5) * 0.05, 1.468 + clearance))
                else:
                    d_ray = Vector((0.0, y_dir, z_dir)).normalized()
                    origin = Vector((x, c_ref.y, z_c))
                    hit, _, _, _ = bvh_torso.ray_cast(origin + d_ray * 0.22, -d_ray, 0.25)
                    if hit is not None:
                        p_o = hit + d_ray * clearance
                    else:
                        loc, _, _, _ = bvh_torso.find_nearest(Vector((x, y_dir * 0.08, z_c)))
                        if loc is not None:
                            out_n = (loc - Vector((c_ref.x, c_ref.y, z_c))).normalized()
                            p_o = loc + out_n * clearance
                        else:
                            p_o = Vector((x, y_dir * 0.08, z_c))

                p_o = ensure_3d_surface_clearance(p_o, bvh_torso, clearance * 0.9, max_dist=0.03)
                in_n = (Vector((c_ref.x, c_ref.y, min(p_o.z - 0.03, 1.42))) - p_o).normalized()
                p_i = p_o + in_n * thickness
                row_o.append(bm.verts.new(p_o))
                row_i.append(bm.verts.new(p_i))
            rows_outer.append(row_o)
            rows_inner.append(row_i)

        for i in range(n_steps - 1):
            for wi in range(n_width - 1):
                f_o = bm.faces.new((rows_outer[i][wi], rows_outer[i][wi + 1], rows_outer[i + 1][wi + 1], rows_outer[i + 1][wi]))
                f_i = bm.faces.new((rows_inner[i][wi], rows_inner[i + 1][wi], rows_inner[i + 1][wi + 1], rows_inner[i][wi + 1]))
                strap_faces.extend([f_o, f_i])
            strap_faces.append(bm.faces.new((rows_outer[i][0], rows_outer[i + 1][0], rows_inner[i + 1][0], rows_inner[i][0])))
            strap_faces.append(bm.faces.new((rows_outer[i][-1], rows_inner[i][-1], rows_inner[i + 1][-1], rows_outer[i + 1][-1])))
        for wi in range(n_width - 1):
            strap_faces.append(bm.faces.new((rows_outer[0][wi], rows_inner[0][wi], rows_inner[0][wi + 1], rows_outer[0][wi + 1])))
            strap_faces.append(bm.faces.new((rows_outer[-1][wi], rows_outer[-1][wi + 1], rows_inner[-1][wi + 1], rows_inner[-1][wi])))

    bmesh.ops.recalc_face_normals(bm, faces=strap_faces)
    return strap_faces


def _sagittal_crotch_point(x: float, front_or_back: float, t_arc: float, bvh_pelvis: BVHTree, clr: float = 0.0044) -> Vector:
    """Trace a clean midline sagittal pubic/perineal/gluteal point and shift symmetrically in X."""
    origin = Vector((0.0022, -0.004, 0.865))
    phi = max(0.0, min(1.0, t_arc)) * (math.pi * 0.5)
    d = Vector((0.0, front_or_back * math.sin(phi), -math.cos(phi))).normalized()
    hit, _, _, _ = bvh_pelvis.ray_cast(origin + d * 0.16, -d, 0.22)
    if hit is None:
        hit, _, _, _ = bvh_pelvis.ray_cast(origin, d, 0.22)
    base = (hit + d * clr) if hit is not None else (origin + d * 0.085)
    return Vector((x, base.y, base.z + 0.008 * abs(x - 0.0022)))


# ---------------------------------------------------------------------------
# 1. One-Piece Swimsuit / Bodysuit (lara_swimsuit_onepiece.glb)
# ---------------------------------------------------------------------------
def build_onepiece_swimsuit(name: str, bvhs, mat_swimwear):
    bvh_pelvis = bvhs["bvh_pelvis"]
    verts_pelvis = bvhs["verts_pelvis"]
    bvh_torso = bvhs["bvh_torso"]
    verts_torso = bvhs["verts_torso"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    # 1. Upper & hip rings cleanly wrapping Z = [0.915, z_top] -> zero inner-thigh gap artifacts
    n_theta = 52
    n_rows = 22
    z_hip_base = 0.915

    grid = []
    for ri in range(n_rows):
        tv = ri / (n_rows - 1)
        ring_verts = []
        for j in range(n_theta):
            th = -0.5 * math.pi + (j / n_theta) * 2.0 * math.pi
            cos_th = math.cos(th)
            sin_th = math.sin(th)

            # High-cut French-leg hip arch (z=0.920 front/back -> z=0.975 high outer hip)
            z_bot = 0.920 + 0.055 * (abs(cos_th) ** 1.3)
            front_strap_peak = 0.045 * max(0.0, -sin_th) * (math.sin(abs(cos_th) * math.pi) ** 1.4)
            front_dip = 0.042 * (max(0.0, -sin_th) ** 2.2) * (1.0 - abs(cos_th) ** 0.8)
            back_dip = 0.125 * (max(0.0, sin_th) ** 1.25)
            side_dip = 0.045 * (abs(cos_th) ** 2.0)
            z_top = 1.362 + front_strap_peak - front_dip - back_dip - side_dip

            z = z_bot + (z_top - z_bot) * tv
            bvh_use = bvh_pelvis if z < 1.08 else bvh_torso
            verts_use = verts_pelvis if z < 1.08 else verts_torso
            c = slice_centroid_z(verts_use, z, tol=0.028, fallback=Vector((0.0022, -0.006, z)))
            d = Vector((cos_th, sin_th, 0.0))
            r = radial_surface_radius(bvh_use, c, d, max_r=0.24)
            p = ensure_z_plane_clearance(c + d * (r + 0.0046), Vector((c.x, c.y)), bvh_use, 0.0044, max_r=0.24)
            ring_verts.append(bm.verts.new(p))
        grid.append(ring_verts)

    for ri in range(n_rows - 1):
        for j in range(n_theta):
            jn = (j + 1) % n_theta
            bm.faces.new((grid[ri][j], grid[ri][jn], grid[ri + 1][jn], grid[ri + 1][j]))

    # 2. Clean French-cut front & back brief panels (j = -5..+5) staying strictly on front/back pelvis skin
    n_v = 10
    panel_top_verts = {
        False: [grid[0][(j - 5) % n_theta] for j in range(11)],
        True: [grid[0][(n_theta // 2 + (5 - j)) % n_theta] for j in range(11)],
    }
    n_u_p = 11
    bot_rows = {}
    for is_back in (False, True):
        fb_sign = 1.0 if is_back else -1.0
        th_center = 0.5 * math.pi if is_back else -0.5 * math.pi
        p_grid = []
        top_row = panel_top_verts[is_back]
        col_top_angles = []
        for v_top in top_row:
            c_top = slice_centroid_z(verts_pelvis, v_top.co.z, tol=0.03, fallback=Vector((0.0022, 0.0, v_top.co.z)))
            th_t = math.atan2(v_top.co.y - c_top.y, v_top.co.x - c_top.x)
            while th_t - th_center > math.pi:
                th_t -= 2.0 * math.pi
            while th_t - th_center < -math.pi:
                th_t += 2.0 * math.pi
            col_top_angles.append(th_t)

        for iv in range(n_v):
            tv = iv / (n_v - 1)  # 0 = crotch midline, 1 = top_row on grid[0]
            if iv == n_v - 1:
                p_grid.append(top_row)
                continue
            row = []
            for iu in range(n_u_p):
                tu = (iu / (n_u_p - 1)) * 2.0 - 1.0
                top_co = top_row[iu].co
                z_col = 0.778 + (top_co.z - 0.778) * tv
                c = slice_centroid_z(verts_pelvis, max(0.84, z_col), tol=0.03, fallback=Vector((0.0022, 0.0, z_col)))
                # Narrow fan at crotch smoothly widening onto top_row angle above z=0.89
                ang_scale = 0.16 + 0.84 * (tv ** 1.35)
                th = th_center + (col_top_angles[iu] - th_center) * ang_scale
                d = Vector((math.cos(th), math.sin(th), 0.0))
                r = radial_surface_radius(bvh_pelvis, c, d, max_r=0.20)
                p_surf = c + d * (min(r, 0.155) + 0.0046)
                p_surf.z = z_col
                p_cr = _sagittal_crotch_point(0.0022 + tu * 0.015, fb_sign, min(1.0, tv / 0.42) * 0.85, bvh_pelvis, clr=0.0046)
                if tv < 0.48:
                    blend = 1.0 if tv <= 0.22 else max(0.0, 1.0 - (tv - 0.22) / 0.26)
                    p = p_surf.lerp(p_cr, blend)
                else:
                    p = p_surf.lerp(Vector((top_co.x, top_co.y, z_col)), max(0.0, (tv - 0.65) / 0.35) * 0.8)
                row.append(bm.verts.new(p))
            p_grid.append(row)

        for iv in range(n_v - 1):
            for iu in range(n_u_p - 1):
                if not is_back:
                    bm.faces.new((p_grid[iv][iu], p_grid[iv][iu + 1], p_grid[iv + 1][iu + 1], p_grid[iv + 1][iu]))
                else:
                    bm.faces.new((p_grid[iv][iu], p_grid[iv + 1][iu], p_grid[iv + 1][iu + 1], p_grid[iv][iu + 1]))
        bot_rows[is_back] = p_grid[0]

    # Stitch front & back bottom crotch edges cleanly aligned (-X -> +X on both)
    for iu in range(n_u_p - 1):
        bm.faces.new((bot_rows[False][iu], bot_rows[True][iu], bot_rows[True][iu + 1], bot_rows[False][iu + 1]))

    # Tucked top neckline edge
    c_top = slice_centroid_z(verts_torso, 1.34, tol=0.03, fallback=Vector((0.0022, -0.010, 1.34)))
    add_tucked_edge(bm, grid[-1], c_top, 0.0032, Vector((0.0, 0.0, -0.005)))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    # Shoulder straps connecting seamlessly from cup top (z=1.355) to back neckline (z=1.280)
    _create_straps(
        bm,
        bvh_torso,
        verts_torso,
        x_front=0.070,
        x_back=0.068,
        z_front=1.352,
        z_back=1.275,
        half_width=0.013,
        clearance=0.0042,
        thickness=0.0028,
    )

    for f in bm.faces:
        f.material_index = 0
        for loop in f.loops:
            loop[uv_layer].uv = _torso_uv(loop.vert.co)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_swimwear)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        z = v.co.z
        if 1.08 <= z < 1.44:
            c_t = slice_centroid_z(verts_torso, z, tol=0.03, fallback=Vector((0.0022, -0.01, z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_t.x, c_t.y)), bvh_torso, 0.0038, max_r=0.24)
            v.co = ensure_3d_surface_clearance(v.co, bvh_torso, 0.0038, max_dist=0.025)
        elif 0.92 <= z < 1.08:
            c_p = slice_centroid_z(verts_pelvis, z, tol=0.03, fallback=Vector((0.0022, 0.0, z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_p.x, c_p.y)), bvh_pelvis, 0.0038, max_r=0.24)
            v.co = ensure_3d_surface_clearance(v.co, bvh_pelvis, 0.0038, max_dist=0.025)
        elif 0.80 <= z < 0.92:
            v.co = ensure_3d_surface_clearance(v.co, bvh_pelvis, 0.0040, max_dist=0.025)

    return obj


# ---------------------------------------------------------------------------
# 2. One-Piece Shorty / Light Wetsuit (lara_swimsuit_shorty.glb)
# ---------------------------------------------------------------------------
def build_shorty_swimsuit(name: str, bvhs, mat_wetsuit, mat_zip_rail, mat_zip_metal):
    bvh_left_leg = bvhs["bvh_left_leg"]
    verts_left_leg = bvhs["verts_left_leg"]
    bvh_right_leg = bvhs["bvh_right_leg"]
    verts_right_leg = bvhs["verts_right_leg"]
    bvh_pelvis = bvhs["bvh_pelvis"]
    verts_pelvis = bvhs["verts_pelvis"]
    bvh_torso = bvhs["bvh_torso"]
    verts_torso = bvhs["verts_torso"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    n_leg = 28
    z_leg_bot = 0.615
    z_crotch = 0.778
    leg_zs = [z_leg_bot + (z_crotch - z_leg_bot) * (i / 10.0) for i in range(11)]

    leg_rings = {1: [], -1: []}
    leg_data = {
        1: (bvh_left_leg, verts_left_leg, Vector((0.072, 0.0, 0.68))),
        -1: (bvh_right_leg, verts_right_leg, Vector((-0.072, 0.0, 0.68))),
    }
    for side in (1, -1):
        bvh_l, verts_l, fb = leg_data[side]
        for z in leg_zs:
            c = slice_centroid_z(verts_l, z, tol=0.025, fallback=fb)
            radii = []
            dirs = []
            for k in range(n_leg):
                ang = (k / n_leg) * 2.0 * math.pi
                d = Vector((-side * math.cos(ang), math.sin(ang), 0.0))
                radii.append(radial_surface_radius(bvh_l, c, d, max_r=0.14))
                dirs.append(d)
            radii = bridge_convex_radii(radii, max_dip=0.0014, passes=3)
            radii = smooth_ring_radii(radii, passes=1)
            rv = []
            for k in range(n_leg):
                p = c + dirs[k] * (radii[k] + 0.0046)
                if side == 1 and p.x < 0.0025:
                    p.x = 0.0025
                elif side == -1 and p.x > 0.0018:
                    p.x = 0.0018
                rv.append(bm.verts.new(p))
            leg_rings[side].append(rv)

    for side in (1, -1):
        rings_s = leg_rings[side]
        for zi in range(len(rings_s) - 1):
            r0 = rings_s[zi]
            r1 = rings_s[zi + 1]
            for k in range(n_leg):
                kn = (k + 1) % n_leg
                if side == -1:
                    bm.faces.new((r0[k], r0[kn], r1[kn], r1[k]))
                else:
                    bm.faces.new((r0[k], r1[k], r1[kn], r0[kn]))
        _, verts_l, fb = leg_data[side]
        c_bot = slice_centroid_z(verts_l, z_leg_bot, tol=0.025, fallback=fb)
        add_tucked_edge(bm, leg_rings[side][0], c_bot, 0.0035, Vector((0.0, 0.0, 0.006)))

    l_top = leg_rings[1][-1]
    r_top = leg_rings[-1][-1]
    v_crotch_mid = bm.verts.new(_sagittal_crotch_point(0.0022, 0.0, 0.0, bvh_pelvis, clr=0.0045))
    v_crotch_front = bm.verts.new(_sagittal_crotch_point(0.0022, -1.0, 0.32, bvh_pelvis, clr=0.0048))
    v_crotch_back = bm.verts.new(_sagittal_crotch_point(0.0022, 1.0, 0.36, bvh_pelvis, clr=0.0048))

    bm.faces.new((l_top[0], v_crotch_mid, v_crotch_front, l_top[n_leg - 1]))
    bm.faces.new((r_top[0], r_top[n_leg - 1], v_crotch_front, v_crotch_mid))
    bm.faces.new((l_top[0], l_top[1], v_crotch_back, v_crotch_mid))
    bm.faces.new((r_top[0], v_crotch_mid, v_crotch_back, r_top[1]))

    pelvis_loop_0 = (
        [v_crotch_front]
        + [l_top[n_leg - 1 - i] for i in range(n_leg - 1)]
        + [v_crotch_back]
        + [r_top[1 + i] for i in range(n_leg - 1)]
    )
    n_circ = len(pelvis_loop_0)

    z_collar = 1.466
    upper_zs = [z_crotch + (z_collar - z_crotch) * (i / 30.0) for i in range(1, 31)]
    rings = [pelvis_loop_0]
    centers = [Vector((0.0022, 0.0, z_crotch))]
    for zi, z in enumerate(upper_zs):
        bvh_u = bvh_pelvis if z < 1.075 else bvh_torso
        verts_u = verts_pelvis if z < 1.075 else verts_torso
        c = slice_centroid_z(verts_u, z, tol=0.028, fallback=Vector((0.0022, -0.006, z)))
        centers.append(c)

        radii = []
        dirs = []
        thetas = []
        for pi in range(n_circ):
            theta = -0.5 * math.pi + (pi / n_circ) * 2.0 * math.pi
            d = Vector((math.cos(theta), math.sin(theta), 0.0))
            radii.append(radial_surface_radius(bvh_u, c, d, max_r=0.24))
            dirs.append(d)
            thetas.append(theta)
        radii = bridge_convex_radii(radii, max_dip=0.0014, passes=6)
        radii = smooth_ring_radii(radii, passes=2)

        rv = []
        for pi in range(n_circ):
            th = thetas[pi]
            r_eff = radii[pi]
            if z >= 1.425:
                t_up = min(1.0, max(0.0, (z - 1.425) / max(1e-5, z_collar - 1.425)))
                max_lat = 0.114 - 0.050 * (t_up ** 0.75)
                lat_w = abs(math.cos(th))
                if lat_w > 0.25 and r_eff * lat_w > max_lat:
                    r_eff = max_lat / lat_w
            clr = 0.0048
            p = c + dirs[pi] * (r_eff + clr)
            if zi < 2:
                blend = 0.45 if zi == 0 else 0.80
                p = rings[-1][pi].co.lerp(p, blend)
            if 0.805 <= z < 1.425:
                p = ensure_z_plane_clearance(p, Vector((c.x, c.y)), bvh_u, 0.0046, max_r=0.24)
            rv.append(bm.verts.new(p))
        rings.append(rv)

    n_rings = len(rings)
    all_zs = [z_crotch] + upper_zs
    zi_arm_bot = min(range(n_rings), key=lambda i: abs(all_zs[i] - 1.300))
    zi_arm_top = min(n_rings - 2, min(range(n_rings), key=lambda i: abs(all_zs[i] - 1.458)))
    j_l_mid = n_circ // 4
    j_r_mid = (3 * n_circ) // 4
    arm_windows = {
        1: (zi_arm_bot, zi_arm_top, j_l_mid - 4, j_l_mid + 4),
        -1: (zi_arm_bot, zi_arm_top, j_r_mid - 4, j_r_mid + 4),
    }

    def _in_armhole(zi, j):
        for z0, z1, j0, j1 in arm_windows.values():
            if z0 <= zi < z1 and j0 <= j < j1:
                return True
        return False

    for zi in range(n_rings - 1):
        for pi in range(n_circ):
            if _in_armhole(zi, pi):
                continue
            pn = (pi + 1) % n_circ
            bm.faces.new((rings[zi][pi], rings[zi][pn], rings[zi + 1][pn], rings[zi + 1][pi]))

    for side, (z0, z1, j0, j1) in arm_windows.items():
        hole_verts = []
        for j in range(j0, j1):
            hole_verts.append(rings[z0][j])
        for zi in range(z0, z1):
            hole_verts.append(rings[zi][j1])
        for j in range(j1, j0, -1):
            hole_verts.append(rings[z1][j])
        for zi in range(z1, z0, -1):
            hole_verts.append(rings[zi][j0])
        c_hole = sum((v.co for v in hole_verts), Vector()) / len(hole_verts)
        rim = []
        for v in hole_verts:
            in_h = (c_hole - v.co).normalized()
            c_ref = slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.01, v.co.z)))
            out_r = Vector((v.co.x - c_ref.x, v.co.y - c_ref.y, 0.0)).normalized()
            p_r = v.co - out_r * 0.0022 + in_h * 0.006
            rim.append(bm.verts.new(p_r))
        n_sl = len(hole_verts)
        for k in range(n_sl):
            kn = (k + 1) % n_sl
            if side == 1:
                bm.faces.new((hole_verts[k], hole_verts[kn], rim[kn], rim[k]))
            else:
                bm.faces.new((hole_verts[k], rim[k], rim[kn], hole_verts[kn]))

    add_tucked_edge(bm, rings[-1], centers[-1], 0.0038, Vector((0.0, 0.0, -0.005)))

    zip_rail_faces = []
    zip_metal_faces = []
    zi_z0 = min(range(n_rings), key=lambda i: abs(all_zs[i] - 1.18))
    zi_z1 = min(range(n_rings), key=lambda i: abs(all_zs[i] - 1.445))
    z_pts = [rings[zi][0].co for zi in range(zi_z0, zi_z1 + 1)]
    zip_rows = []
    for p in z_pts:
        v0 = bm.verts.new(p + Vector((-0.0030, -0.0010, 0.0)))
        v1 = bm.verts.new(p + Vector((-0.0024, -0.0032, 0.0)))
        v2 = bm.verts.new(p + Vector((+0.0024, -0.0032, 0.0)))
        v3 = bm.verts.new(p + Vector((+0.0030, -0.0010, 0.0)))
        zip_rows.append((v0, v1, v2, v3))
    for r in range(len(zip_rows) - 1):
        a0, a1, a2, a3 = zip_rows[r]
        b0, b1, b2, b3 = zip_rows[r + 1]
        zip_rail_faces.extend([
            bm.faces.new((a0, b0, b1, a1)),
            bm.faces.new((a1, b1, b2, a2)),
            bm.faces.new((a2, b2, b3, a3)),
        ])

    top_z = z_pts[-1] + Vector((0.0, -0.0040, -0.004))
    res_sl = bmesh.ops.create_cube(bm, size=1.0)
    for v in res_sl["verts"]:
        v.co = Matrix.Translation(top_z) @ Vector((v.co.x * 0.0085, v.co.y * 0.0050, v.co.z * 0.012))
        for f in v.link_faces:
            if f not in zip_metal_faces:
                zip_metal_faces.append(f)
    res_pl = bmesh.ops.create_cube(bm, size=1.0)
    for v in res_pl["verts"]:
        v.co = Matrix.Translation(top_z + Vector((0.0, -0.0035, -0.012))) @ Matrix.Rotation(-0.15, 4, "X") @ Vector((v.co.x * 0.006, v.co.y * 0.002, v.co.z * 0.015))
        for f in v.link_faces:
            if f not in zip_metal_faces:
                zip_metal_faces.append(f)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    rail_set = set(zip_rail_faces)
    metal_set = set(zip_metal_faces)
    for f in bm.faces:
        if f in metal_set:
            f.material_index = 2
        elif f in rail_set:
            f.material_index = 1
        else:
            f.material_index = 0
        for loop in f.loops:
            loop[uv_layer].uv = _torso_uv(loop.vert.co)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_wetsuit)
    obj.data.materials.append(mat_zip_rail)
    obj.data.materials.append(mat_zip_metal)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for poly in obj.data.polygons:
        if poly.material_index != 0:
            continue
    for v in obj.data.vertices:
        z = v.co.z
        if 1.075 <= z < 1.430:
            c_t = slice_centroid_z(verts_torso, z, tol=0.03, fallback=Vector((0.0022, -0.01, z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_t.x, c_t.y)), bvh_torso, 0.0046, max_r=0.24)
            v.co = ensure_3d_surface_clearance(v.co, bvh_torso, 0.0046, max_dist=0.03)
        elif 0.805 <= z < 1.075:
            c_p = slice_centroid_z(verts_pelvis, z, tol=0.03, fallback=Vector((0.0022, 0.0, z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_p.x, c_p.y)), bvh_pelvis, 0.0046, max_r=0.24)
            v.co = ensure_3d_surface_clearance(v.co, bvh_pelvis, 0.0046, max_dist=0.03)
        elif z < 0.805:
            b_leg = bvh_left_leg if v.co.x > 0.002 else bvh_right_leg
            v.co = ensure_3d_surface_clearance(v.co, b_leg, 0.0046, max_dist=0.03)

    return obj


# ---------------------------------------------------------------------------
# 3. Regenerated 2-Piece Bikini Top (lara_bikini_top_red.glb)
# ---------------------------------------------------------------------------
def build_bikini_top(name: str, bvhs, mat_swimwear):
    bvh_torso = bvhs["bvh_torso"]
    verts_torso = bvhs["verts_torso"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    n_theta = 52
    band_zs = [1.224, 1.236, 1.248]
    band_rings = []
    for z in band_zs:
        c = slice_centroid_z(verts_torso, z, tol=0.025, fallback=Vector((0.0022, -0.015, z)))
        radii = smooth_ring_radii(bridge_convex_radii(
            [radial_surface_radius(bvh_torso, c, Vector((math.cos(-0.5 * math.pi + (j / n_theta) * 2.0 * math.pi), math.sin(-0.5 * math.pi + (j / n_theta) * 2.0 * math.pi), 0.0)), max_r=0.22) for j in range(n_theta)],
            max_dip=0.0012,
            passes=4,
        ), passes=2)
        rv = []
        for j in range(n_theta):
            th = -0.5 * math.pi + (j / n_theta) * 2.0 * math.pi
            d = Vector((math.cos(th), math.sin(th), 0.0))
            p = ensure_3d_surface_clearance(c + d * (radii[j] + 0.0040), bvh_torso, 0.0040, max_dist=0.025)
            rv.append(bm.verts.new(p))
        band_rings.append(rv)

    for zi in range(len(band_rings) - 1):
        for j in range(n_theta):
            jn = (j + 1) % n_theta
            bm.faces.new((band_rings[zi][j], band_rings[zi][jn], band_rings[zi + 1][jn], band_rings[zi + 1][j]))

    # Contoured molded triangle cups projected radially from torso centerline (covers outer bust cleanly)
    cup_n_u = 12
    cup_n_v = 11
    for side in (1, -1):
        cup_grid = []
        for iv in range(cup_n_v):
            tv = iv / (cup_n_v - 1)
            z_base = 1.236 + tv * 0.156
            w_scale = 1.0 - 0.78 * (tv ** 1.15)
            # Angular span around front-left / front-right breast center (wider outer coverage)
            ang_center = -0.5 * math.pi + side * (0.50 - 0.05 * tv)
            half_ang = 0.48 * w_scale
            row = []
            for iu in range(cup_n_u):
                tu = (iu / (cup_n_u - 1)) * 2.0 - 1.0
                th = ang_center + tu * half_ang * side
                z = z_base + (1.0 - tu * tu) * (0.010 * (1.0 - tv))
                c_ref = slice_centroid_z(verts_torso, z, tol=0.025, fallback=Vector((0.0022, -0.02, z)))
                d = Vector((math.cos(th), math.sin(th), 0.0))
                r = radial_surface_radius(bvh_torso, c_ref, d, max_r=0.22)
                p = c_ref + d * (r + 0.0048)
                p = ensure_3d_surface_clearance(p, bvh_torso, 0.0046, max_dist=0.03)
                row.append(bm.verts.new(p))
            cup_grid.append(row)

        for iv in range(cup_n_v - 1):
            for iu in range(cup_n_u - 1):
                if side == 1:
                    bm.faces.new((cup_grid[iv][iu], cup_grid[iv][iu + 1], cup_grid[iv + 1][iu + 1], cup_grid[iv + 1][iu]))
                else:
                    bm.faces.new((cup_grid[iv][iu], cup_grid[iv + 1][iu], cup_grid[iv + 1][iu + 1], cup_grid[iv][iu + 1]))

        for iv in range(cup_n_v - 1):
            for edge_iu in (0, cup_n_u - 1):
                v0 = cup_grid[iv][edge_iu]
                v1 = cup_grid[iv + 1][edge_iu]
                iv0 = bm.verts.new(v0.co + Vector((0.0, 0.0026, 0.0)))
                iv1 = bm.verts.new(v1.co + Vector((0.0, 0.0026, 0.0)))
                bm.faces.new((v0, iv0, iv1, v1))

    _create_straps(
        bm,
        bvh_torso,
        verts_torso,
        x_front=0.066,
        x_back=0.066,
        z_front=1.385,
        z_back=1.245,
        half_width=0.0060,
        clearance=0.0042,
        thickness=0.0024,
    )

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 0
        for loop in f.loops:
            loop[uv_layer].uv = _torso_uv(loop.vert.co)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_swimwear)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        v.co = ensure_3d_surface_clearance(v.co, bvh_torso, 0.0045, max_dist=0.025)

    return obj


# ---------------------------------------------------------------------------
# 4. 2-Piece Bikini Bottoms (slip, shorty, tanga, string)
# ---------------------------------------------------------------------------
def build_bikini_bottom(name: str, style: str, bvhs, mat_swimwear):
    bvh_pelvis = bvhs["bvh_pelvis"]
    verts_pelvis = bvhs["verts_pelvis"]
    bvh_left_leg = bvhs["bvh_left_leg"]
    verts_left_leg = bvhs["verts_left_leg"]
    bvh_right_leg = bvhs["bvh_right_leg"]
    verts_right_leg = bvhs["verts_right_leg"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    if style == "shorty":
        n_leg = 24
        z_bot = 0.732
        z_crotch = 0.778
        leg_zs = [z_bot + (z_crotch - z_bot) * (i / 4.0) for i in range(5)]
        leg_rings = {1: [], -1: []}
        leg_data = {
            1: (bvh_left_leg, verts_left_leg, Vector((0.072, 0.0, 0.75))),
            -1: (bvh_right_leg, verts_right_leg, Vector((-0.072, 0.0, 0.75))),
        }
        for side in (1, -1):
            bvh_l, verts_l, fb = leg_data[side]
            for z in leg_zs:
                c = slice_centroid_z(verts_l, z, tol=0.025, fallback=fb)
                rv = []
                for k in range(n_leg):
                    ang = (k / n_leg) * 2.0 * math.pi
                    d = Vector((-side * math.cos(ang), math.sin(ang), 0.0))
                    r = radial_surface_radius(bvh_l, c, d, max_r=0.14)
                    p = c + d * (r + 0.0044)
                    if side == 1 and p.x < 0.0025:
                        p.x = 0.0025
                    elif side == -1 and p.x > 0.0018:
                        p.x = 0.0018
                    rv.append(bm.verts.new(p))
                leg_rings[side].append(rv)

        for side in (1, -1):
            rings_s = leg_rings[side]
            for zi in range(len(rings_s) - 1):
                for k in range(n_leg):
                    kn = (k + 1) % n_leg
                    if side == -1:
                        bm.faces.new((rings_s[zi][k], rings_s[zi][kn], rings_s[zi + 1][kn], rings_s[zi + 1][k]))
                    else:
                        bm.faces.new((rings_s[zi][k], rings_s[zi + 1][k], rings_s[zi + 1][kn], rings_s[zi][kn]))
            _, verts_l, fb = leg_data[side]
            add_tucked_edge(bm, leg_rings[side][0], slice_centroid_z(verts_l, z_bot, tol=0.025, fallback=fb), 0.0030, Vector((0.0, 0.0, 0.005)))

        l_top = leg_rings[1][-1]
        r_top = leg_rings[-1][-1]
        v_cm = bm.verts.new(_sagittal_crotch_point(0.0022, 0.0, 0.0, bvh_pelvis, clr=0.0045))
        v_cf = bm.verts.new(_sagittal_crotch_point(0.0022, -1.0, 0.32, bvh_pelvis, clr=0.0048))
        v_cb = bm.verts.new(_sagittal_crotch_point(0.0022, 1.0, 0.36, bvh_pelvis, clr=0.0048))
        bm.faces.new((l_top[0], v_cm, v_cf, l_top[n_leg - 1]))
        bm.faces.new((r_top[0], r_top[n_leg - 1], v_cf, v_cm))
        bm.faces.new((l_top[0], l_top[1], v_cb, v_cm))
        bm.faces.new((r_top[0], v_cm, v_cb, r_top[1]))

        p_loop_0 = [v_cf] + [l_top[n_leg - 1 - i] for i in range(n_leg - 1)] + [v_cb] + [r_top[1 + i] for i in range(n_leg - 1)]
        n_p = len(p_loop_0)
        pelvis_zs = [z_crotch + (0.985 - z_crotch) * (i / 10.0) for i in range(1, 11)]
        p_rings = [p_loop_0]
        for zi, z in enumerate(pelvis_zs):
            c = slice_centroid_z(verts_pelvis, z, tol=0.025, fallback=Vector((0.0022, 0.0, z)))
            radii = bridge_convex_radii(
                [radial_surface_radius(bvh_pelvis, c, Vector((math.cos(-0.5 * math.pi + (pi / n_p) * 2.0 * math.pi), math.sin(-0.5 * math.pi + (pi / n_p) * 2.0 * math.pi), 0.0)), max_r=0.24) for pi in range(n_p)],
                max_dip=0.0014,
                passes=4,
            )
            rv = []
            for pi in range(n_p):
                th = -0.5 * math.pi + (pi / n_p) * 2.0 * math.pi
                d = Vector((math.cos(th), math.sin(th), 0.0))
                p = c + d * (radii[pi] + 0.0046)
                if zi < 2:
                    p = p_rings[-1][pi].co.lerp(p, 0.48 if zi == 0 else 0.80)
                if z >= 0.805:
                    p = ensure_z_plane_clearance(p, Vector((c.x, c.y)), bvh_pelvis, 0.0044, max_r=0.24)
                rv.append(bm.verts.new(p))
            p_rings.append(rv)

        for zi in range(len(p_rings) - 1):
            for pi in range(n_p):
                pn = (pi + 1) % n_p
                bm.faces.new((p_rings[zi][pi], p_rings[zi][pn], p_rings[zi + 1][pn], p_rings[zi + 1][pi]))
        add_tucked_edge(bm, p_rings[-1], slice_centroid_z(verts_pelvis, 0.985, tol=0.025, fallback=Vector((0.0022, 0.0, 0.985))), 0.0032, Vector((0.0, 0.0, -0.005)))
    else:
        if style == "slip":
            front_w, back_w, band_h, z_hip = 0.095, 0.125, 0.036, 0.965
        elif style == "tanga":
            front_w, back_w, band_h, z_hip = 0.082, 0.072, 0.018, 0.975
        else:
            front_w, back_w, band_h, z_hip = 0.068, 0.024, 0.008, 0.982

        n_theta = 48
        band_rings = []
        for z in (z_hip - band_h, z_hip - 0.5 * band_h, z_hip):
            c = slice_centroid_z(verts_pelvis, z, tol=0.025, fallback=Vector((0.0022, 0.0, z)))
            radii = smooth_ring_radii(bridge_convex_radii(
                [radial_surface_radius(bvh_pelvis, c, Vector((math.cos(-0.5 * math.pi + (j / n_theta) * 2.0 * math.pi), math.sin(-0.5 * math.pi + (j / n_theta) * 2.0 * math.pi), 0.0)), max_r=0.24) for j in range(n_theta)],
                max_dip=0.0012,
                passes=4,
            ), passes=2)
            rv = []
            for j in range(n_theta):
                th = -0.5 * math.pi + (j / n_theta) * 2.0 * math.pi
                d = Vector((math.cos(th), math.sin(th), 0.0))
                p = ensure_z_plane_clearance(c + d * (radii[j] + 0.0046), Vector((c.x, c.y)), bvh_pelvis, 0.0044, max_r=0.24)
                rv.append(bm.verts.new(p))
            band_rings.append(rv)

        for zi in range(len(band_rings) - 1):
            for j in range(n_theta):
                jn = (j + 1) % n_theta
                bm.faces.new((band_rings[zi][j], band_rings[zi][jn], band_rings[zi + 1][jn], band_rings[zi + 1][j]))

        n_u = 9
        n_v = 11
        z_crotch = 0.778
        for is_back, top_w in ((False, front_w), (True, back_w)):
            grid = []
            for iv in range(n_v):
                tv = iv / (n_v - 1)
                z = z_crotch + (z_hip - band_h - z_crotch) * tv
                if style == "string" and is_back:
                    half_w = 0.011 + (top_w - 0.011) * (tv ** 2.4)
                elif style == "tanga" and is_back:
                    half_w = 0.016 + (top_w - 0.016) * (tv ** 1.6)
                else:
                    half_w = 0.022 + (top_w - 0.022) * (tv ** 1.15)
                c = slice_centroid_z(verts_pelvis, max(0.84, z), tol=0.03, fallback=Vector((0.0022, 0.0, z)))
                row = []
                for iu in range(n_u):
                    tu = (iu / (n_u - 1)) * 2.0 - 1.0
                    ang_span = math.atan2(half_w, 0.095)
                    th = (0.5 * math.pi if is_back else -0.5 * math.pi) + tu * ang_span * (1.0 if not is_back else -1.0)
                    d = Vector((math.cos(th), math.sin(th), 0.0))
                    r = radial_surface_radius(bvh_pelvis, c, d, max_r=0.24)
                    p_ring = ensure_z_plane_clearance(c + d * (r + 0.0046), Vector((c.x, c.y)), bvh_pelvis, 0.0044, max_r=0.24)
                    if tv < 0.45:
                        t_arc = min(1.0, tv / 0.38)
                        x_cr = 0.0022 + tu * 0.015
                        p_cr = _sagittal_crotch_point(x_cr, 1.0 if is_back else -1.0, t_arc * 0.82, bvh_pelvis, clr=0.0048)
                        blend = 1.0 if tv <= 0.22 else max(0.0, 1.0 - (tv - 0.22) / 0.23)
                        p = p_ring.lerp(p_cr, blend)
                    else:
                        p = p_ring
                    row.append(bm.verts.new(p))
                grid.append(row)

            for iv in range(n_v - 1):
                for iu in range(n_u - 1):
                    if not is_back:
                        bm.faces.new((grid[iv][iu], grid[iv][iu + 1], grid[iv + 1][iu + 1], grid[iv + 1][iu]))
                    else:
                        bm.faces.new((grid[iv][iu], grid[iv + 1][iu], grid[iv + 1][iu + 1], grid[iv][iu + 1]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 0
        for loop in f.loops:
            loop[uv_layer].uv = _torso_uv(loop.vert.co)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_swimwear)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        if v.co.z >= 0.805:
            v.co = ensure_3d_surface_clearance(v.co, bvh_pelvis, 0.0044, max_dist=0.03)
        elif style == "shorty":
            b_leg = bvh_left_leg if v.co.x > 0.002 else bvh_right_leg
            v.co = ensure_3d_surface_clearance(v.co, b_leg, 0.0044, max_dist=0.03)

    return obj


def generate_swimwear(bvhs, mats, armature, only_ids: set[str] | None = None):
    donor_legs = [
        bpy.data.objects["body_nude_feet"],
        bpy.data.objects["body_nude_legs"],
        bpy.data.objects["body_nude_panties"],
        bpy.data.objects["body_nude_torso"],
    ]
    donor_torso_only = [
        bpy.data.objects["body_nude_torso"],
        bpy.data.objects["body_nude_panties"],
    ]

    if only_ids is None or "onepiece" in only_ids:
        onepiece = build_onepiece_swimsuit("lara_swimsuit_onepiece", bvhs, mats["swimwear"])
        bind_and_transfer_weights(
            onepiece,
            donor_legs,
            armature,
            bone_attenuation={"breast_left_base": 0.70, "breast_right_base": 0.70},
            smooth_passes=1,
        )
        export_garment_glb([onepiece], armature, "swimwear/lara_swimsuit_onepiece.glb")

    if only_ids is None or "onepiece-shorty" in only_ids:
        shorty = build_shorty_swimsuit(
            "lara_swimsuit_shorty",
            bvhs,
            mats["wetsuit"],
            mats["zip_plastic_red"],
            mats["zip_metal_red"],
        )
        bind_and_transfer_weights(
            shorty,
            donor_legs,
            armature,
            bone_attenuation={"breast_left_base": 0.55, "breast_right_base": 0.55},
            smooth_passes=1,
        )
        export_garment_glb([shorty], armature, "swimwear/lara_swimsuit_shorty.glb")

    if only_ids is None or "bikini-top-red" in only_ids:
        btop = build_bikini_top("lara_bikini_top_red", bvhs, mats["swimwear"])
        bind_and_transfer_weights(
            btop,
            donor_torso_only,
            armature,
            bone_attenuation={"breast_left_base": 0.85, "breast_right_base": 0.85},
            smooth_passes=1,
        )
        export_garment_glb([btop], armature, "swimwear/lara_bikini_top_red.glb")

    for style in ("slip", "shorty", "tanga", "string"):
        oid = f"bikini-{style}"
        if only_ids is not None and oid not in only_ids:
            continue
        bbot = build_bikini_bottom(f"lara_bikini_{style}", style, bvhs, mats["swimwear"])
        bind_and_transfer_weights(bbot, donor_legs, armature, smooth_passes=1)
        export_garment_glb([bbot], armature, f"swimwear/lara_bikini_{style}.glb")
