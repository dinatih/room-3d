"""Build a clean, manifold, seamless Nude/Doll Lara from Lara_mix.blend.

Eliminates hip seams/facets and gloveless hand/wrist defects by assembling
clean source parts from Lara_mix.blend into a single continuous manifold
`body_nude` mesh with smooth bridged seams, anatomical weights, clean UVs,
and a unified color-calibrated seamless skin texture.

Usage:
  ALSOFT_DRIVERS=null blender --background --python-exit-code 1 --python scripts/build_lara_nude_doll_antigravity_g4h_high.py
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.dont_write_bytecode = True

ROOT = Path(__file__).resolve().parents[1]
SRC_BLEND = ROOT / "sources_backup/characters/lara/Lara_mix.blend"
OUT_BLEND = ROOT / "sources_backup/characters/lara/lara_nude_doll_antigravity_g4h_high.blend"
OUT_GLB = ROOT / "public/characters/lara/lara_nude_doll_antigravity_g4h_high.glb"
TEX_DIR = ROOT / "sources_backup/characters/lara/textures"
SKIN_TEX_PATH = TEX_DIR / "lara_nude_doll_skin_antigravity_g4h_high.png"


def unhide_all_collections() -> None:
    def _uc(col):
        col.hide_viewport = False
        col.hide_render = False
        for c in col.children:
            _uc(c)

    _uc(bpy.context.scene.collection)
    for lc in bpy.context.view_layer.layer_collection.children:
        def _ulc(layer):
            layer.exclude = False
            layer.hide_viewport = False
            for ch in layer.children:
                _ulc(ch)

        _ulc(lc)


def deselect_all() -> None:
    if bpy.context.active_object and bpy.context.active_object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    for o in list(bpy.context.selected_objects):
        o.select_set(False)


def load_image_array(img: bpy.types.Image) -> np.ndarray:
    w, h = img.size[:]
    arr = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(arr)
    return arr.reshape(h, w, 4)


def barycentric_2d_uv(pt: Vector, a: Vector, b: Vector, c: Vector, ua: Vector, ub: Vector, uc: Vector) -> Vector:
    v0 = b - a
    v1 = c - a
    v2 = pt - a
    d00 = v0.dot(v0)
    d01 = v0.dot(v1)
    d11 = v1.dot(v1)
    d20 = v2.dot(v0)
    d21 = v2.dot(v1)
    denom = d00 * d11 - d01 * d01
    if abs(denom) < 1e-16:
        return ua.copy()
    v = (d11 * d20 - d01 * d21) / denom
    w = (d00 * d21 - d01 * d20) / denom
    u = 1.0 - v - w
    return ua * u + ub * v + uc * w


def extract_donor_sample(
    obj: bpy.types.Object,
    face_pred=None,
    calib_pred=None,
    target_rgb=(0.843, 0.644, 0.422),
    min_skin_sum: float = 1.05,
):
    """Extract a world-space BVHTree, triangles, UVs, and color-calibrated RGBA array for a donor mesh."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    uv_lay = bm.loops.layers.uv.active
    mat = obj.data.materials[0]
    img = next(n.image for n in mat.node_tree.nodes if n.type == "TEX_IMAGE" and n.image)
    arr = load_image_array(img).copy()
    h, w, _ = arr.shape

    samples = []
    tris = []
    tri_uvs = []
    for f in bm.faces:
        c = f.calc_center_median()
        if face_pred is not None and not face_pred(f, c):
            continue
        pts = [v.co.copy() for v in f.verts]
        uvs = [l[uv_lay].uv.copy() for l in f.loops]
        tris.append(pts)
        tri_uvs.append(uvs)
        if calib_pred is None or calib_pred(f, c):
            for uvec in uvs:
                px = min(w - 1, max(0, int((uvec.x % 1.0) * w)))
                py = min(h - 1, max(0, int((uvec.y % 1.0) * h)))
                rgb = arr[py, px, :3]
                if rgb.sum() >= min_skin_sum and rgb[0] > rgb[2]:
                    samples.append(rgb)

    if samples:
        med = np.median(np.array(samples), axis=0)
        ratio = np.clip(np.array(target_rgb) / np.maximum(med, 1e-4), 0.72, 1.38)
        arr[:, :, :3] = np.clip(arr[:, :, :3] * ratio[None, None, :], 0.0, 1.0)

    verts_flat = [p for tri in tris for p in tri]
    polys = [(i, i + 1, i + 2) for i in range(0, len(verts_flat), 3)]
    bvh = BVHTree.FromPolygons(verts_flat, polys, all_triangles=True)
    bm.free()
    return bvh, tris, tri_uvs, arr


def sample_bilinear(arr: np.ndarray, u: float, v: float) -> np.ndarray:
    h, w, _ = arr.shape
    x = (u % 1.0) * w - 0.5
    y = (v % 1.0) * h - 0.5
    x0 = int(math.floor(x)) % w
    y0 = int(math.floor(y)) % h
    x1 = (x0 + 1) % w
    y1 = (y0 + 1) % h
    fx = x - math.floor(x)
    fy = y - math.floor(y)
    c00 = arr[y0, x0]
    c10 = arr[y0, x1]
    c01 = arr[y1, x0]
    c11 = arr[y1, x1]
    return (
        c00 * (1.0 - fx) * (1.0 - fy)
        + c10 * fx * (1.0 - fy)
        + c01 * (1.0 - fx) * fy
        + c11 * fx * fy
    )


def orient_part_outward(bm: bmesh.types.BMesh) -> None:
    """Orient every connected island of a donor part so normals point consistently outward."""
    bm.faces.ensure_lookup_table()
    visited = set()
    for seed in bm.faces:
        if seed in visited:
            continue
        island = []
        st = [seed]
        visited.add(seed)
        while st:
            f = st.pop()
            island.append(f)
            for e in f.edges:
                for lf in e.link_faces:
                    if lf not in visited:
                        visited.add(lf)
                        st.append(lf)
        bmesh.ops.recalc_face_normals(bm, faces=island)
        bm.normal_update()
        vs = {v for f in island for v in f.verts}
        center = sum((v.co for v in vs), Vector((0, 0, 0))) / max(len(vs), 1)
        radii = sorted((f.calc_center_median() - center).length for f in island)
        thresh = radii[int(len(radii) * 0.75)] if len(radii) > 5 else 0.0
        score = sum(
            (f.calc_center_median() - center).dot(f.normal)
            for f in island
            if (f.calc_center_median() - center).length >= thresh
        )
        if score < 0.0:
            bmesh.ops.reverse_faces(bm, faces=island)
    bm.normal_update()


def clone_bmesh_part(obj: bpy.types.Object, face_pred=None, merge_dist: float = 1e-5) -> bmesh.types.BMesh:
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    if face_pred is not None:
        to_del = [f for f in bm.faces if not face_pred(f)]
        if to_del:
            bmesh.ops.delete(bm, geom=to_del, context="FACES")
        loose = [v for v in bm.verts if not v.link_faces]
        if loose:
            bmesh.ops.delete(bm, geom=loose, context="VERTS")
    if merge_dist > 0:
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=merge_dist)
    orient_part_outward(bm)
    return bm


def keep_largest_components(bm: bmesh.types.BMesh, min_verts: int = 50, keep_count: int | None = None) -> None:
    visited = set()
    comps = []
    for v in bm.verts:
        if v in visited:
            continue
        comp = []
        st = [v]
        visited.add(v)
        while st:
            cur = st.pop()
            comp.append(cur)
            for e in cur.link_edges:
                ov = e.other_vert(cur)
                if ov not in visited:
                    visited.add(ov)
                    st.append(ov)
        comps.append(comp)
    comps.sort(key=len, reverse=True)
    if keep_count is not None:
        keep_verts = {v for comp in comps[:keep_count] for v in comp}
    else:
        keep_verts = {v for comp in comps if len(comp) >= min_verts for v in comp}
    del_verts = [v for v in bm.verts if v not in keep_verts]
    if del_verts:
        bmesh.ops.delete(bm, geom=del_verts, context="VERTS")


def boundary_loops(bm: bmesh.types.BMesh) -> list[list[bmesh.types.BMVert]]:
    unseen = {e for e in bm.edges if e.is_boundary}
    loops = []
    while unseen:
        start_e = unseen.pop()
        v0, v1 = start_e.verts[0], start_e.verts[1]
        ordered = [v0, v1]
        cur = v1
        while True:
            nxt = None
            for ed in cur.link_edges:
                if ed in unseen:
                    unseen.remove(ed)
                    nxt = ed.other_vert(cur)
                    break
            if nxt is None or nxt == v0:
                break
            ordered.append(nxt)
            cur = nxt
        loops.append(ordered)
    return loops


def bisect_clean(bm: bmesh.types.BMesh, plane_co: tuple[float, float, float], plane_no: tuple[float, float, float], clear_inner: bool = False, clear_outer: bool = False) -> None:
    geom = list(bm.verts) + list(bm.edges) + list(bm.faces)
    bmesh.ops.bisect_plane(
        bm,
        geom=geom,
        dist=1e-5,
        plane_co=Vector(plane_co),
        plane_no=Vector(plane_no),
        clear_inner=clear_inner,
        clear_outer=clear_outer,
    )
    loose_v = [v for v in bm.verts if not v.link_faces]
    if loose_v:
        bmesh.ops.delete(bm, geom=loose_v, context="VERTS")
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)


def append_bmesh(dst: bmesh.types.BMesh, src: bmesh.types.BMesh, tag_layer=None, tag_val: int = 0) -> None:
    vmap = {v: dst.verts.new(v.co) for v in src.verts}
    for f in src.faces:
        try:
            nf = dst.faces.new([vmap[v] for v in f.verts])
            if tag_layer is not None:
                nf[tag_layer] = tag_val
        except ValueError:
            pass


def bridge_two_loops(bm: bmesh.types.BMesh, loop_a: list[bmesh.types.BMVert], loop_b: list[bmesh.types.BMVert], tag_layer=None, tag_val: int = 1) -> list[bmesh.types.BMFace]:
    set_a = set(loop_a)
    set_b = set(loop_b)
    edges_a = [e for v in loop_a for e in v.link_edges if e.is_boundary and e.other_vert(v) in set_a]
    edges_b = [e for v in loop_b for e in v.link_edges if e.is_boundary and e.other_vert(v) in set_b]
    res = bmesh.ops.bridge_loops(bm, edges=list(set(edges_a + edges_b)))
    faces = res.get("faces", [])
    if tag_layer is not None:
        for f in faces:
            f[tag_layer] = tag_val
    return faces


def smooth_tagged_region(bm: bmesh.types.BMesh, tag_layer, iterations: int = 4, factor: float = 0.45, expand_rings: int = 1) -> None:
    bm.verts.ensure_lookup_table()
    active_faces = {f for f in bm.faces if f[tag_layer] > 0}
    verts = {v for f in active_faces for v in f.verts}
    for _ in range(expand_rings):
        verts = {ov for v in verts for e in v.link_edges for ov in (v, e.other_vert(v))}
    pinned = {v for v in verts if v.is_boundary}
    movable = list(verts - pinned)
    for _ in range(iterations):
        updates = {}
        for v in movable:
            nbrs = [e.other_vert(v).co for e in v.link_edges]
            if nbrs:
                avg = sum(nbrs, Vector((0, 0, 0))) / len(nbrs)
                updates[v] = v.co.lerp(avg, factor)
        for v, co in updates.items():
            v.co = co


def _bridge_slit_chains(bm: bmesh.types.BMesh, side_a: list[bmesh.types.BMVert], side_b: list[bmesh.types.BMVert], tag_layer) -> None:
    """Close a slit cleanly using Blender's bridge_loops on the two boundary chains."""
    # Ensure side_a & side_b don't share endpoints when passed to bridge_loops
    ea = [e for u, v in zip(side_a[:-1], side_a[1:]) if (e := bm.edges.get((u, v))) and e.is_boundary]
    eb = [e for u, v in zip(side_b[:-1], side_b[1:]) if (e := bm.edges.get((u, v))) and e.is_boundary]
    # Trim shared apex/bottom edge if side_a[0] == side_b[0] so bridge_loops gets two open chains
    if side_a[0] == side_b[0] and len(ea) > 1 and len(eb) > 1:
        ea = ea[1:]
        eb = eb[1:]
    if side_a[-1] == side_b[-1] and len(ea) > 1 and len(eb) > 1:
        ea = ea[:-1]
        eb = eb[:-1]
    res = bmesh.ops.bridge_loops(bm, edges=ea + eb)
    for f in res.get("faces", []):
        f[tag_layer] = 2
    # Fill any tiny apex/bottom triangular pinholes
    for lp in boundary_loops(bm):
        if len(lp) <= 5:
            fres = bmesh.ops.contextual_create(bm, geom=lp)
            for f in fres.get("faces", []):
                f[tag_layer] = 2


def close_full_catsuit_slits(bm: bmesh.types.BMesh, tag_layer) -> None:
    """Close front zipper slit and left/right side slits topologically before slicing."""
    for lp in boundary_loops(bm):
        pts = [v.co for v in lp]
        cx = sum(p.x for p in pts) / len(pts)
        cy = sum(p.y for p in pts) / len(pts)
        z_min, z_max = min(p.z for p in pts), max(p.z for p in pts)

        # 1. Front zipper slit (closed loop around x~0.002, y<-0.05, z in 0.94..1.36)
        if abs(cx) < 0.03 and cy < -0.05 and z_min > 0.90:
            bot_idx = min(range(len(lp)), key=lambda k: lp[k].co.z)
            rot = lp[bot_idx:] + lp[:bot_idx]
            top_idx = max(range(len(rot)), key=lambda k: rot[k].co.z)
            side_a = rot[: top_idx + 1]
            side_b = [rot[0]] + list(reversed(rot[top_idx:]))
            _bridge_slit_chains(bm, side_a, side_b, tag_layer)

        # 2. Left & right side slits (each shares ankle ring z~0.255 + vertical slit up to z~1.066)
        elif z_max > 0.90 and z_min < 0.50:
            top_idx = max(range(len(lp)), key=lambda k: lp[k].co.z)
            rot = lp[top_idx:] + lp[:top_idx]
            side_a = [rot[0]]
            for v in rot[1:]:
                side_a.append(v)
                if v.co.z <= 0.28:
                    break
            side_b = [rot[0]]
            for v in reversed(rot[1:]):
                side_b.append(v)
                if v.co.z <= 0.28:
                    break
            _bridge_slit_chains(bm, side_a, side_b, tag_layer)

    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-4)

    for f in bm.faces:
        c = f.calc_center_median()
        if abs(c.x - 0.002) < 0.018 and c.y < -0.04 and c.z > 0.90:
            f[tag_layer] = 2
        elif abs(c.x) > 0.09 and abs(c.y) < 0.025 and 0.72 <= c.z <= 1.06:
            f[tag_layer] = 2


def conform_rim_to_target(bm: bmesh.types.BMesh, verts: list[bmesh.types.BMVert], target_bvh: BVHTree, blend: float = 0.95) -> None:
    ring0 = set(verts)
    ring1 = {ov for v in ring0 for e in v.link_edges for ov in (e.other_vert(v),)} - ring0
    ring2 = {ov for v in ring1 for e in v.link_edges for ov in (e.other_vert(v),)} - ring0 - ring1
    for ring, w in ((ring0, 1.0 * blend), (ring1, 0.55 * blend), (ring2, 0.2 * blend)):
        for v in ring:
            loc, _, _, _ = target_bvh.find_nearest(v.co)
            if loc is not None:
                v.co = v.co.lerp(loc, w)


def build_body_nude_mesh() -> tuple[bpy.types.Object, dict]:
    """Assemble the unified manifold nude/doll body mesh from Lara_mix.blend."""
    gym_obj = bpy.data.objects["5_Body_1_0_0.001"]
    hsh_obj = bpy.data.objects["5_Body_1_0_0.004"]
    cat_obj = bpy.data.objects["5_Catsuit_1.0_0_0"]
    arm_obj = bpy.data.objects["5_Arms_1_0_0.005"]
    hand_obj = bpy.data.objects["5_Hands_1_0_0.002"]
    foot_obj = bpy.data.objects["5_Feet_1_0_0"]

    # Reference BVHs for conforming waist & thigh seams cleanly
    bm_gym_full = clone_bmesh_part(gym_obj)
    keep_largest_components(bm_gym_full, keep_count=1)
    bvh_gym = BVHTree.FromBMesh(bm_gym_full)
    bm_gym_full.free()

    bm_hsh_legs_ref = clone_bmesh_part(hsh_obj, face_pred=lambda f: f.calc_center_median().z < 0.96)
    bvh_hsh_legs = BVHTree.FromBMesh(bm_hsh_legs_ref)
    bm_hsh_legs_ref.free()

    # 1. Gym torso base: keep main torso, cleanly bisect waist at z=1.072, neck at z=1.535, and shoulder caps at |x|=0.141
    bm_torso = clone_bmesh_part(gym_obj, face_pred=lambda f: f.calc_center_median().z > 0.95)
    keep_largest_components(bm_torso, keep_count=1)
    bisect_clean(bm_torso, (0, 0, 1.072), (0, 0, 1), clear_inner=True)
    bisect_clean(bm_torso, (0, 0, 1.535), (0, 0, 1), clear_outer=True)
    bisect_clean(bm_torso, (0.141, 0, 1.40), (1, 0, 0), clear_outer=True)
    bisect_clean(bm_torso, (-0.141, 0, 1.40), (1, 0, 0), clear_inner=True)

    # 2. HSH breast/chest patch (stop cleanly below Gym upper chest at z=1.405 so rim never overhangs/folds back)
    bm_chest = clone_bmesh_part(
        hsh_obj,
        face_pred=lambda f: (
            1.18 <= f.calc_center_median().z <= 1.405
            and f.calc_center_median().y < 0.002
            and abs(f.calc_center_median().x) < 0.115
        ),
    )
    keep_largest_components(bm_chest, keep_count=1)
    for lp in boundary_loops(bm_chest):
        if len(lp) <= 8:
            bmesh.ops.contextual_create(bm_chest, geom=lp)

    # Remove Gym chest faces behind HSH chest (opening extends to z=1.42, cleanly enclosing bm_chest)
    bvh_chest = BVHTree.FromBMesh(bm_chest)
    overlap_gym = [
        f for f in bm_torso.faces
        if f.calc_center_median().y < -0.02
        and 1.21 <= f.calc_center_median().z <= 1.42
        and abs(f.calc_center_median().x) < 0.11
        and bvh_chest.find_nearest(f.calc_center_median())[3] < 0.025
    ]
    if overlap_gym:
        bmesh.ops.delete(bm_torso, geom=overlap_gym, context="FACES")
        loose = [v for v in bm_torso.verts if not v.link_faces]
        if loose:
            bmesh.ops.delete(bm_torso, geom=loose, context="VERTS")

    # 3. Catsuit hips: close ALL slits FIRST on full catsuit, then bisect cleanly at z=1.060 & z=0.745!
    bm_hips = clone_bmesh_part(cat_obj)
    keep_largest_components(bm_hips, keep_count=1)
    hips_tag = bm_hips.faces.layers.int.new("hip_tag")
    close_full_catsuit_slits(bm_hips, hips_tag)
    bisect_clean(bm_hips, (0, 0, 1.060), (0, 0, 1), clear_outer=True)
    bisect_clean(bm_hips, (0, 0, 0.745), (0, 0, 1), clear_inner=True)
    # Remove any small disconnected collar/shoulder scraps if present
    keep_largest_components(bm_hips, keep_count=1)

    # Flatten front zipper groove & push outer-thigh side-slit lips flush with curved thigh profile
    for _ in range(2):
        for v in bm_hips.verts:
            if abs(v.co.x - 0.002) < 0.008 and v.co.y < -0.06 and v.co.z > 0.92:
                nbr_y = [e.other_vert(v).co.y for e in v.link_edges if abs(e.other_vert(v).co.x - 0.002) >= 0.006]
                if nbr_y:
                    v.co.y = min(v.co.y, sum(nbr_y) / len(nbr_y))
            elif abs(v.co.x) > 0.11 and abs(v.co.y) < 0.025 and 0.74 <= v.co.z <= 1.05:
                loc, _, _, d = bvh_hsh_legs.find_nearest(v.co)
                if loc is not None and d < 0.020 and v.co.z <= 0.94:
                    v.co = v.co.lerp(loc, 0.75)
                else:
                    nbr_ax = [abs(e.other_vert(v).co.x) for e in v.link_edges if abs(e.other_vert(v).co.y) >= 0.016]
                    if nbr_ax:
                        target_ax = max(abs(v.co.x), sum(nbr_ax) / len(nbr_ax))
                        v.co.x = math.copysign(target_ax, v.co.x)

    hips_loops = boundary_loops(bm_hips)
    print(f"Catsuit hips boundary loops after clean bisect: {len(hips_loops)}")
    for lp in hips_loops:
        ctr = sum((v.co for v in lp), Vector()) / len(lp)
        print(f"  hip loop n={len(lp):2d} ctr=({ctr.x:6.3f},{ctr.y:6.3f},{ctr.z:6.3f})")
        if ctr.z > 1.0:
            conform_rim_to_target(bm_hips, lp, bvh_gym, blend=0.95)
        else:
            conform_rim_to_target(bm_hips, lp, bvh_hsh_legs, blend=0.95)

    # 4. HSH legs: bisect cleanly at z=0.745
    bm_legs = clone_bmesh_part(hsh_obj, face_pred=lambda f: f.calc_center_median().z < 0.96)
    bisect_clean(bm_legs, (0, 0, 0.745), (0, 0, 1), clear_outer=True)

    # 5. HSH feet
    bm_feet = clone_bmesh_part(foot_obj)

    # 6. Swimsuit bare arms: keep z > 1.25 and stop cleanly ON the exact 16-vert ring at |x|=0.497
    bm_arms = clone_bmesh_part(
        arm_obj,
        face_pred=lambda f: f.calc_center_median().z > 1.25 and abs(f.calc_center_median().x) <= 0.495,
    )

    # 7. HSH bare hands without gloves (100% intact)
    bm_hands = clone_bmesh_part(hand_obj)

    # Combine into master BMesh
    bm = bmesh.new()
    tag = bm.faces.layers.int.new("weld_tag")

    append_bmesh(bm, bm_torso, tag, 0)
    append_bmesh(bm, bm_chest, tag, 0)
    vmap_h = {v: bm.verts.new(v.co) for v in bm_hips.verts}
    for f in bm_hips.faces:
        try:
            nf = bm.faces.new([vmap_h[v] for v in f.verts])
            nf[tag] = f[hips_tag]
        except ValueError:
            pass
    append_bmesh(bm, bm_legs, tag, 0)
    append_bmesh(bm, bm_feet, tag, 0)
    append_bmesh(bm, bm_arms, tag, 0)
    append_bmesh(bm, bm_hands, tag, 0)

    # Merge exact matching vertices ONLY at forearm/hand rings (0.007mm apart!)
    forearm_verts = [v for v in bm.verts if abs(v.co.x) > 0.48 and v.co.z > 1.25]
    bmesh.ops.remove_doubles(bm, verts=forearm_verts, dist=2e-4)

    all_loops = boundary_loops(bm)
    neck_loops = [lp for lp in all_loops if sum(v.co.z for v in lp) / len(lp) > 1.48]
    weld_loops = [lp for lp in all_loops if lp not in neck_loops]

    print(f"Boundary loops before bridging: neck={len(neck_loops)}, to_bridge={len(weld_loops)}")
    for lp in weld_loops:
        ctr = sum((v.co for v in lp), Vector()) / len(lp)
        print(f"  loop n={len(lp):2d} ctr=({ctr.x:6.3f},{ctr.y:6.3f},{ctr.z:6.3f})")

    remaining = list(weld_loops)
    bridged_pairs = 0
    while len(remaining) >= 2:
        best = None
        for i in range(len(remaining)):
            ci = sum((v.co for v in remaining[i]), Vector()) / len(remaining[i])
            for j in range(i + 1, len(remaining)):
                cj = sum((v.co for v in remaining[j]), Vector()) / len(remaining[j])
                if (ci.x > 0.04 and cj.x < -0.04) or (ci.x < -0.04 and cj.x > 0.04):
                    continue
                d = (ci - cj).length
                if best is None or d < best[0]:
                    best = (d, i, j)
        if best is None or best[0] > 0.12:
            break
        d, i, j = best
        la, lb = remaining[i], remaining[j]
        remaining.pop(j)
        remaining.pop(i)
        ca = sum((v.co for v in la), Vector()) / len(la)
        cb = sum((v.co for v in lb), Vector()) / len(lb)
        print(f"  Bridging pair dist={d:.4f}m: ({ca.x:.3f},{ca.y:.3f},{ca.z:.3f}) <-> ({cb.x:.3f},{cb.y:.3f},{cb.z:.3f})")
        bridge_two_loops(bm, la, lb, tag_layer=tag, tag_val=1)
        bridged_pairs += 1

    rem_loops = [lp for lp in boundary_loops(bm) if sum(v.co.z for v in lp) / len(lp) <= 1.48]
    print(f"Bridged {bridged_pairs} pairs. Remaining non-neck loops: {len(rem_loops)}")
    assert len(rem_loops) == 0, f"Unexpected remaining non-neck holes: {len(rem_loops)}"

    # Guarantee 100% outward normals by temporarily capping the neck opening -> closed manifold volume > 0
    def orient_outward_closed_neck():
        b_lps = boundary_loops(bm)
        cap = []
        for lp in b_lps:
            res = bmesh.ops.contextual_create(bm, geom=lp)
            cap.extend(res.get("faces", []))
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        if bm.calc_volume(signed=True) < 0:
            bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
        if cap:
            bmesh.ops.delete(bm, geom=cap, context="FACES")
        bm.normal_update()

    orient_outward_closed_neck()

    # Smooth ONLY tagged bridge seams & zipper/side slits
    smooth_tagged_region(bm, tag, iterations=5, factor=0.45, expand_rings=1)

    # Gentle Taubin smoothing across hip-waist-thigh zone (0.72..1.07) to eliminate any residual seam ridges
    hip_zone_verts = [v for v in bm.verts if not v.is_boundary and (0.72 <= v.co.z <= 1.07)]
    for _ in range(3):
        for factor in (0.35, -0.32):
            upd = {}
            for v in hip_zone_verts:
                nbrs = [e.other_vert(v).co for e in v.link_edges]
                if nbrs:
                    avg = sum(nbrs, Vector()) / len(nbrs)
                    upd[v] = v.co.lerp(avg, factor)
            for v, co in upd.items():
                v.co = co

    orient_outward_closed_neck()
    for e in bm.edges:
        e.smooth = True
    for f in bm.faces:
        f.smooth = True

    non_man = sum(1 for e in bm.edges if not e.is_manifold and not e.is_boundary)
    inv_outer = sum(
        1 for f in bm.faces
        if abs(f.calc_center_median().x) > 0.12 and 0.74 <= f.calc_center_median().z <= 1.02
        and f.normal.dot(Vector((f.calc_center_median().x, f.calc_center_median().y, 0))) < 0
    )
    b_loops = boundary_loops(bm)
    print(f"FINAL body_nude topology: verts={len(bm.verts)}, faces={len(bm.faces)}, non_manifold={non_man}, inv_outer={inv_outer}, boundary_loops={len(b_loops)}")
    assert non_man == 0, f"Expected 0 non-manifold edges, got {non_man}"
    assert inv_outer == 0, f"Expected 0 inverted outer hip faces, got {inv_outer}"
    assert len(b_loops) == 1, f"Expected 1 neck boundary loop, got {len(b_loops)}"

    for tmp in (bm_torso, bm_chest, bm_hips, bm_legs, bm_feet, bm_arms, bm_hands):
        tmp.free()

    mesh = bpy.data.meshes.new("body_nude")
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    obj = bpy.data.objects.new("body_nude", mesh)
    bpy.context.scene.collection.objects.link(obj)

    donors = {
        "gym": gym_obj,
        "hsh": hsh_obj,
        "cat": cat_obj,
        "arms": arm_obj,
        "hands": hand_obj,
        "feet": foot_obj,
    }
    return obj, donors


def smoothstep(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3.0 - 2.0 * x)


def assign_weights(body_obj: bpy.types.Object, donors: dict, arm_obj: bpy.types.Object) -> None:
    """Transfer authored skin weights per anatomical region and refine pelvis/crotch/breast weights."""
    bone_names = {b.name for b in arm_obj.data.bones}

    def build_donor_bvh(obj, face_pred=None):
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.transform(obj.matrix_world)
        vg_names = [g.name.replace(" ", "_") for g in obj.vertex_groups]
        vweights = []
        for v in obj.data.vertices:
            w = {}
            for g in v.groups:
                bn = vg_names[g.group]
                if bn in bone_names and g.weight > 1e-4:
                    w[bn] = w.get(bn, 0.0) + g.weight
            vweights.append(w)
        v_idx_lay = bm.verts.layers.int.new("orig_idx")
        for i, v in enumerate(bm.verts):
            v[v_idx_lay] = i
        if face_pred is not None:
            to_del = [f for f in bm.faces if not face_pred(f)]
            if to_del:
                bmesh.ops.delete(bm, geom=to_del, context="FACES")
        bvh = BVHTree.FromBMesh(bm)
        bm.faces.ensure_lookup_table()
        return bm, bvh, vweights, v_idx_lay

    d_hands = build_donor_bvh(donors["hands"])
    d_feet = build_donor_bvh(donors["feet"])
    d_arms = build_donor_bvh(donors["arms"], lambda f: f.calc_center_median().z > 1.25)
    d_torso = build_donor_bvh(donors["gym"], lambda f: f.calc_center_median().z > 0.95)
    d_hsh_chest = build_donor_bvh(donors["hsh"], lambda f: f.calc_center_median().z > 1.15)
    d_hsh_legs = build_donor_bvh(donors["hsh"], lambda f: f.calc_center_median().z < 0.95)
    d_hips = build_donor_bvh(donors["cat"], lambda f: 0.72 <= f.calc_center_median().z <= 1.08)

    bones = arm_obj.data.bones
    pelvis_z = bones["pelvis"].head_local.z
    lower_z = bones["spine_lower"].head_local.z
    upper_z = bones["spine_upper"].head_local.z
    left_thigh = bones["leg_left_thigh"].head_local
    right_thigh = bones["leg_right_thigh"].head_local
    hip_center_x = 0.5 * (left_thigh.x + right_thigh.x)
    hip_radius = 0.5 * (left_thigh.x - right_thigh.x)
    hip_z = 0.5 * (left_thigh.z + right_thigh.z)
    knee_z = bones["leg_left_knee"].head_local.z
    crotch_z = bones["pelvis"].tail_local.z
    crease_z = hip_z - (pelvis_z - hip_z)
    rear_y = max(v.co.y for v in body_obj.data.vertices if crease_z <= v.co.z <= pelvis_z)

    vg_cache = {}
    body_obj.vertex_groups.clear()

    def pick_donor(co: Vector):
        if abs(co.x) > 0.495 and co.z > 1.25:
            return d_hands
        if co.z < 0.092:
            return d_feet
        if abs(co.x) > 0.145 and co.z > 1.25:
            return d_arms
        if co.z > 1.18:
            if co.y < -0.02 and abs(co.x) < 0.115 and co.z < 1.44:
                return d_hsh_chest
            return d_torso
        if 0.74 <= co.z <= 1.05:
            return d_hips
        if co.z < 0.74:
            return d_hsh_legs
        return d_torso

    raw_weights = []
    for v in body_obj.data.vertices:
        bm_d, bvh_d, vw_d, idx_lay = pick_donor(v.co)
        loc, _, fidx, _ = bvh_d.find_nearest(v.co)
        w = {}
        if fidx is not None:
            face = bm_d.faces[fidx]
            inv_sum = 0.0
            for fv in face.verts:
                inv_d = 1.0 / ((fv.co - loc).length + 1e-4)
                inv_sum += inv_d
                for bn, bw in vw_d[fv[idx_lay]].items():
                    w[bn] = w.get(bn, 0.0) + bw * inv_d
            if inv_sum > 0:
                for bn in w:
                    w[bn] /= inv_sum

        chain = ("pelvis", "spine_lower", "spine_upper")
        chain_w = sum(w.get(b, 0.0) for b in chain)
        if chain_w and v.co.z > lower_z and abs(v.co.x) < 0.14:
            blend = smoothstep((v.co.z - lower_z) / (upper_z - lower_z))
            pw = w.get("pelvis", 0.0) * (1.0 - blend)
            w["pelvis"] = pw
            w["spine_lower"] = max(0.0, chain_w * (1.0 - blend) - pw)
            w["spine_upper"] = chain_w * blend

        for side in ("left", "right"):
            thigh = f"leg_{side}_thigh"
            if thigh in w and 0.65 <= v.co.z <= 1.08:
                posterior = smoothstep((v.co.y - bones[thigh].head_local.y) / (rear_y - bones[thigh].head_local.y))
                height = smoothstep((v.co.z - crease_z) / (hip_z - crease_z))
                transfer = w[thigh] * posterior * height
                w[thigh] -= transfer
                w["pelvis"] = w.get("pelvis", 0.0) + transfer

        if 0.65 <= v.co.z <= 1.05:
            central = 1.0 - smoothstep(abs(v.co.x - hip_center_x) / hip_radius)
            c_height = smoothstep((v.co.z - 0.5 * (hip_z + knee_z)) / (crotch_z - 0.5 * (hip_z + knee_z)))
            c_blend = central * c_height
            if c_blend > 0:
                t_names = ("leg_left_thigh", "leg_right_thigh")
                tot_t = sum(w.get(tn, 0.0) for tn in t_names)
                if tot_t > 0:
                    frac = smoothstep((v.co.x - right_thigh.x) / (left_thigh.x - right_thigh.x))
                    old_frac = w.get(t_names[0], 0.0) / tot_t
                    frac = old_frac * (1.0 - c_blend) + frac * c_blend
                    retained = tot_t * (1.0 - c_blend)
                    w[t_names[0]] = retained * frac
                    w[t_names[1]] = retained * (1.0 - frac)
                    w["pelvis"] = w.get("pelvis", 0.0) + tot_t * c_blend

        if v.co.y < -0.055 and 1.21 <= v.co.z <= 1.38 and abs(v.co.x) < 0.125:
            for side, cx in (("left", 0.06), ("right", -0.06)):
                if (side == "left" and v.co.x > -0.01) or (side == "right" and v.co.x < 0.01):
                    dist_b = math.sqrt(((v.co.x - cx) / 0.065) ** 2 + ((v.co.z - 1.295) / 0.075) ** 2)
                    if dist_b < 1.0:
                        bw = 0.55 * smoothstep(1.0 - dist_b)
                        if bw > 0.01:
                            bkey = f"breast_{side}_base"
                            tot_cur = sum(w.values()) or 1.0
                            for k in list(w.keys()):
                                w[k] *= (1.0 - bw) / tot_cur
                            w[bkey] = bw

        if not w:
            w = {"spine_lower": 1.0}
        raw_weights.append(w)

    adj = [[] for _ in range(len(body_obj.data.vertices))]
    for e in body_obj.data.edges:
        adj[e.vertices[0]].append(e.vertices[1])
        adj[e.vertices[1]].append(e.vertices[0])

    for it in range(6):
        nxt = []
        for vi, v in enumerate(body_obj.data.vertices):
            in_hip_flex = (0.76 <= v.co.z <= 1.04) and (abs(v.co.x) > 0.035)
            in_weld = (
                in_hip_flex
                or (
                    it < 2
                    and (
                        (0.70 <= v.co.z <= 1.08)
                        or (1.18 <= v.co.z <= 1.44 and v.co.y < -0.02 and abs(v.co.x) < 0.12)
                        or (0.12 <= abs(v.co.x) <= 0.18 and v.co.z > 1.30)
                        or (0.45 <= abs(v.co.x) <= 0.52 and v.co.z > 1.30)
                        or (0.01 <= v.co.z <= 0.11)
                    )
                )
            )
            if not in_weld or not adj[vi]:
                nxt.append(raw_weights[vi])
                continue
            acc = {k: val * 0.65 for k, val in raw_weights[vi].items()}
            nf = 0.35 / len(adj[vi])
            for ni in adj[vi]:
                for k, val in raw_weights[ni].items():
                    acc[k] = acc.get(k, 0.0) + val * nf
            nxt.append(acc)
        raw_weights = nxt

    for vi, w in enumerate(raw_weights):
        top4 = sorted(w.items(), key=lambda kv: kv[1], reverse=True)[:4]
        s = sum(val for _, val in top4) or 1.0
        for bn, val in top4:
            nw = val / s
            if nw < 1e-4:
                continue
            vg = vg_cache.get(bn)
            if vg is None:
                vg = body_obj.vertex_groups.new(name=bn)
                vg_cache[bn] = vg
            vg.add([vi], nw, "REPLACE")

    for bm_d, _, _, _ in (d_hands, d_feet, d_arms, d_torso, d_hsh_chest, d_hsh_legs, d_hips):
        bm_d.free()


def _mark_edge_chain(
    bm: bmesh.types.BMesh,
    start_v: bmesh.types.BMVert,
    goal_v: bmesh.types.BMVert,
    edge_cost_fn,
) -> list[bmesh.types.BMVert]:
    """Shortest path of edges on BMesh from start_v to goal_v, marked as 1-edge-wide UV seams."""
    import heapq

    dist = {start_v.index: 0.0}
    prev_edge: dict[int, bmesh.types.BMEdge] = {}
    prev_vert: dict[int, bmesh.types.BMVert] = {}
    heap: list[tuple[float, int]] = [(0.0, start_v.index)]
    v_by_idx = {v.index: v for v in bm.verts}
    visited: set[int] = set()

    while heap:
        d, u_idx = heapq.heappop(heap)
        if u_idx in visited:
            continue
        visited.add(u_idx)
        if u_idx == goal_v.index:
            break
        u = v_by_idx[u_idx]
        for e in u.link_edges:
            w = edge_cost_fn(e)
            if w is None:
                continue
            v = e.other_vert(u)
            nd = d + w
            if nd < dist.get(v.index, 1e18):
                dist[v.index] = nd
                prev_edge[v.index] = e
                prev_vert[v.index] = u
                heapq.heappush(heap, (nd, v.index))

    path: list[bmesh.types.BMVert] = []
    cur = goal_v
    while cur.index in prev_edge:
        path.append(cur)
        prev_edge[cur.index].seam = True
        cur = prev_vert[cur.index]
    path.append(cur)
    path.reverse()
    return path


def unwrap_and_bake_skin(body_obj: bpy.types.Object, donors: dict) -> bpy.types.Image:
    """Create clean 1-edge-wide anatomical UV seams, unwrap body_nude, and bake a seamless unified skin PNG."""
    bm = bmesh.new()
    bm.from_mesh(body_obj.data)
    bm.verts.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    bm.faces.ensure_lookup_table()

    for e in bm.edges:
        e.seam = False

    # 1) Partition faces into anatomical tubes and mark exact 1-edge boundary rings (shoulders & ankles)
    def face_region(f: bmesh.types.BMFace) -> str:
        c = f.calc_center_median()
        if c.x < -0.148 and c.z > 1.25:
            return "arm_l"
        if c.x > 0.148 and c.z > 1.25:
            return "arm_r"
        if c.x < 0.0 and c.z < 0.088:
            return "foot_l"
        if c.x > 0.0 and c.z < 0.088:
            return "foot_r"
        return "main"

    regions = {f.index: face_region(f) for f in bm.faces}
    for e in bm.edges:
        if len(e.link_faces) == 2:
            if regions[e.link_faces[0].index] != regions[e.link_faces[1].index]:
                e.seam = True

    def nearest_vert(verts, score_fn) -> bmesh.types.BMVert:
        return min(verts, key=score_fn)

    def edge_mid(e: bmesh.types.BMEdge) -> Vector:
        return 0.5 * (e.verts[0].co + e.verts[1].co)

    def edge_len(e: bmesh.types.BMEdge) -> float:
        return max((e.verts[0].co - e.verts[1].co).length, 1e-4)

    # 2) Open spine down center-back from neck to crotch (1-edge chain)
    neck_back_v = nearest_vert(
        [v for v in bm.verts if v.co.z > 1.48 and v.co.y > 0.0],
        lambda v: abs(v.co.x) * 10.0 - v.co.z - v.co.y * 2.0,
    )
    crotch_v = nearest_vert(
        [v for v in bm.verts if 0.80 <= v.co.z <= 0.94 and abs(v.co.x) < 0.03 and v.co.y > -0.04],
        lambda v: abs(v.co.x) * 20.0 + abs(v.co.z - 0.855) * 4.0 + abs(v.co.y - 0.01),
    )
    _mark_edge_chain(
        bm,
        neck_back_v,
        crotch_v,
        lambda e: (
            None
            if abs(edge_mid(e).x) > 0.10 or edge_mid(e).z < 0.80
            else edge_len(e) * (1.0 + 180.0 * abs(edge_mid(e).x) + 120.0 * max(0.0, -edge_mid(e).y))
        ),
    )

    # 3) Open left & right inner legs from crotch to ankle rings
    for side in (-1.0, 1.0):
        ankle_in_v = nearest_vert(
            [v for v in bm.verts if 0.085 <= v.co.z <= 0.115 and side * v.co.x > 0.0],
            lambda v: abs(v.co.z - 0.092) * 8.0 + abs(v.co.x) * 6.0 + abs(v.co.y),
        )
        _mark_edge_chain(
            bm,
            crotch_v,
            ankle_in_v,
            lambda e, s=side: (
                None
                if edge_mid(e).z > 0.96 or edge_mid(e).z < 0.075 or s * edge_mid(e).x < -0.025
                else edge_len(e) * (1.0 + 40.0 * abs(edge_mid(e).x) + 12.0 * abs(edge_mid(e).y))
            ),
        )

    # 4) Open left & right arms along underarm -> pinky outer edge
    for side in (-1.0, 1.0):
        arm_start_v = nearest_vert(
            [v for v in bm.verts if 0.145 <= side * v.co.x <= 0.175 and v.co.z > 1.25],
            lambda v: v.co.z + abs(v.co.y) * 2.0,
        )
        arm_end_v = nearest_vert(
            [v for v in bm.verts if side * v.co.x > 0.62 and v.co.z > 1.25],
            lambda v: -v.co.y * 4.0 + v.co.z - side * v.co.x * 0.5,
        )
        _mark_edge_chain(
            bm,
            arm_start_v,
            arm_end_v,
            lambda e, s=side: (
                None
                if s * edge_mid(e).x < 0.135 or edge_mid(e).z < 1.22
                else edge_len(e) * (1.0 + 25.0 * max(0.0, edge_mid(e).z - 1.38) + 15.0 * max(0.0, -edge_mid(e).y))
            ),
        )

    # 5) Open each foot along back-heel -> sole -> middle toe
    for side in (-1.0, 1.0):
        heel_top_v = nearest_vert(
            [v for v in bm.verts if v.co.z <= 0.095 and side * v.co.x > 0.0],
            lambda v: abs(v.co.z - 0.088) * 10.0 - v.co.y * 4.0,
        )
        toe_tip_v = nearest_vert(
            [v for v in bm.verts if v.co.z <= 0.04 and side * v.co.x > 0.0],
            lambda v: v.co.y * 5.0 + v.co.z * 2.0 + abs(abs(v.co.x) - 0.075),
        )
        _mark_edge_chain(
            bm,
            heel_top_v,
            toe_tip_v,
            lambda e, s=side: (
                None
                if edge_mid(e).z > 0.095 or s * edge_mid(e).x <= 0.0
                else edge_len(e) * (1.0 + 40.0 * max(0.0, edge_mid(e).z - 0.015) * (edge_mid(e).y < 0.02))
            ),
        )

    bm.to_mesh(body_obj.data)
    bm.free()

    deselect_all()
    body_obj.select_set(True)
    bpy.context.view_layer.objects.active = body_obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.unwrap(method="ANGLE_BASED", margin=0.015)
    bpy.ops.object.mode_set(mode="OBJECT")

    # Verify clean island count (avoid fragmented 1-face islands)
    bm_chk = bmesh.new()
    bm_chk.from_mesh(body_obj.data)
    uv_lay = bm_chk.loops.layers.uv.active
    visited_f: set[int] = set()
    islands = 0
    for f in bm_chk.faces:
        if f.index in visited_f:
            continue
        islands += 1
        stack = [f]
        visited_f.add(f.index)
        while stack:
            cf = stack.pop()
            for e in cf.edges:
                if e.seam:
                    continue
                for nf in e.link_faces:
                    if nf.index not in visited_f:
                        visited_f.add(nf.index)
                        stack.append(nf)
    bm_chk.free()
    print(f"UV unwrap produced {islands} clean islands")

    W, H = 1024, 1024
    # Calibrate EVERY donor strictly on pure skin pixels near its seam to canonical warm tan RGB
    d_hands = extract_donor_sample(
        donors["hands"],
        face_pred=lambda f, c: True,
        calib_pred=lambda f, c: 0.50 <= abs(c.x) <= 0.56,
    )
    d_feet = extract_donor_sample(
        donors["feet"],
        face_pred=lambda f, c: True,
        calib_pred=lambda f, c: 0.04 <= c.z <= 0.09,
    )
    d_arms = extract_donor_sample(
        donors["arms"],
        face_pred=lambda f, c: c.z > 1.25 and abs(c.x) < 0.52,
        calib_pred=lambda f, c: 0.38 <= abs(c.x) <= 0.48,
    )
    d_belly = extract_donor_sample(
        donors["gym"],
        face_pred=lambda f, c: 1.03 <= c.z <= 1.50,
        calib_pred=lambda f, c: 1.06 <= c.z <= 1.18 and abs(c.x) < 0.10,
    )
    d_hsh_torso = extract_donor_sample(
        donors["hsh"],
        face_pred=lambda f, c: 1.16 <= c.z <= 1.56,
        calib_pred=lambda f, c: 1.22 <= c.z <= 1.46 and abs(c.x) < 0.10,
    )
    d_legs = extract_donor_sample(
        donors["hsh"],
        face_pred=lambda f, c: 0.03 <= c.z <= 0.88,
        calib_pred=lambda f, c: 0.52 <= c.z <= 0.74,
    )

    def sample_donor(donor, pt: Vector) -> np.ndarray:
        bvh, tris, tri_uvs, arr = donor
        loc, _, fidx, _ = bvh.find_nearest(pt)
        a, b, c = tris[fidx]
        ua, ub, uc = tri_uvs[fidx]
        uv_p = barycentric_2d_uv(loc, a, b, c, ua, ub, uc)
        return sample_bilinear(arr, uv_p.x, uv_p.y)

    CANONICAL_SKIN = np.array([0.843, 0.644, 0.422], dtype=np.float32)
    canvas = np.empty((H, W, 4), dtype=np.float32)
    canvas[:, :, :3] = CANONICAL_SKIN
    canvas[:, :, 3] = 1.0
    covered = np.zeros((H, W), dtype=bool)
    known = np.zeros((H, W), dtype=bool)

    mesh = body_obj.data
    mesh.calc_loop_triangles()
    uv_layer = mesh.uv_layers.active
    uv_data = uv_layer.data

    def set_if_skin(py: int, px: int, rgba: np.ndarray, min_sum: float = 1.10) -> None:
        # Reject dark hair/bra/background/shadow pixels so harmonic diffusion fills them seamlessly
        if rgba[:3].sum() >= min_sum and rgba[0] >= rgba[2] and rgba[3] > 0.5:
            canvas[py, px] = rgba
            known[py, px] = True

    def sample_and_mark(px: int, py: int, pt: Vector) -> None:
        covered[py, px] = True
        # Leave smooth transition bands across wrists, ankles, waist, thighs, ribs, collarbone for harmonic diffusion
        if abs(pt.x) > 0.510 and pt.z > 1.25:
            set_if_skin(py, px, sample_donor(d_hands, pt))
        elif pt.z < 0.075:
            set_if_skin(py, px, sample_donor(d_feet, pt))
        elif 0.165 <= abs(pt.x) <= 0.475 and pt.z > 1.25:
            set_if_skin(py, px, sample_donor(d_arms, pt))
        elif 0.105 <= pt.z <= 0.725:
            set_if_skin(py, px, sample_donor(d_legs, pt))
        elif 1.065 <= pt.z <= (1.165 if pt.y <= -0.04 else 1.155):
            set_if_skin(py, px, sample_donor(d_belly, pt))
        elif abs(pt.x) < 0.115 and (1.215 if pt.y <= -0.04 else 1.235) <= pt.z <= 1.460:
            # Use HSH bare chest & bare back; avoid bathrobe collar (>1.460) and spine braid shadow
            is_braid_shadow = abs(pt.x - 0.002) < 0.038 and pt.y > 0.0 and pt.z > 1.22
            is_collar_band = pt.z > 1.41 and pt.y < 0.0
            min_s = 1.76 if is_braid_shadow else (1.76 if is_collar_band else 1.10)
            set_if_skin(py, px, sample_donor(d_hsh_torso, pt), min_sum=min_s)

    for tri in mesh.loop_triangles:
        t_uv = np.array([[uv_data[li].uv.x * W, uv_data[li].uv.y * H] for li in tri.loops])
        pa, pb, pc = [mesh.vertices[i].co for i in tri.vertices]
        c_uv = t_uv.mean(axis=0)
        cx = int(np.clip(np.floor(c_uv[0]), 0, W - 1))
        cy = int(np.clip(np.floor(c_uv[1]), 0, H - 1))
        sample_and_mark(cx, cy, (pa + pb + pc) / 3.0)

        origin = t_uv[0]
        mat = np.column_stack((t_uv[1] - origin, t_uv[2] - origin))
        det = mat[0, 0] * mat[1, 1] - mat[0, 1] * mat[1, 0]
        if abs(det) < 1e-8:
            continue
        inv = np.array([[mat[1, 1], -mat[0, 1]], [-mat[1, 0], mat[0, 0]]]) / det
        low = np.maximum(np.floor(t_uv.min(axis=0)).astype(int), 0)
        high = np.minimum(np.ceil(t_uv.max(axis=0)).astype(int), (W, H))
        if np.any(high <= low):
            continue
        xs, ys = np.meshgrid(np.arange(low[0], high[0]), np.arange(low[1], high[1]))
        coords = np.column_stack((xs.ravel() + 0.5, ys.ravel() + 0.5))
        w = (coords - origin) @ inv.T
        inside = (w[:, 0] >= -1e-3) & (w[:, 1] >= -1e-3) & (w.sum(axis=1) <= 1.0 + 1e-3)
        if not np.any(inside):
            continue
        for px_c, bw in zip(coords[inside], w[inside]):
            bw0 = max(0.0, float(bw[0]))
            bw1 = max(0.0, float(bw[1]))
            if bw0 + bw1 > 1.0:
                s = bw0 + bw1
                bw0 /= s
                bw1 /= s
            pt = pa + (pb - pa) * bw0 + (pc - pa) * bw1
            px, py = int(px_c[0]), int(px_c[1])
            sample_and_mark(px, py, pt)

    # Multi-scale coarse-to-fine Laplace harmonic diffusion so color flows smoothly across large hip island
    unknown = covered & (~known)
    rgb = canvas[:, :, :3].copy()

    def solve_laplace_pyramid(rgb_in: np.ndarray, cov: np.ndarray, knw: np.ndarray, level: int = 0) -> np.ndarray:
        h_c, w_c, _ = rgb_in.shape
        if min(h_c, w_c) > 32 and level < 4:
            # Downsample 2x
            h2, w2 = h_c // 2, w_c // 2
            cov2 = cov.reshape(h2, 2, w2, 2).any(axis=(1, 3))
            knw2 = knw.reshape(h2, 2, w2, 2).any(axis=(1, 3))
            rgb_sum = (rgb_in * knw[:, :, None]).reshape(h2, 2, w2, 2, 3).sum(axis=(1, 3))
            knw_cnt = knw.reshape(h2, 2, w2, 2).sum(axis=(1, 3))[:, :, None]
            rgb2 = np.where(knw_cnt > 0, rgb_sum / np.maximum(knw_cnt, 1.0), 0.0)
            solved2 = solve_laplace_pyramid(rgb2, cov2, knw2, level + 1)
            # Upsample coarse solution to initialize unknown pixels at this level
            up = np.repeat(np.repeat(solved2, 2, axis=0), 2, axis=1)
            out = np.where(knw[:, :, None], rgb_in, up)
        else:
            out = rgb_in.copy()
            unk_base = cov & (~knw)
            out[unk_base] = np.array([0.843, 0.644, 0.422], dtype=np.float32)

        unk = cov & (~knw)
        iters = 80 if level == 0 else 160
        for _ in range(iters):
            acc = np.zeros_like(out)
            cnt = np.zeros((h_c, w_c, 1), dtype=np.float32)
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                sy0, sy1 = max(0, -dy), h_c - max(0, dy)
                dy0, dy1 = max(0, dy), h_c - max(0, -dy)
                sx0, sx1 = max(0, -dx), w_c - max(0, dx)
                dx0, dx1 = max(0, dx), w_c - max(0, -dx)
                m = cov[sy0:sy1, sx0:sx1, None].astype(np.float32)
                acc[dy0:dy1, dx0:dx1] += out[sy0:sy1, sx0:sx1] * m
                cnt[dy0:dy1, dx0:dx1] += m
            valid = unk & (cnt[:, :, 0] > 0)
            out[valid] = acc[valid] / cnt[valid]
        return out

    rgb = solve_laplace_pyramid(rgb, covered, known)

    canvas[:, :, :3] = CANONICAL_SKIN
    canvas[covered, :3] = rgb[covered]
    canvas[:, :, 3] = 1.0

    valid_mask = covered.copy()
    for _ in range(12):
        new_mask = valid_mask.copy()
        acc = np.zeros((H, W, 4), dtype=np.float32)
        cnt = np.zeros((H, W, 1), dtype=np.float32)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            sy0, sy1 = max(0, -dy), H - max(0, dy)
            dy0, dy1 = max(0, dy), H - max(0, -dy)
            sx0, sx1 = max(0, -dx), W - max(0, dx)
            dx0, dx1 = max(0, dx), W - max(0, -dx)
            m = valid_mask[sy0:sy1, sx0:sx1, None].astype(np.float32)
            acc[dy0:dy1, dx0:dx1] += canvas[sy0:sy1, sx0:sx1] * m
            cnt[dy0:dy1, dx0:dx1] += m
        fill = (~valid_mask) & (cnt[:, :, 0] > 0)
        canvas[fill] = acc[fill] / cnt[fill]
        new_mask[fill] = True
        valid_mask = new_mask

    TEX_DIR.mkdir(parents=True, exist_ok=True)
    img = bpy.data.images.new("lara_nude_doll_skin_antigravity_g4h_high", width=W, height=H, alpha=True)
    img.colorspace_settings.name = "sRGB"
    img.pixels.foreach_set(canvas.ravel())
    img.filepath_raw = str(SKIN_TEX_PATH)
    img.file_format = "PNG"
    img.save()
    img.pack()
    print(f"Baked seamless skin texture -> {SKIN_TEX_PATH} ({int(covered.sum())} covered texels, {int(unknown.sum())} diffused texels)")
    return img


def assign_skin_material(body_obj: bpy.types.Object, skin_img: bpy.types.Image) -> None:
    mat = bpy.data.materials.new("Lara_Nude_Skin_Antigravity_G4H_High")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Roughness"].default_value = 0.82
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.15
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = skin_img
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    body_obj.data.materials.clear()
    body_obj.data.materials.append(mat)


def build_armature() -> bpy.types.Object:
    arm8 = bpy.data.objects["Armature.008"]
    arm5 = bpy.data.objects["Armature.005"]

    arm_data = arm8.data.copy()
    arm_data.name = "Armature"
    arm = bpy.data.objects.new("Armature", arm_data)
    arm.location = (0, 0, 0)
    arm.rotation_euler = (0, 0, 0)
    arm.scale = (1, 1, 1)
    bpy.context.scene.collection.objects.link(arm)

    finger5 = {
        b.name.replace(" ", "_"): (b.head_local.copy(), b.tail_local.copy())
        for b in arm5.data.bones
        if "finger" in b.name.lower() or "wrist" in b.name.lower()
    }

    deselect_all()
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")

    ebones = arm.data.edit_bones
    for eb in ebones:
        eb.name = eb.name.replace(" ", "_")

    if "root_ground" in ebones and "root_hips" in ebones:
        ebones["root_hips"].parent = ebones["root_ground"]
        ebones["root_hips"].use_connect = False

    for bname, (head, tail) in finger5.items():
        if bname in ebones:
            if "finger" in bname:
                ebones[bname].head = head
                ebones[bname].tail = tail
            elif "wrist" in bname:
                ebones[bname].tail = tail

    if "spine_upper" in ebones:
        for side, sx in (("left", 0.06), ("right", -0.06)):
            bname = f"breast_{side}_base"
            if bname not in ebones:
                eb = ebones.new(bname)
                eb.parent = ebones["spine_upper"]
                eb.head = Vector((sx, -0.06, 1.31))
                eb.tail = Vector((sx, -0.16272, 1.31))

    bpy.ops.object.mode_set(mode="OBJECT")
    return arm


def clone_head_meshes(arm: bpy.types.Object) -> list[bpy.types.Object]:
    mapping = [
        ("5_Face_1.0_0_0.001", "face"),
        ("5_Eyes_1.0_0_0.001", "eyes"),
        ("7_Eye2_1.0_0_0.001", "eye2"),
        ("7_Lashes_1.0_0_0", "lashes"),
        ("5_Hair2_1.0_0_0", "hair_base"),
        ("7_+Head|Hair.Classic_1.0_0_0", "hair_classic"),
        ("7_-Head|Hair.FMV_1.0_0_0", "hair_fmv"),
        ("5_Braid_1.0_0_0", "braid"),
    ]
    created = []
    for src_name, dst_name in mapping:
        src = bpy.data.objects[src_name]
        obj = src.copy()
        obj.data = src.data.copy()
        obj.name = dst_name
        obj.data.name = dst_name
        obj.parent = arm
        obj.matrix_parent_inverse.identity()
        for vg in obj.vertex_groups:
            vg.name = vg.name.replace(" ", "_")
        obj.modifiers.clear()
        mod = obj.modifiers.new("Armature", "ARMATURE")
        mod.object = arm
        bpy.context.scene.collection.objects.link(obj)
        created.append(obj)
    return created


def main() -> None:
    bpy.ops.wm.open_mainfile(filepath=str(SRC_BLEND))
    unhide_all_collections()

    arm = build_armature()
    head_objs = clone_head_meshes(arm)
    body_obj, donors = build_body_nude_mesh()
    assign_weights(body_obj, donors, arm)
    skin_img = unwrap_and_bake_skin(body_obj, donors)
    assign_skin_material(body_obj, skin_img)

    body_obj.parent = arm
    body_obj.matrix_parent_inverse.identity()
    mod = body_obj.modifiers.new("Armature", "ARMATURE")
    mod.object = arm

    keep = {arm, body_obj, *head_objs}
    for obj in list(bpy.data.objects):
        if obj not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)

    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    bpy.ops.file.pack_all()

    OUT_BLEND.parent.mkdir(parents=True, exist_ok=True)
    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND))
    print(f"Saved blend -> {OUT_BLEND}")

    deselect_all()
    for obj in keep:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_skins=True,
        export_morph=True,
        export_animations=False,
        export_yup=True,
        export_extras=True,
    )
    print(f"Exported GLB -> {OUT_GLB}")


if __name__ == "__main__":
    main()
