"""Nightwear / dress generators for Lara:
- Tank nightgown / chemise (lara_nightgown_tank.glb)
- Long oversized T-shirt nightgown (lara_nightgown_tshirt.glb)
"""

import math
import bpy
import bmesh
from mathutils import Vector
from mathutils.geometry import convex_hull_2d

from .geometry import (
    add_tucked_edge,
    bridge_convex_radii,
    ensure_radial_clearance,
    ensure_z_plane_clearance,
    radial_surface_radius,
    slice_centroid_x,
    slice_centroid_z,
    smooth_ring_radii,
)
from .rigging import bind_and_transfer_weights, export_garment_glb


def _ray_convex_hull_radii(
    verts_pelvis,
    center: Vector,
    z: float,
    n_theta: int,
    tol: float = 0.028,
) -> list[float]:
    """Compute exact radial distance around center to the 2D convex hull of pelvis+legs at height z."""
    pts_2d = [Vector((v.x, v.y)) for v in verts_pelvis if abs(v.z - z) <= tol]
    if len(pts_2d) < 4:
        return [0.14] * n_theta

    hull_indices = convex_hull_2d(pts_2d)
    hull = [pts_2d[i] for i in hull_indices]
    n_h = len(hull)
    if n_h < 3:
        return [0.14] * n_theta

    c2 = Vector((center.x, center.y))
    radii = []
    for j in range(n_theta):
        th = -0.5 * math.pi + (j / n_theta) * 2.0 * math.pi
        d2 = Vector((math.cos(th), math.sin(th)))
        best_t = 0.0
        for hi in range(n_h):
            a = hull[hi]
            b = hull[(hi + 1) % n_h]
            e = b - a
            denom = e.x * d2.y - e.y * d2.x
            if abs(denom) < 1e-8:
                continue
            w = a - c2
            t = (e.x * w.y - e.y * w.x) / denom
            u = (d2.x * w.y - d2.y * w.x) / denom
            if t > 0.0 and -1e-4 <= u <= 1.0001:
                if t > best_t:
                    best_t = t
        radii.append(best_t if best_t > 0.02 else 0.14)
    return radii


def _build_skirt_rings(
    bvh_torso,
    verts_torso,
    bvh_pelvis,
    verts_pelvis,
    zs: list[float],
    n_theta: int,
    waist_ease: float,
    skirt_clr: float,
    a_line_flare: float,
    hem_wave: float,
):
    """Build smooth torso + draped skirt radii from z_hem up to z_collar without inter-thigh dipping."""
    z_hem = zs[0]
    z_hip_ref = 0.960
    c_hip_ref = slice_centroid_z(verts_pelvis, z_hip_ref, tol=0.028, fallback=Vector((0.0022, -0.006, z_hip_ref)))
    hip_ref_radii = _ray_convex_hull_radii(verts_pelvis, c_hip_ref, z_hip_ref, n_theta, tol=0.030)
    hip_ref_radii = smooth_ring_radii(hip_ref_radii, passes=2)

    ring_data = []
    for zi, z in enumerate(zs):
        verts_src = verts_torso if z >= 1.06 else verts_pelvis
        bvh_src = bvh_torso if z >= 1.06 else bvh_pelvis
        c = slice_centroid_z(verts_src, z, tol=0.028, fallback=Vector((0.0022, -0.008, z)))
        thetas = [-0.5 * math.pi + (j / n_theta) * 2.0 * math.pi for j in range(n_theta)]
        dirs = [Vector((math.cos(th), math.sin(th), 0.0)) for th in thetas]

        if z < 0.965:
            # Blend smoothly toward fixed hip/pelvis centroid so skirt hangs plumb vertically
            t_hang = min(1.0, (0.965 - z) / max(1e-4, 0.965 - z_hem))
            c = c.lerp(Vector((c_hip_ref.x, c_hip_ref.y, z)), 0.72 * t_hang)
            radii_hull = _ray_convex_hull_radii(verts_pelvis, c, z, n_theta, tol=0.030)
            radii_hull = smooth_ring_radii(radii_hull, passes=2)
            radii = []
            for j in range(n_theta):
                wave = hem_wave * math.sin(thetas[j] * 6.0) * (t_hang ** 1.4)
                drape_r = hip_ref_radii[j] * (1.0 - 0.10 * t_hang) + a_line_flare * (t_hang ** 0.95) + wave
                r_req = radii_hull[j] + skirt_clr + 0.004 * t_hang
                radii.append(max(r_req, drape_r))
            radii = smooth_ring_radii(radii, passes=2)
        else:
            radii = [radial_surface_radius(bvh_src, c, dirs[j], max_r=0.22) for j in range(n_theta)]
            radii = bridge_convex_radii(radii, max_dip=0.0014, passes=5)
            radii = smooth_ring_radii(radii, passes=2)
            # Keep raw pelvis/hip surface strictly outside smooth interpolation
            if z < 1.04:
                raw_r = [radial_surface_radius(bvh_src, c, dirs[j], max_r=0.22) for j in range(n_theta)]
                radii = [max(radii[j], raw_r[j] + 0.0018) for j in range(n_theta)]
            if z < 1.24 and waist_ease > 0.0:
                t_waist = 1.0 - min(1.0, abs(z - 1.12) / 0.16)
                radii = [r + waist_ease * (0.45 + 0.55 * t_waist) for r in radii]

        ring_data.append((z, c, thetas, dirs, radii))
    return ring_data


def build_nightgown_tank(name: str, bvhs, mat_fine_rib):
    bvh_torso = bvhs["bvh_torso"]
    verts_torso = bvhs["verts_torso"]
    bvh_pelvis = bvhs["bvh_pelvis"]
    verts_pelvis = bvhs["verts_pelvis"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    z_hem = 0.735
    z_collar = 1.466
    n_theta = 52
    n_rings = 38
    zs = [z_hem + (z_collar - z_hem) * (i / (n_rings - 1)) for i in range(n_rings)]

    ring_data = _build_skirt_rings(
        bvh_torso,
        verts_torso,
        bvh_pelvis,
        verts_pelvis,
        zs,
        n_theta,
        waist_ease=0.005,
        skirt_clr=0.0075,
        a_line_flare=0.022,
        hem_wave=0.0035,
    )

    grid = []
    centers = []
    for zi, (z, c, thetas, dirs, radii) in enumerate(ring_data):
        centers.append(c)
        rv = []
        for j in range(n_theta):
            th = thetas[j]
            r_eff = radii[j]
            if z >= 1.425:
                t_up = min(1.0, max(0.0, (z - 1.425) / max(1e-5, z_collar - 1.425)))
                max_lat = 0.106 - 0.044 * (t_up ** 0.75)
                lat_w = abs(math.cos(th))
                if lat_w > 0.25 and r_eff * lat_w > max_lat:
                    r_eff = max_lat / lat_w

            z_mod = z
            if zi >= n_rings - 7:
                t_top = (zi - (n_rings - 7)) / 6.0
                front_scoop = 0.112 * max(0.0, -math.sin(th)) ** 1.5
                back_scoop = 0.088 * max(0.0, math.sin(th)) ** 1.4
                z_mod = z - t_top * (front_scoop + back_scoop)

            if z >= 1.00:
                c_m = slice_centroid_z(verts_torso, z_mod, tol=0.028, fallback=Vector((c.x, c.y, z_mod)))
                if z_mod < 1.425 and zi >= n_rings - 7:
                    r_m = radial_surface_radius(bvh_torso, c_m, dirs[j], max_r=0.22)
                    r_eff = 0.60 * r_m + 0.40 * r_eff
                clr = 0.0046 if z_mod < 1.425 else 0.0038
                p = c_m + dirs[j] * (r_eff + clr)
                if z_mod < 1.425:
                    p = ensure_z_plane_clearance(p, Vector((c_m.x, c_m.y)), bvh_torso, 0.0040, max_r=0.22)
            else:
                p = Vector((c.x + dirs[j].x * r_eff, c.y + dirs[j].y * r_eff, z_mod))
            rv.append(bm.verts.new(p))
        grid.append(rv)

    zi_arm_bot = min(range(n_rings), key=lambda i: abs(zs[i] - 1.292))
    zi_arm_top = min(n_rings - 2, min(range(n_rings), key=lambda i: abs(zs[i] - 1.456)))
    j_l_mid = n_theta // 4
    j_r_mid = (3 * n_theta) // 4
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
        for j in range(n_theta):
            if _in_armhole(zi, j):
                continue
            jn = (j + 1) % n_theta
            bm.faces.new((grid[zi][j], grid[zi][jn], grid[zi + 1][jn], grid[zi + 1][j]))

    add_tucked_edge(bm, grid[0], centers[0], 0.0028, Vector((0.0, 0.0, 0.006)))
    add_tucked_edge(bm, grid[-1], centers[-1], 0.0032, Vector((0.0, 0.0, -0.005)))

    for side, (z0, z1, j0, j1) in arm_windows.items():
        hole_verts = []
        for j in range(j0, j1):
            hole_verts.append(grid[z0][j])
        for zi in range(z0, z1):
            hole_verts.append(grid[zi][j1])
        for j in range(j1, j0, -1):
            hole_verts.append(grid[z1][j])
        for zi in range(z1, z0, -1):
            hole_verts.append(grid[zi][j0])
        c_hole = sum((v.co for v in hole_verts), Vector()) / len(hole_verts)
        rim = []
        for v in hole_verts:
            in_h = (c_hole - v.co).normalized()
            c_ref = slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.01, v.co.z)))
            out_r = Vector((v.co.x - c_ref.x, v.co.y - c_ref.y, 0.0)).normalized()
            rim.append(bm.verts.new(v.co - out_r * 0.0022 + in_h * 0.0055))
        n_sl = len(hole_verts)
        for k in range(n_sl):
            kn = (k + 1) % n_sl
            if side == 1:
                bm.faces.new((hole_verts[k], hole_verts[kn], rim[kn], rim[k]))
            else:
                bm.faces.new((hole_verts[k], rim[k], rim[kn], hole_verts[kn]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 0
        for loop in f.loops:
            co = loop.vert.co
            ang = math.atan2(co.y, co.x)
            loop[uv_layer].uv = ((ang / (2.0 * math.pi) + 0.5) * 2.2, co.z * 2.4)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_fine_rib)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        if 1.00 <= v.co.z < 1.420:
            c_t = slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.01, v.co.z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_t.x, c_t.y)), bvh_torso, 0.0044, max_r=0.22)
        elif 0.93 <= v.co.z < 1.00:
            c_p = slice_centroid_z(verts_pelvis, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.006, v.co.z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_p.x, c_p.y)), bvh_pelvis, 0.0052, max_r=0.24)

    return obj


def build_nightgown_tshirt(name: str, bvhs, mat_jersey, mat_rib):
    bvh_torso = bvhs["bvh_torso"]
    verts_torso = bvhs["verts_torso"]
    bvh_pelvis = bvhs["bvh_pelvis"]
    verts_pelvis = bvhs["verts_pelvis"]
    bvh_left_arm = bvhs["bvh_left_arm"]
    verts_left_arm = bvhs["verts_left_arm"]
    bvh_right_arm = bvhs["bvh_right_arm"]
    verts_right_arm = bvhs["verts_right_arm"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    z_hem = 0.720
    z_collar = 1.474
    n_theta = 52
    n_rings = 40
    zs = [z_hem + (z_collar - z_hem) * (i / (n_rings - 1)) for i in range(n_rings)]

    ring_data = _build_skirt_rings(
        bvh_torso,
        verts_torso,
        bvh_pelvis,
        verts_pelvis,
        zs,
        n_theta,
        waist_ease=0.014,
        skirt_clr=0.011,
        a_line_flare=0.028,
        hem_wave=0.0045,
    )

    grid = []
    centers = []
    for zi, (z, c, thetas, dirs, radii) in enumerate(ring_data):
        centers.append(c)
        rv = []
        for j in range(n_theta):
            th = thetas[j]
            z_mod = z
            if zi >= n_rings - 5:
                t_top = (zi - (n_rings - 5)) / 4.0
                front_dip = 0.056 * max(0.0, -math.sin(th)) ** 1.6
                z_mod = z - t_top * front_dip

            if z >= 1.00:
                c_m = slice_centroid_z(verts_torso, z_mod, tol=0.028, fallback=Vector((c.x, c.y, z_mod)))
                r_eff = radial_surface_radius(bvh_torso, c_m, dirs[j], max_r=0.22) if zi >= n_rings - 5 else radii[j]
                if z_mod < 1.24:
                    clr = 0.0085 + 0.0025 * (math.sin(th * 2.0) ** 2)
                elif z_mod < 1.40:
                    clr = 0.0072
                else:
                    clr = 0.0060 + 0.0035 * (math.cos(th) ** 2)
                p = ensure_z_plane_clearance(c_m + dirs[j] * (r_eff + clr), Vector((c_m.x, c_m.y)), bvh_torso, 0.0052, max_r=0.22)
            else:
                p = Vector((c.x + dirs[j].x * radii[j], c.y + dirs[j].y * radii[j], z_mod))
            rv.append(bm.verts.new(p))
        grid.append(rv)

    zi_arm_bot = min(range(n_rings), key=lambda i: abs(zs[i] - 1.335))
    zi_arm_top = min(n_rings - 2, min(range(n_rings), key=lambda i: abs(zs[i] - 1.462)))
    j_l_mid = n_theta // 4
    j_r_mid = (3 * n_theta) // 4
    arm_windows = {
        1: (zi_arm_bot, zi_arm_top, j_l_mid - 3, j_l_mid + 3),
        -1: (zi_arm_bot, zi_arm_top, j_r_mid - 3, j_r_mid + 3),
    }

    def _in_armhole(zi, j):
        for z0, z1, j0, j1 in arm_windows.values():
            if z0 <= zi < z1 and j0 <= j < j1:
                return True
        return False

    collar_faces = set()
    for zi in range(n_rings - 1):
        for j in range(n_theta):
            if _in_armhole(zi, j):
                continue
            jn = (j + 1) % n_theta
            f = bm.faces.new((grid[zi][j], grid[zi][jn], grid[zi + 1][jn], grid[zi + 1][j]))
            if zi >= n_rings - 3:
                collar_faces.add(f)

    add_tucked_edge(bm, grid[0], centers[0], 0.0040, Vector((0.0, 0.0, 0.007)))
    collar_ret = add_tucked_edge(bm, grid[-1], centers[-1], 0.0036, Vector((0.0, 0.0, -0.006)))

    arm_data = {
        1: (bvh_left_arm, verts_left_arm),
        -1: (bvh_right_arm, verts_right_arm),
    }
    for side, (z0, z1, j0, j1) in arm_windows.items():
        bvh_arm, verts_arm = arm_data[side]
        hole_verts = []
        for j in range(j0, j1):
            hole_verts.append(grid[z0][j])
        for zi in range(z0, z1):
            hole_verts.append(grid[zi][j1])
        for j in range(j1, j0, -1):
            hole_verts.append(grid[z1][j])
        for zi in range(z1, z0, -1):
            hole_verts.append(grid[zi][j0])
        n_sl = len(hole_verts)
        x_start = sum(v.co.x for v in hole_verts) / n_sl
        c_sh = slice_centroid_x(verts_arm, x_start, tol=0.03)
        x_end = side * 0.285
        hole_angles = [math.atan2(v.co.z - c_sh.z, v.co.y - c_sh.y) for v in hole_verts]

        n_sl_steps = 8
        sleeve_rings = [hole_verts]
        for si in range(1, n_sl_steps + 1):
            x = x_start + (x_end - x_start) * (si / n_sl_steps)
            c_arm = slice_centroid_x(verts_arm, x, tol=0.025)
            t_arm = si / n_sl_steps
            rv = []
            for k in range(n_sl):
                ang = hole_angles[k]
                d = Vector((0.0, math.cos(ang), math.sin(ang)))
                r = radial_surface_radius(bvh_arm, c_arm, d, max_r=0.11)
                clr = 0.0095 + 0.0040 * max(0.0, -math.sin(ang)) + 0.0025 * (1.0 - t_arm)
                p = c_arm + d * (r + clr)
                if si < 2:
                    p = hole_verts[k].co.lerp(p, 0.65 if si == 0 else 0.88)
                    p.x = x
                    p = ensure_radial_clearance(p, c_arm, bvh_arm, 0.0085, max_r=0.11)
                rv.append(bm.verts.new(p))
            sleeve_rings.append(rv)

        for si in range(len(sleeve_rings) - 1):
            r0 = sleeve_rings[si]
            r1 = sleeve_rings[si + 1]
            for k in range(n_sl):
                kn = (k + 1) % n_sl
                if side == 1:
                    bm.faces.new((r0[k], r0[kn], r1[kn], r1[k]))
                else:
                    bm.faces.new((r0[k], r1[k], r1[kn], r0[kn]))

        end_ring = sleeve_rings[-1]
        c_end = slice_centroid_x(verts_arm, x_end, tol=0.025)
        inner_end = []
        for v in end_ring:
            d_in = Vector((0.0, v.co.y - c_end.y, v.co.z - c_end.z)).normalized()
            inner_end.append(bm.verts.new(v.co - d_in * 0.0035 + Vector((-side * 0.006, 0.0, 0.0))))
        for k in range(n_sl):
            kn = (k + 1) % n_sl
            if side == 1:
                bm.faces.new((end_ring[k], end_ring[kn], inner_end[kn], inner_end[k]))
            else:
                bm.faces.new((end_ring[k], inner_end[k], inner_end[kn], end_ring[kn]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.material_index = 1 if (f in collar_faces or any(v in collar_ret for v in f.verts)) else 0
        for loop in f.loops:
            co = loop.vert.co
            if abs(co.x) > 0.165:
                ang = math.atan2(co.z - 1.42, co.y)
                loop[uv_layer].uv = ((ang / (2.0 * math.pi) + 0.5) * 1.4, abs(co.x) * 2.2)
            else:
                ang = math.atan2(co.y, co.x)
                loop[uv_layer].uv = ((ang / (2.0 * math.pi) + 0.5) * 1.8, co.z * 2.2)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_jersey)
    obj.data.materials.append(mat_rib)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        if v.co.x > 0.165 and v.co.z > 1.30:
            c_a = slice_centroid_x(verts_left_arm, v.co.x, tol=0.03)
            v.co = ensure_radial_clearance(v.co, c_a, bvh_left_arm, 0.0062, max_r=0.11)
        elif v.co.x < -0.165 and v.co.z > 1.30:
            c_a = slice_centroid_x(verts_right_arm, v.co.x, tol=0.03)
            v.co = ensure_radial_clearance(v.co, c_a, bvh_right_arm, 0.0062, max_r=0.11)
        elif v.co.z >= 1.00:
            c_t = slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.01, v.co.z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_t.x, c_t.y)), bvh_torso, 0.0048, max_r=0.22)

    return obj


def generate_dresses(bvhs, mats, armature, only_ids: set[str] | None = None):
    donor_torso_only = [
        bpy.data.objects["body_nude_torso"],
        bpy.data.objects["body_nude_panties"],
    ]
    donor_legs_only = [
        bpy.data.objects["body_nude_legs"],
        bpy.data.objects["body_nude_panties"],
    ]
    donor_arms_only = [
        bpy.data.objects["arms"],
    ]
    donor_tank_dress = donor_torso_only + donor_legs_only
    donor_tshirt_dress = donor_tank_dress + donor_arms_only

    if only_ids is None or "nightgown-tank" in only_ids:
        gown_tank = build_nightgown_tank("lara_nightgown_tank", bvhs, mats["fine_rib"])
        bind_and_transfer_weights(
            gown_tank,
            donor_tank_dress,
            armature,
            bone_attenuation={"breast_left_base": 0.65, "breast_right_base": 0.65},
            smooth_passes=4,
            region_selector=lambda vco: donor_legs_only if vco.z < 0.96 else donor_torso_only,
        )
        export_garment_glb([gown_tank], armature, "dresses/lara_nightgown_tank.glb")

    if only_ids is None or "nightgown-tshirt" in only_ids:
        gown_tee = build_nightgown_tshirt("lara_nightgown_tshirt", bvhs, mats["jersey"], mats["fine_rib"])
        bind_and_transfer_weights(
            gown_tee,
            donor_tshirt_dress,
            armature,
            bone_attenuation={"breast_left_base": 0.55, "breast_right_base": 0.55},
            smooth_passes=4,
            region_selector=lambda vco: (
                donor_arms_only
                if (abs(vco.x) > 0.145 and vco.z > 1.325)
                else (donor_legs_only if vco.z < 0.96 else donor_torso_only)
            ),
        )
        export_garment_glb([gown_tee], armature, "dresses/lara_nightgown_tshirt.glb")
