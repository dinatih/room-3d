"""Zipped cotton hoodie generator for Lara with 4 cuts x 4 zip openings."""

import math
import bpy
import bmesh
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

from .geometry import (
    bridge_convex_radii,
    build_drawstrings,
    ensure_3d_surface_clearance,
    ensure_radial_clearance,
    ensure_z_plane_clearance,
    radial_surface_radius,
    slice_centroid_x,
    slice_centroid_z,
    smooth_ring_radii,
)
from .rigging import bind_and_transfer_weights, export_garment_glb


ZIP_OPENING_FRACS = {
    "closed": 0.0,
    "open_1_3": 1.0 / 3.0,
    "open_2_3": 2.0 / 3.0,
    "open_full": 1.0,
}


def build_zip_hoodie(
    name: str,
    bvh_torso: BVHTree,
    verts_torso,
    bvh_left_arm: BVHTree,
    verts_left_arm,
    bvh_right_arm: BVHTree,
    verts_right_arm,
    mat_fleece,
    mat_rib,
    mat_lining,
    mat_zip_tape,
    mat_zip_rail,
    mat_zip_metal,
    mat_cord,
    *,
    z_hem_bot: float = 0.960,
    z_hem_top: float = 1.015,
    n_body_z: int = 30,
    include_sleeves: bool = True,
    include_pockets: bool = True,
    tank_armhole: bool = False,
    zip_open_frac: float = 0.0,
):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    z_collar = 1.476
    z_zip_top = 1.430
    z_zip_bot = z_hem_bot + 0.012
    is_full_open = zip_open_frac >= 0.99
    z_split = z_zip_bot if is_full_open else (z_zip_top - zip_open_frac * (z_zip_top - z_zip_bot))
    n_theta = 48

    zs = []
    for i in range(5):
        zs.append(z_hem_bot + (z_hem_top - z_hem_bot) * (i / 4.0))
    for i in range(1, n_body_z + 1):
        zs.append(z_hem_top + (z_collar - z_hem_top) * (i / n_body_z))
    n_rings = len(zs)

    zi_split = min(range(n_rings), key=lambda i: abs(zs[i] - z_split))

    torso_grid = []
    torso_centers = []
    hem_clr = 0.0105 if z_hem_bot > 1.10 else 0.0085
    for zi, z in enumerate(zs):
        c = slice_centroid_z(verts_torso, z, tol=0.028, fallback=Vector((0.0022, -0.010, z)))
        torso_centers.append(c)
        is_hem = z <= z_hem_top + 1e-4

        base_gap = 0.065 if z < 1.38 else (0.065 + 0.14 * ((z - 1.38) / (z_collar - 1.38)) ** 2)
        if is_full_open:
            t_full = max(0.0, min(1.0, (z - z_hem_bot) / max(1e-5, z_collar - z_hem_bot)))
            gap_ang = max(base_gap, 0.22 + 0.17 * (t_full ** 0.78))
        elif zip_open_frac > 0.01 and z > z_split:
            u_open = max(0.0, min(1.0, (z - z_split) / max(0.06, z_collar - z_split)))
            max_open_gap = 0.36 + 0.04 * zip_open_frac
            gap_ang = max(base_gap, 0.065 + (max_open_gap - 0.065) * (u_open ** 0.72))
        else:
            gap_ang = base_gap

        radii = []
        dirs = []
        thetas = []
        for j in range(n_theta):
            t = j / (n_theta - 1)
            theta = (-0.5 * math.pi + gap_ang) + t * (2.0 * math.pi - 2.0 * gap_ang)
            d = Vector((math.cos(theta), math.sin(theta), 0.0))
            r = radial_surface_radius(bvh_torso, c, d, max_r=0.22)
            radii.append(r)
            dirs.append(d)
            thetas.append(theta)

        radii = bridge_convex_radii(radii, max_dip=0.0018, passes=8)
        radii = smooth_ring_radii(radii, passes=3)

        ring_verts = []
        for j in range(n_theta):
            th = thetas[j]
            r_eff = radii[j]
            if tank_armhole and z >= 1.430:
                t_up = min(1.0, max(0.0, (z - 1.430) / max(1e-5, z_collar - 1.430)))
                max_lat = 0.114 - 0.052 * (t_up ** 0.75)
                lat_w = abs(math.cos(th))
                if lat_w > 0.25 and r_eff * lat_w > max_lat:
                    r_eff = max_lat / lat_w
            if is_hem:
                clr = hem_clr
            elif z < 1.24:
                clr = 0.0155 + 0.003 * math.sin(th * 2.0) ** 2
            elif z < 1.40:
                clr = 0.0125
            elif tank_armhole and z >= 1.430:
                t_up = min(1.0, max(0.0, (z - 1.430) / max(1e-5, z_collar - 1.430)))
                clr = 0.0095 - 0.0025 * t_up
            else:
                shoulder_ease = 0.004 * (math.cos(th) ** 2)
                clr = 0.0105 + shoulder_ease - 0.002 * ((z - 1.40) / (z_collar - 1.40))

            # Subtle outward lapel roll along open front edges so open jacket drapes over bust
            if (is_full_open or (zip_open_frac > 0.01 and z > z_split)) and (j < 4 or j > n_theta - 5):
                edge_k = (4 - j) / 4.0 if j < 4 else (j - (n_theta - 5)) / 4.0
                clr += 0.0035 * edge_k

            p = c + dirs[j] * (r_eff + clr)
            if not (tank_armhole and z >= 1.430):
                p = ensure_z_plane_clearance(p, Vector((c.x, c.y)), bvh_torso, 0.0080, max_r=0.22)
            ring_verts.append(bm.verts.new(p))
        torso_grid.append(ring_verts)

    z_arm_bot_target = 1.298 if tank_armhole else 1.335
    z_arm_top_target = 1.466 if tank_armhole else 1.464
    zi_arm_bot = min(range(n_rings), key=lambda i: abs(zs[i] - z_arm_bot_target))
    zi_arm_top = min(range(n_rings), key=lambda i: abs(zs[i] - z_arm_top_target))
    if not tank_armhole:
        zi_arm_top = min(n_rings - 1, max(zi_arm_bot + 6, zi_arm_top))
    else:
        zi_arm_top = min(n_rings - 2, max(zi_arm_bot + 6, zi_arm_top))

    j_left_mid = n_theta // 4
    j_right_mid = (3 * n_theta) // 4
    half_w = 4 if tank_armhole else 3
    arm_windows = {
        1: (zi_arm_bot, zi_arm_top, j_left_mid - half_w, j_left_mid + half_w),
        -1: (zi_arm_bot, zi_arm_top, j_right_mid - half_w, j_right_mid + half_w),
    }

    def _in_armhole(zi, j):
        for z0, z1, j0, j1 in arm_windows.values():
            if z0 <= zi < z1 and j0 <= j < j1:
                return True
        return False

    torso_shell_faces = []
    hem_faces = []
    hem_return_faces = []
    for zi in range(n_rings - 1):
        is_hem = zi < 4
        for j in range(n_theta - 1):
            if _in_armhole(zi, j):
                continue
            f = bm.faces.new((
                torso_grid[zi][j],
                torso_grid[zi][j + 1],
                torso_grid[zi + 1][j + 1],
                torso_grid[zi + 1][j],
            ))
            torso_shell_faces.append(f)
            if is_hem:
                hem_faces.append(f)

    c0 = torso_centers[0]
    for j in range(n_theta - 1):
        v0 = torso_grid[0][j]
        v1 = torso_grid[0][j + 1]
        d0 = Vector((v0.co.x - c0.x, v0.co.y - c0.y, 0.0)).normalized()
        d1 = Vector((v1.co.x - c0.x, v1.co.y - c0.y, 0.0)).normalized()
        iv0 = bm.verts.new(v0.co - d0 * 0.005 + Vector((0.0, 0.0, 0.008)))
        iv1 = bm.verts.new(v1.co - d1 * 0.005 + Vector((0.0, 0.0, 0.008)))
        rf = bm.faces.new((v0, iv0, iv1, v1))
        hem_faces.append(rf)
        hem_return_faces.append(rf)

    # Interior lining shell inside open front panels so unzipped chest gap shows clean facing
    placket_return_faces = []
    open_start_zi = 0 if is_full_open else zi_split
    if is_full_open or zip_open_frac > 0.01:
        for side_idx in (0, n_theta - 1):
            side_sign = 1.0 if side_idx == 0 else -1.0
            outer_col = [torso_grid[zi][side_idx] for zi in range(open_start_zi, n_rings)]
            inner_col = []
            for k, zi in enumerate(range(open_start_zi, n_rings)):
                v_out = outer_col[k].co
                c_z = torso_centers[zi]
                inward = Vector((c_z.x - v_out.x, c_z.y - v_out.y, 0.0)).normalized()
                along_panel = Vector((side_sign * 0.012, 0.005, 0.0))
                p_in = v_out + inward * 0.0045 + along_panel
                p_in = ensure_z_plane_clearance(p_in, Vector((c_z.x, c_z.y)), bvh_torso, 0.0065, max_r=0.22)
                inner_col.append(bm.verts.new(p_in))
            for k in range(len(outer_col) - 1):
                if side_idx == 0:
                    pf = bm.faces.new((outer_col[k], inner_col[k], inner_col[k + 1], outer_col[k + 1]))
                else:
                    pf = bm.faces.new((outer_col[k], outer_col[k + 1], inner_col[k + 1], inner_col[k]))
                placket_return_faces.append((pf, side_sign))

    # -----------------------------------------------------------------------
    # Sleeves (long cuffed sleeves OR ribbed sleeveless armhole bindings)
    # -----------------------------------------------------------------------
    cuff_faces = []
    sleeve_shell_faces = {1: [], -1: []}
    cuff_return_faces = {1: [], -1: []}
    armhole_band_faces = {1: [], -1: []}
    arm_data = {
        1: (bvh_left_arm, verts_left_arm),
        -1: (bvh_right_arm, verts_right_arm),
    }
    for side, (z0, z1, j0, j1) in arm_windows.items():
        bvh_arm, verts_arm = arm_data[side]
        hole_verts = []
        for j in range(j0, j1):
            hole_verts.append(torso_grid[z0][j])
        for zi in range(z0, z1):
            hole_verts.append(torso_grid[zi][j1])
        for j in range(j1, j0, -1):
            hole_verts.append(torso_grid[z1][j])
        for zi in range(z1, z0, -1):
            hole_verts.append(torso_grid[zi][j0])
        n_sl = len(hole_verts)

        if not include_sleeves:
            c_hole = sum((v.co for v in hole_verts), Vector()) / n_sl
            rib_ring = []
            ret_ring = []
            for v in hole_verts:
                c_ref = slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.010, v.co.z)))
                rad_out = Vector((v.co.x - c_ref.x, v.co.y - c_ref.y, 0.0)).normalized()
                in_hole = (c_hole - v.co).normalized()
                p_rim = v.co + rad_out * 0.0028 + in_hole * 0.0085
                if p_rim.z < 1.430:
                    p_rim = ensure_z_plane_clearance(p_rim, Vector((c_ref.x, c_ref.y)), bvh_torso, 0.0085, max_r=0.22)
                rib_ring.append(bm.verts.new(p_rim))
                p_ret = p_rim - rad_out * 0.0055 + in_hole * 0.0035
                ret_ring.append(bm.verts.new(p_ret))
            for ring_a, ring_b, flip_normal in ((hole_verts, rib_ring, False), (rib_ring, ret_ring, True)):
                for k in range(n_sl):
                    kn = (k + 1) % n_sl
                    if side == 1:
                        f = bm.faces.new((ring_a[k], ring_a[kn], ring_b[kn], ring_b[k]))
                    else:
                        f = bm.faces.new((ring_a[k], ring_b[k], ring_b[kn], ring_a[kn]))
                    cuff_faces.append(f)
                    armhole_band_faces[side].append((f, c_hole, flip_normal))
            continue

        x_start = sum(v.co.x for v in hole_verts) / n_sl
        c_sh = slice_centroid_x(verts_arm, x_start, tol=0.03)
        x_wrist = side * 0.558
        x_cuff_start = side * 0.508

        hole_angles = [math.atan2(v.co.z - c_sh.z, v.co.y - c_sh.y) for v in hole_verts]

        sleeve_xs = []
        n_sl_body = 14
        for si in range(1, n_sl_body + 1):
            sleeve_xs.append(x_start + (x_cuff_start - x_start) * (si / n_sl_body))
        n_sl_cuff = 4
        for si in range(1, n_sl_cuff + 1):
            sleeve_xs.append(x_cuff_start + (x_wrist - x_cuff_start) * (si / n_sl_cuff))

        sleeve_rings = [hole_verts]
        for si, x in enumerate(sleeve_xs):
            is_cuff = abs(x) >= abs(x_cuff_start) - 1e-4
            c_arm = slice_centroid_x(verts_arm, x, tol=0.025)
            t_arm = max(0.0, min(1.0, (abs(x) - 0.13) / (0.56 - 0.13)))

            ring_v = []
            for k in range(n_sl):
                ang = hole_angles[k]
                d = Vector((0.0, math.cos(ang), math.sin(ang)))
                r = radial_surface_radius(bvh_arm, c_arm, d, max_r=0.11)
                if is_cuff:
                    clr = 0.0065
                else:
                    under_drape = 0.0045 * max(0.0, -math.sin(ang))
                    sh_ease = 0.0045 * max(0.0, 1.0 - t_arm / 0.25)
                    clr = 0.0135 + 0.0025 * math.sin(t_arm * math.pi) + under_drape + sh_ease
                p = c_arm + d * (r + clr)
                if si < 2:
                    blend = 0.65 if si == 0 else 0.88
                    p = hole_verts[k].co.lerp(p, blend)
                    p.x = x
                    p = ensure_radial_clearance(p, c_arm, bvh_arm, 0.0125, max_r=0.11)
                ring_v.append(bm.verts.new(p))
            sleeve_rings.append(ring_v)

        for si in range(len(sleeve_rings) - 1):
            r0 = sleeve_rings[si]
            r1 = sleeve_rings[si + 1]
            c_seg = (sum((v.co for v in r0), Vector()) + sum((v.co for v in r1), Vector())) / (2.0 * n_sl)
            is_cuff_seg = si >= n_sl_body
            for k in range(n_sl):
                kn = (k + 1) % n_sl
                if side == 1:
                    f = bm.faces.new((r0[k], r0[kn], r1[kn], r1[k]))
                else:
                    f = bm.faces.new((r0[k], r1[k], r1[kn], r0[kn]))
                sleeve_shell_faces[side].append((f, c_seg))
                if is_cuff_seg:
                    cuff_faces.append(f)

        wrist_ring = sleeve_rings[-1]
        c_wrist = slice_centroid_x(verts_arm, x_wrist, tol=0.025)
        inner_wrist = []
        for v in wrist_ring:
            d_in = Vector((0.0, v.co.y - c_wrist.y, v.co.z - c_wrist.z)).normalized()
            iv = bm.verts.new(v.co - d_in * 0.0045 + Vector((-side * 0.008, 0.0, 0.0)))
            inner_wrist.append(iv)
        for k in range(n_sl):
            kn = (k + 1) % n_sl
            if side == 1:
                f = bm.faces.new((wrist_ring[k], wrist_ring[kn], inner_wrist[kn], inner_wrist[k]))
            else:
                f = bm.faces.new((wrist_ring[k], inner_wrist[k], inner_wrist[kn], wrist_ring[kn]))
            cuff_faces.append(f)
            cuff_return_faces[side].append(f)

    # -----------------------------------------------------------------------
    # Split Kangaroo Pockets
    # -----------------------------------------------------------------------
    pocket_trim_faces = []
    pocket_front_faces = []
    pocket_seam_faces = []
    if include_pockets:
        zi_pkt_bot = min(range(n_rings), key=lambda i: abs(zs[i] - 1.018))
        zi_pkt_top = min(range(n_rings), key=lambda i: abs(zs[i] - 1.158))
        for side in (1, -1):
            j_range = list(range(1, 8) if side == 1 else range(n_theta - 8, n_theta - 1))
            pkt_grid = []
            for zi in range(zi_pkt_bot, zi_pkt_top + 1):
                t_z = (zi - zi_pkt_bot) / max(1, zi_pkt_top - zi_pkt_bot)
                c_z = torso_centers[zi]
                row = []
                for idx_j, j in enumerate(j_range):
                    base_p = torso_grid[zi][j].co
                    t_x = idx_j / (len(j_range) - 1)
                    is_outer = t_x if side == 1 else (1.0 - t_x)
                    out_dir = Vector((base_p.x - c_z.x, base_p.y - c_z.y, 0.0)).normalized()
                    edge_fade = math.sin(min(1.0, max(0.0, (1.0 - is_outer) * 1.15)) * math.pi * 0.5)
                    lift = 0.0018 if (t_z < 0.10 or t_z > 0.92) else 0.0062 * (0.55 + 0.45 * edge_fade)
                    z_adj = -0.032 * (is_outer - 0.50) * (t_z - 0.20) if (is_outer > 0.50 and t_z > 0.20) else 0.0
                    row.append(bm.verts.new(base_p + out_dir * lift + Vector((0.0, 0.0, z_adj))))
                pkt_grid.append(row)

            nr_p = len(pkt_grid)
            nc_p = len(pkt_grid[0])
            for r in range(nr_p - 1):
                for c_i in range(nc_p - 1):
                    f = bm.faces.new((pkt_grid[r][c_i], pkt_grid[r][c_i + 1], pkt_grid[r + 1][c_i + 1], pkt_grid[r + 1][c_i]))
                    pocket_front_faces.append(f)
                    is_outer_col = (c_i == nc_p - 2) if side == 1 else (c_i == 0)
                    if is_outer_col and r >= 2:
                        pocket_trim_faces.append(f)
            for r in range(nr_p - 1):
                j_in = j_range[0] if side == 1 else j_range[-1]
                c_in = 0 if side == 1 else (nc_p - 1)
                v_b0 = torso_grid[zi_pkt_bot + r][j_in]
                v_b1 = torso_grid[zi_pkt_bot + r + 1][j_in]
                if side == 1:
                    sf = bm.faces.new((v_b0, pkt_grid[r][c_in], pkt_grid[r + 1][c_in], v_b1))
                else:
                    sf = bm.faces.new((v_b0, v_b1, pkt_grid[r + 1][c_in], pkt_grid[r][c_in]))
                pocket_seam_faces.append((sf, "in", side))
            for c_i in range(nc_p - 1):
                j_a = j_range[c_i]
                j_b = j_range[c_i + 1]
                pocket_seam_faces.append((bm.faces.new((pkt_grid[-1][c_i], torso_grid[zi_pkt_top][j_a], torso_grid[zi_pkt_top][j_b], pkt_grid[-1][c_i + 1])), "top", side))
                pocket_seam_faces.append((bm.faces.new((torso_grid[zi_pkt_bot][j_a], pkt_grid[0][c_i], pkt_grid[0][c_i + 1], torso_grid[zi_pkt_bot][j_b])), "bot", side))

    # -----------------------------------------------------------------------
    # Cupped Watertight Draped Hood
    # -----------------------------------------------------------------------
    hood_margin = 13 if tank_armhole else 5
    hood_col_indices = list(range(hood_margin, n_theta - hood_margin))
    n_hc = len(hood_col_indices)

    hood_profile = [
        (0.00,  0.00),
        (0.02, -0.35),
        (0.05, -0.70),
        (0.18, -0.96),
        (0.50, -1.02),
        (0.84, -0.88),
        (1.00, -0.58),
        (0.96, -0.32),
        (0.82, -0.14),
        (0.66, -0.08),
        (0.62, -0.22),
        (0.66, -0.52),
        (0.46, -0.80),
        (0.24, -0.52),
        (0.14, -0.20),
        (0.10, +0.01),
    ]
    n_hp = len(hood_profile)
    c_collar = torso_centers[-1]
    hood_rings = []
    for idx, j in enumerate(hood_col_indices):
        base = torso_grid[-1][j].co
        t_side = idx / (n_hc - 1)
        w = math.sin(t_side * math.pi) ** 0.78
        drop = 0.010 + 0.155 * w
        depth = 0.008 + 0.056 * w
        fold_wave = 0.0030 * math.cos(t_side * math.pi * 4.0) * w

        d_rad = Vector((base.x - c_collar.x, base.y - c_collar.y, 0.0))
        if d_rad.length > 1e-6:
            d_rad.normalize()
        else:
            d_rad = Vector((0.0, 1.0, 0.0))
        fan_x = 0.04 if tank_armhole else 0.08
        d_back_fan = Vector((fan_x * (0.5 - t_side) * 2.0, 1.0, 0.0)).normalized()
        d_drape = d_rad.lerp(d_back_fan, (0.95 if tank_armhole else 0.90) * (w ** 0.45)).normalized()

        col_verts = []
        for u_frac, v_frac in hood_profile:
            z_pt = base.z - 0.0015 + v_frac * drop
            if u_frac > 0.08 and w > 0.25:
                z_pt = min(z_pt, 1.464)
            else:
                z_pt = min(z_pt, 1.474)

            c_ref = slice_centroid_z(verts_torso, z_pt, tol=0.03, fallback=Vector((0.0022, -0.010, z_pt)))
            back_slope = 0.036 * w * min(1.0, abs(v_frac))
            p_under = Vector((base.x, base.y, z_pt)) + d_drape * back_slope
            if abs(v_frac) > 0.04:
                p_under = ensure_z_plane_clearance(
                    p_under, Vector((c_ref.x, c_ref.y)), bvh_torso, 0.0165, max_r=0.22
                )

            p = p_under + d_drape * (u_frac * depth + fold_wave * u_frac)
            if tank_armhole:
                p.x = max(-0.102, min(0.102, p.x))
            if w > 0.25 and p.y > 0.040 and u_frac > 0.08:
                p.z = min(p.z, 1.464)
            col_verts.append(bm.verts.new(p))
        hood_rings.append(col_verts)

    hood_faces = []
    hood_outer_check_faces = []
    lining_faces = []
    for k in range(n_hc - 1):
        c0_h = hood_rings[k]
        c1_h = hood_rings[k + 1]
        for s in range(n_hp):
            sn = (s + 1) % n_hp
            f = bm.faces.new((c0_h[s], c0_h[sn], c1_h[sn], c1_h[s]))
            hood_faces.append(f)
            if 9 <= s <= 14:
                lining_faces.append(f)
            elif 5 <= s <= 7 and 0.25 <= (k / (n_hc - 1)) <= 0.75:
                hood_outer_check_faces.append(f)

    end_cap_specs = [
        (0, 1, 14, 15),
        (1, 2, 13, 14),
        (2, 3, 12, 13),
        (3, 4, 12),
        (4, 5, 12),
        (5, 11, 12),
        (5, 6, 11),
        (6, 7, 10, 11),
        (7, 8, 9, 10),
    ]
    for cap_idx, flip_cap in ((0, True), (n_hc - 1, False)):
        ring = hood_rings[cap_idx]
        for spec in end_cap_specs:
            verts_cap = [ring[i] for i in (reversed(spec) if flip_cap else spec)]
            hood_faces.append(bm.faces.new(verts_cap))

    bmesh.ops.recalc_face_normals(bm, faces=hood_faces)
    if hood_outer_check_faces:
        bm.normal_update()
        avg_outer_ny = sum(f.normal.y for f in hood_outer_check_faces) / len(hood_outer_check_faces)
        if avg_outer_ny < 0.0:
            bmesh.ops.reverse_faces(bm, faces=hood_faces)

    # -----------------------------------------------------------------------
    # Zipper: Fabric Tape + Red Plastic Rails/Teeth + Red Metallic Slider & Pull
    # -----------------------------------------------------------------------
    zip_tape_faces = []
    zip_rail_faces = []
    zip_metal_faces = []

    zip_zi_list = [zi for zi in range(n_rings) if zs[zi] <= z_zip_top + 0.015]
    closed_zis = [] if is_full_open else [zi for zi in zip_zi_list if zi <= zi_split]
    open_zis = zip_zi_list if is_full_open else [zi for zi in zip_zi_list if zi >= zi_split]

    # 1. Closed zipper segment (joined center track)
    closed_rows_tape = []
    closed_rows_rail = []
    for zi in closed_zis:
        vL = torso_grid[zi][0].co
        vR = torso_grid[zi][-1].co
        mid = 0.5 * (vL + vR)
        tL = bm.verts.new(vL + Vector((-0.001, 0.0005, 0.0)))
        tML = bm.verts.new(mid + Vector((-0.0034, -0.0008, 0.0)))
        tMR = bm.verts.new(mid + Vector((+0.0034, -0.0008, 0.0)))
        tR = bm.verts.new(vR + Vector((+0.001, 0.0005, 0.0)))
        closed_rows_tape.append((tL, tML, tMR, tR))

        mL = bm.verts.new(mid + Vector((-0.0030, -0.0032, 0.0)))
        mR = bm.verts.new(mid + Vector((+0.0030, -0.0032, 0.0)))
        closed_rows_rail.append((tML, mL, mR, tMR))

    for r in range(len(closed_rows_tape) - 1):
        a0, a1, a2, a3 = closed_rows_tape[r]
        b0, b1, b2, b3 = closed_rows_tape[r + 1]
        zip_tape_faces.append(bm.faces.new((a0, b0, b1, a1)))
        zip_tape_faces.append(bm.faces.new((a2, b2, b3, a3)))
        zip_tape_faces.append(bm.faces.new((a1, b1, b2, a2)))

        c0_r, c1_r, c2_r, c3_r = closed_rows_rail[r]
        d0_r, d1_r, d2_r, d3_r = closed_rows_rail[r + 1]
        zip_rail_faces.append(bm.faces.new((c0_r, d0_r, d1_r, c1_r)))
        zip_rail_faces.append(bm.faces.new((c1_r, d1_r, d2_r, c2_r)))
        zip_rail_faces.append(bm.faces.new((c2_r, d2_r, d3_r, c3_r)))

    # 2. Open zipper rails along separated left and right front edges
    open_rail_check_normals = []
    if len(open_zis) >= 2:
        for side_idx in (0, n_theta - 1):
            side_sign = 1.0 if side_idx == 0 else -1.0  # +1 = left panel (outer x > 0), -1 = right panel (outer x < 0)
            rail_rows = []
            for zi in open_zis:
                v_edge = torso_grid[zi][side_idx].co
                c_z = torso_centers[zi]
                out_dir = Vector((v_edge.x - c_z.x, v_edge.y - c_z.y, 0.0)).normalized()
                in_gap = Vector((-side_sign, -0.20, 0.0)).normalized()
                p_tape_out = v_edge - out_dir * 0.0005 - in_gap * 0.0025
                p_rail_base = v_edge + out_dir * 0.0008 + in_gap * 0.0018
                p_rail_front = p_rail_base + out_dir * 0.0022 + in_gap * 0.0016
                p_rail_inner = p_rail_base - out_dir * 0.0008 + in_gap * 0.0020
                rail_rows.append((
                    bm.verts.new(p_tape_out),
                    bm.verts.new(p_rail_base),
                    bm.verts.new(p_rail_front),
                    bm.verts.new(p_rail_inner),
                ))
            for r in range(len(rail_rows) - 1):
                a0, a1, a2, a3 = rail_rows[r]
                b0, b1, b2, b3 = rail_rows[r + 1]
                if side_idx == 0:
                    f_tape = bm.faces.new((a0, b0, b1, a1))
                    f_r1 = bm.faces.new((a1, b1, b2, a2))
                    f_r2 = bm.faces.new((a2, b2, b3, a3))
                else:
                    f_tape = bm.faces.new((a0, a1, b1, b0))
                    f_r1 = bm.faces.new((a1, a2, b2, b1))
                    f_r2 = bm.faces.new((a2, a3, b3, b2))
                zip_tape_faces.append(f_tape)
                zip_rail_faces.extend([f_r1, f_r2])
                open_rail_check_normals.extend([f_tape, f_r1, f_r2])

    # 3. Red Metallic Zip Slider + Pull Tab at split point (or bottom box when open_full)
    if closed_rows_rail:
        slider_anchor = 0.5 * (closed_rows_rail[-1][1].co + closed_rows_rail[-1][2].co) + Vector((0.0, -0.0025, 0.0))
    else:
        v_bot_r = torso_grid[open_zis[0]][n_theta - 1].co
        slider_anchor = v_bot_r + Vector((0.0015, -0.0032, 0.004))

    slider_faces = []
    slider_mat_loc = Matrix.Translation(slider_anchor)
    res_sl = bmesh.ops.create_cube(bm, size=1.0)
    for v in res_sl["verts"]:
        v.co = slider_mat_loc @ Vector((v.co.x * 0.0095, v.co.y * 0.0060, v.co.z * 0.0135))
        for f in v.link_faces:
            if f not in slider_faces:
                slider_faces.append(f)
    zip_metal_faces.extend(slider_faces)
    bmesh.ops.recalc_face_normals(bm, faces=slider_faces)

    pull_faces = []
    pull_mat_loc = Matrix.Translation(slider_anchor + Vector((0.0, -0.0045, -0.013))) @ Matrix.Rotation(-0.18, 4, "X")
    res_pl = bmesh.ops.create_cube(bm, size=1.0)
    for v in res_pl["verts"]:
        v.co = pull_mat_loc @ Vector((v.co.x * 0.0068, v.co.y * 0.0024, v.co.z * 0.0175))
        for f in v.link_faces:
            if f not in pull_faces:
                pull_faces.append(f)
    zip_metal_faces.extend(pull_faces)
    bmesh.ops.recalc_face_normals(bm, faces=pull_faces)

    # Orient all faces deterministically outward
    bm.normal_update()
    for f in torso_shell_faces:
        fc = f.calc_center_median()
        c_t = slice_centroid_z(verts_torso, fc.z, tol=0.03, fallback=Vector((0.0022, -0.010, fc.z)))
        rad = Vector((fc.x - c_t.x, fc.y - c_t.y, 0.03 if fc.z > 1.445 else 0.0))
        if rad.length > 1e-6 and rad.dot(f.normal) < 0.0:
            f.normal_flip()
    for f, side_sign in placket_return_faces:
        if Vector((-side_sign, -0.25, 0.0)).dot(f.normal) < 0.0:
            f.normal_flip()
    for f in hem_return_faces:
        if f.normal.z > 0.0:
            f.normal_flip()
    for side in (1, -1):
        for f, c_seg in sleeve_shell_faces[side]:
            fc = f.calc_center_median()
            rad = Vector((0.0, fc.y - c_seg.y, fc.z - c_seg.z))
            if rad.length > 1e-6 and rad.dot(f.normal) < 0.0:
                f.normal_flip()
        for f in cuff_return_faces[side]:
            if f.normal.x * side < 0.0:
                f.normal_flip()
        for f, c_hole, is_return in armhole_band_faces[side]:
            fc = f.calc_center_median()
            out_dir = Vector((side * 0.65, (fc.y - c_hole.y) * 0.5, (fc.z - c_hole.z) * 0.5))
            if is_return:
                out_dir = -out_dir
            if out_dir.length > 1e-6 and out_dir.dot(f.normal) < 0.0:
                f.normal_flip()
    for f in pocket_front_faces:
        fc = f.calc_center_median()
        c_t = slice_centroid_z(verts_torso, fc.z, tol=0.03, fallback=Vector((0.0022, -0.010, fc.z)))
        rad = Vector((fc.x - c_t.x, fc.y - c_t.y, 0.0))
        if rad.length > 1e-6 and rad.dot(f.normal) < 0.0:
            f.normal_flip()
    for f, kind, side in pocket_seam_faces:
        if kind == "top" and f.normal.z < 0.0:
            f.normal_flip()
        elif kind == "bot" and f.normal.z > 0.0:
            f.normal_flip()
        elif kind == "in" and Vector((-side, -0.35, 0.0)).dot(f.normal) < 0.0:
            f.normal_flip()
    for f in open_rail_check_normals:
        fc = f.calc_center_median()
        c_t = slice_centroid_z(verts_torso, fc.z, tol=0.03, fallback=Vector((0.0022, -0.010, fc.z)))
        rad = Vector((fc.x - c_t.x, fc.y - c_t.y, 0.0))
        if rad.length > 1e-6 and rad.dot(f.normal) < 0.0:
            f.normal_flip()

    # Closed zip faces point -Y
    open_rail_set = set(open_rail_check_normals)
    slider_pull_set = set(slider_faces) | set(pull_faces)
    for f in (set(zip_tape_faces) | set(zip_rail_faces)) - open_rail_set - slider_pull_set:
        if f.normal.y > 0.0:
            f.normal_flip()

    hood_face_set = set(hood_faces)
    for f in bm.faces:
        if f in hood_face_set:
            for loop in f.loops:
                co = loop.vert.co
                loop[uv_layer].uv = (co.x * 3.2 + 0.5, co.z * 2.5)
            continue
        for loop in f.loops:
            co = loop.vert.co
            if include_sleeves and abs(co.x) > 0.165:
                ang = math.atan2(co.z - 1.42, co.y)
                loop[uv_layer].uv = ((ang / (2.0 * math.pi) + 0.5) * 1.4, abs(co.x) * 2.2)
            else:
                ang = math.atan2(co.y, co.x)
                loop[uv_layer].uv = ((ang / (2.0 * math.pi) + 0.5) * 1.8, co.z * 2.2)

    hem_set = set(hem_faces)
    cuff_set = set(cuff_faces)
    lining_set = set(lining_faces) | {f for f, _ in placket_return_faces}
    tape_set = set(zip_tape_faces) | set(pocket_trim_faces)
    rail_set = set(zip_rail_faces)
    metal_set = set(zip_metal_faces)

    for f in bm.faces:
        if f in metal_set:
            f.material_index = 5
        elif f in rail_set:
            f.material_index = 4
        elif f in tape_set:
            f.material_index = 3
        elif f in lining_set:
            f.material_index = 2
        elif f in hem_set or f in cuff_set:
            f.material_index = 1
        else:
            f.material_index = 0

    zi_eye = min(range(n_rings), key=lambda i: abs(zs[i] - 1.448))
    p_eye_r = torso_grid[zi_eye][-2].co.copy()
    p_eye_l = torso_grid[zi_eye][1].co.copy()

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for m in (mat_fleece, mat_rib, mat_lining, mat_zip_tape, mat_zip_rail, mat_zip_metal):
        obj.data.materials.append(m)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        if include_sleeves and v.co.x > 0.165 and v.co.z > 1.30:
            c_a = slice_centroid_x(verts_left_arm, v.co.x, tol=0.03)
            clr_a = 0.0110 if v.co.x < 0.25 else 0.0055
            v.co = ensure_radial_clearance(v.co, c_a, bvh_left_arm, clr_a, max_r=0.11)
        elif include_sleeves and v.co.x < -0.165 and v.co.z > 1.30:
            c_a = slice_centroid_x(verts_right_arm, v.co.x, tol=0.03)
            clr_a = 0.0110 if v.co.x > -0.25 else 0.0055
            v.co = ensure_radial_clearance(v.co, c_a, bvh_right_arm, clr_a, max_r=0.11)
        else:
            c_t = slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.01, v.co.z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_t.x, c_t.y)), bvh_torso, 0.0065, max_r=0.22)
            if v.co.z >= 1.38 and abs(v.co.x) > 0.08:
                v.co = ensure_3d_surface_clearance(v.co, bvh_torso, 0.0075, max_dist=0.025)
                if include_sleeves:
                    b_arm = bvh_left_arm if v.co.x > 0 else bvh_right_arm
                    v.co = ensure_3d_surface_clearance(v.co, b_arm, 0.0075, max_dist=0.025)

    # Anchor hood cord eyelets dynamically to the collar front lapel corners
    cords_obj = build_drawstrings(
        f"{name}_hood_cords",
        bvh_torso,
        verts_torso,
        eyelets=[
            (p_eye_r.x, p_eye_r.y - 0.004, p_eye_r.z),
            (p_eye_l.x, p_eye_l.y - 0.004, p_eye_l.z),
        ],
        z_end=1.320 if z_hem_bot > 1.10 else 1.305,
        mat_cord=mat_cord,
        mat_aglet=mat_zip_metal,
        extra_y=-0.016,
    )
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    cords_obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.join()

    return obj


HOODIE_CUTS = [
    {
        "cut_id": "hoodie",
        "name": "lara_hoodie_zip",
        "z_hem_bot": 0.960,
        "z_hem_top": 1.015,
        "n_body_z": 30,
        "include_sleeves": True,
        "include_pockets": True,
        "tank_armhole": False,
    },
    {
        "cut_id": "hoodie-crop",
        "name": "lara_hoodie_crop",
        "z_hem_bot": 1.185,
        "z_hem_top": 1.225,
        "n_body_z": 22,
        "include_sleeves": True,
        "include_pockets": False,
        "tank_armhole": False,
    },
    {
        "cut_id": "hoodie-tank",
        "name": "lara_hoodie_tank",
        "z_hem_bot": 0.960,
        "z_hem_top": 1.015,
        "n_body_z": 30,
        "include_sleeves": False,
        "include_pockets": True,
        "tank_armhole": True,
    },
    {
        "cut_id": "hoodie-crop-tank",
        "name": "lara_hoodie_crop_tank",
        "z_hem_bot": 1.185,
        "z_hem_top": 1.225,
        "n_body_z": 22,
        "include_sleeves": False,
        "include_pockets": False,
        "tank_armhole": True,
    },
]


def generate_hoodies(bvhs, mats, armature, only_ids: set[str] | None = None):
    donor_torso_only = [
        bpy.data.objects["body_nude_torso"],
        bpy.data.objects["body_nude_panties"],
    ]
    donor_arms_only = [
        bpy.data.objects["arms"],
    ]
    donor_top = donor_torso_only + donor_arms_only

    for cut in HOODIE_CUTS:
        for zip_key, zip_frac in ZIP_OPENING_FRACS.items():
            variant_id = f"{cut['cut_id']}_{zip_key}"
            if only_ids is not None and variant_id not in only_ids and cut["cut_id"] not in only_ids:
                continue

            suffix = "" if zip_key == "closed" else f"_{zip_key}"
            mesh_name = f"{cut['name']}{suffix}"
            rel_out = f"hoodies/{mesh_name}.glb"

            garment = build_zip_hoodie(
                name=mesh_name,
                bvh_torso=bvhs["bvh_torso"],
                verts_torso=bvhs["verts_torso"],
                bvh_left_arm=bvhs["bvh_left_arm"],
                verts_left_arm=bvhs["verts_left_arm"],
                bvh_right_arm=bvhs["bvh_right_arm"],
                verts_right_arm=bvhs["verts_right_arm"],
                mat_fleece=mats["fleece"],
                mat_rib=mats["rib"],
                mat_lining=mats["lining"],
                mat_zip_tape=mats["zip_tape"],
                mat_zip_rail=mats["zip_plastic_red"],
                mat_zip_metal=mats["zip_metal_red"],
                mat_cord=mats["cord"],
                z_hem_bot=cut["z_hem_bot"],
                z_hem_top=cut["z_hem_top"],
                n_body_z=cut["n_body_z"],
                include_sleeves=cut["include_sleeves"],
                include_pockets=cut["include_pockets"],
                tank_armhole=cut["tank_armhole"],
                zip_open_frac=zip_frac,
            )
            if cut["include_sleeves"]:
                donor_sel = donor_top
                region_sel = lambda vco: donor_arms_only if (abs(vco.x) > 0.145 and vco.z > 1.325) else donor_torso_only
            else:
                donor_sel = donor_torso_only
                region_sel = None
            bind_and_transfer_weights(
                garment,
                donor_sel,
                armature,
                bone_attenuation={"breast_left_base": 0.45, "breast_right_base": 0.45},
                smooth_passes=1,
                region_selector=region_sel,
            )
            export_garment_glb([garment], armature, rel_out)
