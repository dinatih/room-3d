"""Everyday top generators for Lara:
- Fine ribbed fitted tank top (lara_tank_rib.glb)
- Fitted cotton jersey t-shirt (lara_tshirt.glb)
"""

import math
import bpy
import bmesh
from mathutils import Vector

from .geometry import (
    add_tucked_edge,
    bridge_convex_radii,
    ensure_3d_surface_clearance,
    ensure_radial_clearance,
    ensure_z_plane_clearance,
    radial_surface_radius,
    slice_centroid_x,
    slice_centroid_z,
    smooth_ring_radii,
)
from .rigging import bind_and_transfer_weights, export_garment_glb


def build_tank_rib(name: str, bvhs, mat_fine_rib):
    bvh_torso = bvhs["bvh_torso"]
    verts_torso = bvhs["verts_torso"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    z_hem = 1.005
    z_collar = 1.466
    n_theta = 52
    n_rings = 28
    zs = [z_hem + (z_collar - z_hem) * (i / (n_rings - 1)) for i in range(n_rings)]

    grid = []
    centers = []
    for zi, z in enumerate(zs):
        c = slice_centroid_z(verts_torso, z, tol=0.028, fallback=Vector((0.0022, -0.010, z)))
        centers.append(c)
        radii = []
        dirs = []
        thetas = []
        for j in range(n_theta):
            th = -0.5 * math.pi + (j / n_theta) * 2.0 * math.pi
            d = Vector((math.cos(th), math.sin(th), 0.0))
            radii.append(radial_surface_radius(bvh_torso, c, d, max_r=0.22))
            dirs.append(d)
            thetas.append(th)
        radii = bridge_convex_radii(radii, max_dip=0.0014, passes=5)
        radii = smooth_ring_radii(radii, passes=2)

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

            # Scooped front & racerback neckline curve in upper rings
            z_mod = z
            if zi >= n_rings - 7:
                t_top = (zi - (n_rings - 7)) / 6.0
                front_scoop = 0.105 * max(0.0, -math.sin(th)) ** 1.5
                back_scoop = 0.080 * max(0.0, math.sin(th)) ** 1.4
                z_mod = z - t_top * (front_scoop + back_scoop)

            c_m = slice_centroid_z(verts_torso, z_mod, tol=0.028, fallback=Vector((c.x, c.y, z_mod)))
            if z_mod < 1.425:
                r_m = radial_surface_radius(bvh_torso, c_m, dirs[j], max_r=0.22)
                r_eff = 0.60 * r_m + 0.40 * r_eff if zi >= n_rings - 7 else r_eff

            clr = 0.0040 if z_mod < 1.425 else 0.0036
            p = c_m + dirs[j] * (r_eff + clr)
            if z_mod < 1.425:
                p = ensure_z_plane_clearance(p, Vector((c_m.x, c_m.y)), bvh_torso, 0.0036, max_r=0.22)
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

    add_tucked_edge(bm, grid[0], centers[0], 0.0022, Vector((0.0, 0.0, 0.005)))
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
            p_r = v.co - out_r * 0.0022 + in_h * 0.0055
            rim.append(bm.verts.new(p_r))
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
        if v.co.z < 1.420:
            c_t = slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.01, v.co.z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_t.x, c_t.y)), bvh_torso, 0.0044, max_r=0.22)
        v.co = ensure_3d_surface_clearance(v.co, bvh_torso, 0.0042, max_dist=0.025)

    return obj


def build_tshirt(name: str, bvhs, mat_jersey, mat_rib):
    bvh_torso = bvhs["bvh_torso"]
    verts_torso = bvhs["verts_torso"]
    bvh_left_arm = bvhs["bvh_left_arm"]
    verts_left_arm = bvhs["verts_left_arm"]
    bvh_right_arm = bvhs["bvh_right_arm"]
    verts_right_arm = bvhs["verts_right_arm"]

    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    z_hem = 0.992
    z_collar = 1.474
    n_theta = 52
    n_rings = 28
    zs = [z_hem + (z_collar - z_hem) * (i / (n_rings - 1)) for i in range(n_rings)]

    grid = []
    centers = []
    for zi, z in enumerate(zs):
        c = slice_centroid_z(verts_torso, z, tol=0.028, fallback=Vector((0.0022, -0.010, z)))
        centers.append(c)
        radii = []
        dirs = []
        thetas = []
        for j in range(n_theta):
            th = -0.5 * math.pi + (j / n_theta) * 2.0 * math.pi
            d = Vector((math.cos(th), math.sin(th), 0.0))
            radii.append(radial_surface_radius(bvh_torso, c, d, max_r=0.22))
            dirs.append(d)
            thetas.append(th)
        radii = bridge_convex_radii(radii, max_dip=0.0016, passes=6)
        radii = smooth_ring_radii(radii, passes=2)

        rv = []
        for j in range(n_theta):
            th = thetas[j]
            z_mod = z
            if zi >= n_rings - 5:
                t_top = (zi - (n_rings - 5)) / 4.0
                # Crew-neck front dip (~5 cm below back collar)
                front_dip = 0.052 * max(0.0, -math.sin(th)) ** 1.6
                z_mod = z - t_top * front_dip
            c_m = slice_centroid_z(verts_torso, z_mod, tol=0.028, fallback=Vector((c.x, c.y, z_mod)))
            r_eff = radial_surface_radius(bvh_torso, c_m, dirs[j], max_r=0.22) if zi >= n_rings - 5 else radii[j]
            if z_mod < 1.24:
                clr = 0.0075 + 0.0025 * (math.sin(th * 2.0) ** 2)
            elif z_mod < 1.40:
                clr = 0.0062
            else:
                clr = 0.0055 + 0.0035 * (math.cos(th) ** 2)
            p = ensure_z_plane_clearance(c_m + dirs[j] * (r_eff + clr), Vector((c_m.x, c_m.y)), bvh_torso, 0.0050, max_r=0.22)
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

    # Short sleeves extending to mid-bicep (|x| = 0.275)
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
        x_end = side * 0.278
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
                clr = 0.0085 + 0.0035 * max(0.0, -math.sin(ang)) + 0.002 * (1.0 - t_arm)
                p = c_arm + d * (r + clr)
                if si < 2:
                    p = hole_verts[k].co.lerp(p, 0.65 if si == 0 else 0.88)
                    p.x = x
                    p = ensure_radial_clearance(p, c_arm, bvh_arm, 0.0080, max_r=0.11)
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
            v.co = ensure_radial_clearance(v.co, c_a, bvh_left_arm, 0.0060, max_r=0.11)
        elif v.co.x < -0.165 and v.co.z > 1.30:
            c_a = slice_centroid_x(verts_right_arm, v.co.x, tol=0.03)
            v.co = ensure_radial_clearance(v.co, c_a, bvh_right_arm, 0.0060, max_r=0.11)
        else:
            c_t = slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.01, v.co.z)))
            v.co = ensure_z_plane_clearance(v.co, Vector((c_t.x, c_t.y)), bvh_torso, 0.0046, max_r=0.22)

    return obj


def generate_tops(bvhs, mats, armature, only_ids: set[str] | None = None):
    donor_torso_only = [
        bpy.data.objects["body_nude_torso"],
        bpy.data.objects["body_nude_panties"],
    ]
    donor_arms_only = [
        bpy.data.objects["arms"],
    ]
    donor_top = donor_torso_only + donor_arms_only

    if only_ids is None or "tank-rib" in only_ids:
        tank = build_tank_rib("lara_tank_rib", bvhs, mats["fine_rib"])
        bind_and_transfer_weights(
            tank,
            donor_torso_only,
            armature,
            bone_attenuation={"breast_left_base": 0.65, "breast_right_base": 0.65},
            smooth_passes=1,
        )
        export_garment_glb([tank], armature, "tops/lara_tank_rib.glb")

    if only_ids is None or "tshirt" in only_ids:
        tshirt = build_tshirt("lara_tshirt", bvhs, mats["jersey"], mats["fine_rib"])
        bind_and_transfer_weights(
            tshirt,
            donor_top,
            armature,
            bone_attenuation={"breast_left_base": 0.55, "breast_right_base": 0.55},
            smooth_passes=1,
            region_selector=lambda vco: donor_arms_only if (abs(vco.x) > 0.145 and vco.z > 1.325) else donor_torso_only,
        )
        export_garment_glb([tshirt], armature, "tops/lara_tshirt.glb")
