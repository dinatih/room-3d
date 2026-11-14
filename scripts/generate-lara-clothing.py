"""
Generate custom-tailored separate GLB garments for Lara from lara_perfect.blend:
  1. public/characters/clothing/lara_legging.glb      (fitted high-waisted cotton-elastane legging)
  2. public/characters/clothing/lara_hoodie_zip.glb   (basic cotton fleece zipped hoodie with hood & pockets)
  3. public/characters/clothing/lara_sweatpants.glb   (matching basic cotton fleece sweatpants / joggers)

Each GLB is self-contained with:
  - Lara's Armature + exact glTF 4-bone normalized skin weights transferred from Lara's body
  - Procedural cotton knit / rib knit / fleece textures (BaseColor + Normal) packed in the GLB
  - Clean quad-based garment topology, seam ridges, tucked hems, drawstrings, and metal zipper details
"""

import math
import os
import bpy
import bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
import numpy as np

BLEND_PATH = os.path.abspath("sources_backup/characters/lara/lara_perfect.blend")
OUT_DIR = os.path.abspath("public/characters/clothing")


# ---------------------------------------------------------------------------
# Procedural Texture Generation (Cotton Jersey, Fleece, 1x1 Rib Knit, Cord)
# ---------------------------------------------------------------------------
def _make_image(name: str, rgba: np.ndarray, colorspace: str = "sRGB") -> bpy.types.Image:
    h, w, _ = rgba.shape
    img = bpy.data.images.new(name, width=w, height=h, alpha=False)
    img.colorspace_settings.name = colorspace
    img.pixels.foreach_set(rgba.ravel().astype(np.float32))
    img.pack()
    return img


def _height_to_normal_rgba(height: np.ndarray, strength: float = 1.0) -> np.ndarray:
    dx = np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)
    dy = np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)
    nx = -dx * strength
    ny = -dy * strength
    nz = np.ones_like(height)
    inv_len = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz + 1e-8)
    nx *= inv_len
    ny *= inv_len
    nz *= inv_len
    h, w = height.shape
    rgba = np.ones((h, w, 4), dtype=np.float32)
    rgba[..., 0] = np.clip(nx * 0.5 + 0.5, 0.0, 1.0)
    rgba[..., 1] = np.clip(ny * 0.5 + 0.5, 0.0, 1.0)
    rgba[..., 2] = np.clip(nz * 0.5 + 0.5, 0.0, 1.0)
    return rgba


def _generate_cotton_textures():
    rng = np.random.default_rng(42)
    size = 512
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)

    u = xx / size * 128.0 * 2.0 * math.pi
    v = yy / size * 160.0 * 2.0 * math.pi
    knit_v = np.sin(v + 0.65 * np.abs(np.sin(u * 0.5))) * 0.5 + np.cos(u) * 0.35

    low_noise = rng.normal(0.0, 1.0, (size // 4, size // 4)).astype(np.float32)
    low_noise = np.repeat(np.repeat(low_noise, 4, axis=0), 4, axis=1)
    fine_noise = rng.normal(0.0, 0.35, (size, size)).astype(np.float32)
    fleece_h = knit_v * 0.38 + low_noise * 0.25 + fine_noise * 0.22

    rib_u = xx / size * 96.0 * 2.0 * math.pi
    rib_v = yy / size * 160.0 * 2.0 * math.pi
    rib_h = np.cos(rib_u) * 0.85 + np.sin(rib_v) * 0.18 + fine_noise * 0.14

    # 1. Rich Crimson / Red Cotton Fleece (Tracksuit main + deeper rib/lining tones)
    base_red_fleece = np.array([0.74, 0.11, 0.14], dtype=np.float32)
    melange = np.clip(1.0 + low_noise * 0.055 + fine_noise * 0.045 + knit_v * 0.015, 0.80, 1.18)
    fleece_rgb = np.clip(base_red_fleece[None, None, :] * melange[..., None], 0.0, 1.0)
    fleece_rgba = np.ones((size, size, 4), dtype=np.float32)
    fleece_rgba[..., :3] = fleece_rgb
    img_red_fleece_col = _make_image("tex_cotton_red_fleece_col", fleece_rgba, "sRGB")

    base_red_rib = np.array([0.62, 0.085, 0.11], dtype=np.float32)
    rib_rgb = np.clip(base_red_rib[None, None, :] * melange[..., None], 0.0, 1.0)
    rib_rgba = np.ones((size, size, 4), dtype=np.float32)
    rib_rgba[..., :3] = rib_rgb
    img_red_rib_col = _make_image("tex_cotton_red_rib_col", rib_rgba, "sRGB")

    base_red_lining = np.array([0.50, 0.068, 0.09], dtype=np.float32)
    lining_rgb = np.clip(base_red_lining[None, None, :] * melange[..., None], 0.0, 1.0)
    lining_rgba = np.ones((size, size, 4), dtype=np.float32)
    lining_rgba[..., :3] = lining_rgb
    img_red_lining_col = _make_image("tex_cotton_red_lining_col", lining_rgba, "sRGB")

    img_fleece_nrm = _make_image("tex_cotton_fleece_nrm", _height_to_normal_rgba(fleece_h, 0.85), "Non-Color")
    img_rib_nrm = _make_image("tex_cotton_rib_nrm", _height_to_normal_rgba(rib_h, 1.15), "Non-Color")

    # 2. Deep Red Cotton-Elastane Jersey (Legging)
    base_red_legging = np.array([0.68, 0.085, 0.12], dtype=np.float32)
    leg_melange = np.clip(1.0 + low_noise * 0.045 + fine_noise * 0.035 + knit_v * 0.020, 0.82, 1.18)
    leg_rgb = np.clip(base_red_legging[None, None, :] * leg_melange[..., None], 0.0, 1.0)
    leg_rgba = np.ones((size, size, 4), dtype=np.float32)
    leg_rgba[..., :3] = leg_rgb
    img_red_legging_col = _make_image("tex_legging_red_col", leg_rgba, "sRGB")
    img_jersey_nrm = _make_image("tex_legging_jersey_nrm", _height_to_normal_rgba(knit_v * 0.6 + fine_noise * 0.15, 0.55), "Non-Color")

    # 3. Braided Red Cotton Drawstring Cord
    cord_u = xx / size * 24.0 * 2.0 * math.pi
    cord_v = yy / size * 48.0 * 2.0 * math.pi
    cord_h = np.sin(cord_u + cord_v) * 0.6 + np.sin(cord_u - cord_v) * 0.4
    cord_col = np.ones((size, size, 4), dtype=np.float32)
    cord_col[..., 0] = np.clip(0.78 + cord_h * 0.05, 0.0, 1.0)
    cord_col[..., 1] = np.clip(0.11 + cord_h * 0.02, 0.0, 1.0)
    cord_col[..., 2] = np.clip(0.14 + cord_h * 0.02, 0.0, 1.0)
    img_cord_col = _make_image("tex_cord_col", cord_col, "sRGB")
    img_cord_nrm = _make_image("tex_cord_nrm", _height_to_normal_rgba(cord_h, 1.2), "Non-Color")

    return {
        "red_fleece_col": img_red_fleece_col,
        "red_rib_col": img_red_rib_col,
        "red_lining_col": img_red_lining_col,
        "fleece_nrm": img_fleece_nrm,
        "rib_nrm": img_rib_nrm,
        "red_legging_col": img_red_legging_col,
        "jersey_nrm": img_jersey_nrm,
        "cord_col": img_cord_col,
        "cord_nrm": img_cord_nrm,
    }


def _make_pbr_material(
    name: str,
    base_color=(0.5, 0.5, 0.5, 1.0),
    roughness: float = 0.88,
    metallic: float = 0.0,
    color_img=None,
    normal_img=None,
    normal_strength: float = 0.45,
    uv_scale: float = 1.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.use_backface_culling = False
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (100, 0)
    bsdf.inputs["Base Color"].default_value = base_color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.25 if metallic == 0.0 else 0.5
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    if color_img is not None or normal_img is not None:
        uv = nodes.new("ShaderNodeTexCoord")
        uv.location = (-750, 0)
        mapping = nodes.new("ShaderNodeMapping")
        mapping.location = (-550, 0)
        mapping.inputs["Scale"].default_value = (uv_scale, uv_scale, 1.0)
        links.new(uv.outputs["UV"], mapping.inputs["Vector"])

        if color_img is not None:
            tex_c = nodes.new("ShaderNodeTexImage")
            tex_c.location = (-280, 160)
            tex_c.image = color_img
            links.new(mapping.outputs["Vector"], tex_c.inputs["Vector"])
            links.new(tex_c.outputs["Color"], bsdf.inputs["Base Color"])

        if normal_img is not None:
            tex_n = nodes.new("ShaderNodeTexImage")
            tex_n.location = (-280, -160)
            tex_n.image = normal_img
            links.new(mapping.outputs["Vector"], tex_n.inputs["Vector"])
            nrm = nodes.new("ShaderNodeNormalMap")
            nrm.location = (-40, -160)
            nrm.inputs["Strength"].default_value = normal_strength
            links.new(tex_n.outputs["Color"], nrm.inputs["Color"])
            links.new(nrm.outputs["Normal"], bsdf.inputs["Normal"])

    return mat


# ---------------------------------------------------------------------------
# Clean Region-Separated Body BVHs & Slice Centroids
# ---------------------------------------------------------------------------
def _build_filtered_bvh(obj_names, face_filter=None):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    for name in obj_names:
        src = bpy.data.objects.get(name)
        if not src:
            raise RuntimeError(f"Missing Lara reference mesh: {name}")
        tmp_mesh = bpy.data.meshes.new_from_object(src.evaluated_get(depsgraph))
        bm.from_mesh(tmp_mesh)
        bpy.data.meshes.remove(tmp_mesh)

    if face_filter is not None:
        to_del = [f for f in bm.faces if not face_filter(f)]
        if to_del:
            bmesh.ops.delete(bm, geom=to_del, context="FACES")
        loose_verts = [v for v in bm.verts if not v.link_faces]
        if loose_verts:
            bmesh.ops.delete(bm, geom=loose_verts, context="VERTS")

    verts = [v.co.copy() for v in bm.verts]
    bvh = BVHTree.FromBMesh(bm)
    bm.free()
    return bvh, verts


def _slice_centroid_z(verts, z: float, tol: float = 0.025, fallback=Vector((0.0, 0.0, 0.0))):
    pts = [p for p in verts if abs(p.z - z) <= tol]
    if not pts:
        pts = [p for p in verts if abs(p.z - z) <= tol * 2.5]
    if not pts:
        return Vector((fallback.x, fallback.y, z))
    cx = 0.5 * (min(p.x for p in pts) + max(p.x for p in pts))
    cy = 0.5 * (min(p.y for p in pts) + max(p.y for p in pts))
    return Vector((cx, cy, z))


def _slice_centroid_x(verts, x: float, tol: float = 0.025):
    pts = [p for p in verts if abs(p.x - x) <= tol]
    if not pts:
        pts = [p for p in verts if abs(p.x - x) <= tol * 2.5]
    if not pts:
        return Vector((x, 0.004, 1.425))
    cy = 0.5 * (min(p.y for p in pts) + max(p.y for p in pts))
    cz = 0.5 * (min(p.z for p in pts) + max(p.z for p in pts))
    return Vector((x, cy, cz))


def _radial_surface_radius(bvh: BVHTree, center: Vector, d: Vector, max_r: float = 0.25) -> float:
    dn = d.normalized()
    best_r = None
    hit_in, _, _, _ = bvh.ray_cast(center + dn * max_r, -dn, max_r * 1.1)
    if hit_in is not None:
        r_in = (hit_in - center).dot(dn)
        if r_in > 0.005:
            best_r = r_in

    hit_out, _, _, _ = bvh.ray_cast(center, dn, max_r)
    if hit_out is not None:
        r_out = (hit_out - center).dot(dn)
        if r_out > 0.005 and (best_r is None or r_out > best_r):
            best_r = r_out

    if best_r is not None:
        return best_r

    loc, _, _, _ = bvh.find_nearest(center + dn * 0.06)
    if loc is not None:
        return max(0.020, (loc - center).dot(dn))
    return 0.05


def _ensure_radial_clearance(p: Vector, center: Vector, bvh: BVHTree, min_clear: float, max_r: float = 0.28) -> Vector:
    diff = p - center
    r = diff.length
    if r < 1e-6:
        return p
    d = diff / r
    r_surf = _radial_surface_radius(bvh, center, d, max_r=max_r)
    if r < r_surf + min_clear:
        return center + d * (r_surf + min_clear)
    return p


def _ensure_z_plane_clearance(p: Vector, center_xy: Vector, bvh: BVHTree, min_clear: float, max_r: float = 0.28) -> Vector:
    d = Vector((p.x - center_xy.x, p.y - center_xy.y, 0.0))
    r = d.length
    if r < 1e-6:
        return p
    dn = d / r
    c = Vector((center_xy.x, center_xy.y, p.z))
    r_surf = _radial_surface_radius(bvh, c, dn, max_r=max_r)
    if r < r_surf + min_clear:
        return c + dn * (r_surf + min_clear)
    return p


def _bridge_convex_radii(radii: list[float], max_dip: float = 0.0020, passes: int = 5) -> list[float]:
    n = len(radii)
    r = list(radii)
    for _ in range(passes):
        nxt = list(r)
        for i in range(n):
            avg = 0.5 * (r[(i - 1) % n] + r[(i + 1) % n])
            if r[i] < avg - max_dip:
                nxt[i] = avg - max_dip * 0.35
        r = nxt
    return r


def _smooth_ring_radii(radii: list[float], passes: int = 2) -> list[float]:
    n = len(radii)
    r = list(radii)
    for _ in range(passes):
        r = [0.25 * r[(i - 1) % n] + 0.5 * r[i] + 0.25 * r[(i + 1) % n] for i in range(n)]
    return r


def _add_tucked_edge(bm: bmesh.types.BMesh, edge_loop_verts, center: Vector, radial_inset: float, axial_offset: Vector):
    n = len(edge_loop_verts)
    inner_verts = []
    for v in edge_loop_verts:
        d = Vector((v.co.x - center.x, v.co.y - center.y, 0.0))
        if d.length > 1e-5:
            d.normalize()
        else:
            d = Vector((0.0, 0.0, 0.0))
        iv = bm.verts.new(v.co - d * radial_inset + axial_offset)
        inner_verts.append(iv)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((edge_loop_verts[i], edge_loop_verts[j], inner_verts[j], inner_verts[i]))
    return inner_verts


# ---------------------------------------------------------------------------
# Deterministic Skinning / Weight Transfer & GLB Export
# ---------------------------------------------------------------------------
def _build_donor_bvh(source_objs, bone_names: set[str], bone_attenuation: dict[str, float] | None):
    donor_bm = bmesh.new()
    vert_weights = []
    for s in source_objs:
        vg_names = [vg.name for vg in s.vertex_groups]
        for v in s.data.vertices:
            wmap = {}
            for g in v.groups:
                bname = vg_names[g.group]
                if bname in bone_names and g.weight > 1e-4:
                    w = g.weight
                    if bone_attenuation and bname in bone_attenuation:
                        w *= bone_attenuation[bname]
                    if w > 1e-4:
                        wmap[bname] = w
            vert_weights.append(wmap)
        tmp_bm = bmesh.new()
        tmp_bm.from_mesh(s.data)
        tmp_bm.verts.ensure_lookup_table()
        new_verts = [donor_bm.verts.new(v.co) for v in tmp_bm.verts]
        for f in tmp_bm.faces:
            try:
                donor_bm.faces.new([new_verts[v.index] for v in f.verts])
            except ValueError:
                pass
        tmp_bm.free()

    donor_bm.verts.ensure_lookup_table()
    donor_bm.faces.ensure_lookup_table()
    donor_bvh = BVHTree.FromBMesh(donor_bm)
    return donor_bm, donor_bvh, vert_weights


def _bind_and_transfer_weights(
    garment_obj,
    source_objs,
    armature_obj,
    bone_attenuation: dict[str, float] | None = None,
    smooth_passes: int = 1,
    region_selector=None,
):
    """
    Transfer bone weights from Lara's native body meshes directly via BVHTree
    nearest-triangle vertex interpolation + topological smoothing, ensuring
    every vertex has <= 4 normalized influences matching Armature bones.
    """
    garment_obj.vertex_groups.clear()
    bone_names = {b.name for b in armature_obj.data.bones}

    donor_cache = {}
    def _get_donor(objs):
        key = tuple(id(o) for o in objs)
        if key not in donor_cache:
            donor_cache[key] = _build_donor_bvh(objs, bone_names, bone_attenuation)
        return donor_cache[key]

    _get_donor(source_objs)

    # Interpolate weights per garment vertex from nearest donor face vertices
    g_verts = garment_obj.data.vertices
    n_gv = len(g_verts)
    raw_weights = []
    for v in g_verts:
        objs = region_selector(v.co) if region_selector is not None else source_objs
        donor_bm, donor_bvh, vert_weights = _get_donor(objs)
        loc, _, f_idx, _ = donor_bvh.find_nearest(v.co)
        w_acc = {}
        if f_idx is not None:
            face = donor_bm.faces[f_idx]
            inv_d_sum = 0.0
            for fv in face.verts:
                d = (fv.co - loc).length
                inv_d = 1.0 / (d + 1e-4)
                inv_d_sum += inv_d
                for bname, bw in vert_weights[fv.index].items():
                    w_acc[bname] = w_acc.get(bname, 0.0) + bw * inv_d
            if inv_d_sum > 0.0:
                for bname in w_acc:
                    w_acc[bname] /= inv_d_sum
        if not w_acc:
            w_acc = {"spine_lower": 1.0}
        raw_weights.append(w_acc)

    for donor_bm, _, _ in donor_cache.values():
        donor_bm.free()

    # Topological smoothing across garment edges for silky bending across joints
    adj = [[] for _ in range(n_gv)]
    for e in garment_obj.data.edges:
        adj[e.vertices[0]].append(e.vertices[1])
        adj[e.vertices[1]].append(e.vertices[0])

    for _ in range(smooth_passes):
        smoothed = []
        for vi in range(n_gv):
            nbrs = adj[vi]
            if not nbrs:
                smoothed.append(raw_weights[vi])
                continue
            acc = {}
            for bname, bw in raw_weights[vi].items():
                acc[bname] = acc.get(bname, 0.0) + bw * 0.60
            nbr_factor = 0.40 / len(nbrs)
            for ni in nbrs:
                for bname, bw in raw_weights[ni].items():
                    acc[bname] = acc.get(bname, 0.0) + bw * nbr_factor
            smoothed.append(acc)
        raw_weights = smoothed

    # Create only used vertex groups and assign top-4 normalized weights
    vg_cache = {}
    for vi, wmap in enumerate(raw_weights):
        top4 = sorted(wmap.items(), key=lambda kv: kv[1], reverse=True)[:4]
        s = sum(w for _, w in top4)
        if s <= 1e-6:
            top4 = [("spine_lower", 1.0)]
            s = 1.0
        for bname, w in top4:
            nw = w / s
            if nw < 1e-4:
                continue
            vg = vg_cache.get(bname)
            if vg is None:
                vg = garment_obj.vertex_groups.new(name=bname)
                vg_cache[bname] = vg
            vg.add([vi], nw, "REPLACE")

    # Unhide Armature so glTF export includes it!
    armature_obj.hide_set(False)
    armature_obj.hide_viewport = False
    garment_obj.parent = armature_obj
    arm_mod = garment_obj.modifiers.new("Armature", "ARMATURE")
    arm_mod.object = armature_obj


def _export_garment_glb(garment_objs, armature_obj, out_filename: str):
    armature_obj.hide_set(False)
    armature_obj.hide_viewport = False
    bpy.ops.object.select_all(action="DESELECT")
    armature_obj.select_set(True)
    for obj in garment_objs:
        obj.hide_set(False)
        obj.hide_viewport = False
        obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj

    out_path = os.path.join(OUT_DIR, out_filename)
    os.makedirs(OUT_DIR, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_skins=True,
        export_all_influences=False,
        export_def_bones=False,
        export_materials="EXPORT",
        export_normals=True,
        export_texcoords=True,
        export_tangents=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    print(f"Exported {out_path} ({os.path.getsize(out_path)} bytes)")


# ---------------------------------------------------------------------------
# Trouser Mesh Generator (Legging & Sweatpants)
# ---------------------------------------------------------------------------
def build_trousers(
    name: str,
    bvh_left_leg: BVHTree,
    verts_left_leg,
    bvh_right_leg: BVHTree,
    verts_right_leg,
    bvh_pelvis: BVHTree,
    verts_pelvis,
    z_ankle: float,
    z_cuff_top: float,
    z_crotch: float,
    z_waist_band_bot: float,
    z_waist_top: float,
    clearance_leg: callable,
    clearance_pelvis: callable,
    max_dip_pelvis: float,
    n_leg: int = 32,
    mat_main=None,
    mat_band=None,
    add_waistband_ribs: bool = False,
    add_side_seam_ridge: bool = False,
    add_pocket_welts: bool = False,
    add_drawstrings: bool = False,
    mat_cord=None,
    mat_metal=None,
    mat_trim=None,
):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    leg_zs = []
    for i in range(5):
        leg_zs.append(z_ankle + (z_cuff_top - z_ankle) * (i / 4.0))
    n_upper_leg = 22
    for i in range(1, n_upper_leg + 1):
        leg_zs.append(z_cuff_top + (z_crotch - z_crotch * 0.0 - z_cuff_top) * (i / n_upper_leg))

    leg_rings = {1: [], -1: []}
    leg_data = {
        1: (bvh_left_leg, verts_left_leg, Vector((0.072, 0.0, 0.5))),
        -1: (bvh_right_leg, verts_right_leg, Vector((-0.072, 0.0, 0.5))),
    }

    for side in (1, -1):
        bvh_l, verts_l, fb = leg_data[side]
        for zi, z in enumerate(leg_zs):
            c = _slice_centroid_z(verts_l, z, tol=0.025, fallback=fb)
            radii = []
            dirs = []
            for k in range(n_leg):
                ang = (k / n_leg) * 2.0 * math.pi
                dx = -side * math.cos(ang)
                dy = math.sin(ang)
                d = Vector((dx, dy, 0.0))
                r = _radial_surface_radius(bvh_l, c, d, max_r=0.14)
                radii.append(r)
                dirs.append(d)

            radii = _bridge_convex_radii(radii, max_dip=0.0020, passes=2)
            radii = _smooth_ring_radii(radii, passes=1)

            ring_verts = []
            for k in range(n_leg):
                ang = (k / n_leg) * 2.0 * math.pi
                clr = clearance_leg(z, ang, zi)
                if add_side_seam_ridge and (k == n_leg // 2 or k == 0):
                    clr += 0.0009
                p = c + dirs[k] * (radii[k] + clr)
                if side == 1 and p.x < 0.0025:
                    p.x = 0.0025
                elif side == -1 and p.x > 0.0018:
                    p.x = 0.0018
                ring_verts.append(bm.verts.new(p))
            leg_rings[side].append(ring_verts)

    for side in (1, -1):
        rings = leg_rings[side]
        for zi in range(len(rings) - 1):
            r0 = rings[zi]
            r1 = rings[zi + 1]
            for k in range(n_leg):
                kn = (k + 1) % n_leg
                if side == -1:
                    bm.faces.new((r0[k], r0[kn], r1[kn], r1[k]))
                else:
                    bm.faces.new((r0[k], r1[k], r1[kn], r0[kn]))

    for side in (1, -1):
        _, verts_l, fb = leg_data[side]
        c_ank = _slice_centroid_z(verts_l, z_ankle, tol=0.025, fallback=fb)
        _add_tucked_edge(bm, leg_rings[side][0], c_ank, 0.0045, Vector((0.0, 0.0, 0.008)))

    # Crotch Saddle Bridge + Pelvis / Waist Rings
    l_top = leg_rings[1][-1]
    r_top = leg_rings[-1][-1]

    v_crotch_mid = bm.verts.new(Vector((0.0022, 0.005, z_crotch - 0.005)))
    v_crotch_front = bm.verts.new(Vector((0.0022, -0.048, z_crotch + 0.022)))
    v_crotch_back = bm.verts.new(Vector((0.0022, 0.056, z_crotch + 0.022)))

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
    n_pelvis = len(pelvis_loop_0)

    pelvis_zs = []
    n_hip_rings = 11
    for i in range(1, n_hip_rings + 1):
        pelvis_zs.append(z_crotch + (z_waist_band_bot - z_crotch) * (i / n_hip_rings))
    n_band_rings = 6
    for i in range(1, n_band_rings + 1):
        pelvis_zs.append(z_waist_band_bot + (z_waist_top - z_waist_band_bot) * (i / n_band_rings))

    pelvis_rings = [pelvis_loop_0]
    for zi, z in enumerate(pelvis_zs):
        c = _slice_centroid_z(verts_pelvis, z, tol=0.025, fallback=Vector((0.0022, 0.0, z)))
        radii = []
        dirs = []
        thetas = []
        for pi in range(n_pelvis):
            theta = -0.5 * math.pi + (pi / n_pelvis) * 2.0 * math.pi
            d = Vector((math.cos(theta), math.sin(theta), 0.0))
            r = _radial_surface_radius(bvh_pelvis, c, d, max_r=0.25)
            radii.append(r)
            dirs.append(d)
            thetas.append(theta)

        radii = _bridge_convex_radii(radii, max_dip=max_dip_pelvis, passes=6)
        radii = _smooth_ring_radii(radii, passes=2)

        is_band = z >= z_waist_band_bot - 1e-4
        band_t = (z - z_waist_band_bot) / max(1e-5, (z_waist_top - z_waist_band_bot)) if is_band else 0.0
        rib_bump = 0.0012 * math.sin(band_t * math.pi * 6.0) if (is_band and add_waistband_ribs) else 0.0

        ring_verts = []
        for pi in range(n_pelvis):
            clr = clearance_pelvis(z, thetas[pi], is_band, band_t) + rib_bump
            if add_side_seam_ridge and (pi == n_pelvis // 4 or pi == 3 * n_pelvis // 4):
                clr += 0.0009
            p = c + dirs[pi] * (radii[pi] + clr)
            if zi < 2:
                prev_p = pelvis_rings[-1][pi].co
                blend = 0.42 if zi == 0 else 0.78
                p = prev_p.lerp(p, blend)
                if z >= 0.805:
                    p = _ensure_z_plane_clearance(p, Vector((c.x, c.y)), bvh_pelvis, 0.0035, max_r=0.25)
            ring_verts.append(bm.verts.new(p))
        pelvis_rings.append(ring_verts)

    for zi in range(len(pelvis_rings) - 1):
        r0 = pelvis_rings[zi]
        r1 = pelvis_rings[zi + 1]
        for pi in range(n_pelvis):
            pn = (pi + 1) % n_pelvis
            bm.faces.new((r0[pi], r0[pn], r1[pn], r1[pi]))

    c_waist = _slice_centroid_z(verts_pelvis, z_waist_top, tol=0.025, fallback=Vector((0.0022, 0.0, z_waist_top)))
    _add_tucked_edge(bm, pelvis_rings[-1], c_waist, 0.0045, Vector((0.0, 0.0, -0.007)))

    welt_faces = set()
    if add_pocket_welts:
        for side in (1, -1):
            welt_top = []
            welt_bot = []
            for s in range(8):
                t = s / 7.0
                z_p = 1.005 - 0.135 * t
                theta_p = (-0.08 if side == 1 else math.pi + 0.08) - side * 0.36 * (1.0 - t)
                c_p = _slice_centroid_z(verts_pelvis, z_p, tol=0.025, fallback=Vector((0.0022, 0.0, z_p)))
                d_p = Vector((math.cos(theta_p), math.sin(theta_p), 0.0))
                r_p = _radial_surface_radius(bvh_pelvis, c_p, d_p, max_r=0.25)
                clr_w = clearance_pelvis(z_p, theta_p, False, 0.0)
                p_out = c_p + d_p * (r_p + clr_w + 0.0032)
                p_in = c_p + d_p * (r_p + clr_w - 0.0022) + Vector((0.006 * side, -0.006, 0.0))
                welt_top.append(bm.verts.new(p_out))
                welt_bot.append(bm.verts.new(p_in))
            for s in range(7):
                if side == 1:
                    f = bm.faces.new((welt_top[s], welt_bot[s], welt_bot[s + 1], welt_top[s + 1]))
                else:
                    f = bm.faces.new((welt_top[s], welt_top[s + 1], welt_bot[s + 1], welt_bot[s]))
                welt_faces.add(f)

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        for loop in f.loops:
            co = loop.vert.co
            ang = math.atan2(co.y, co.x - (0.068 if co.x > 0.02 else (-0.068 if co.x < -0.02 else 0.0)))
            loop[uv_layer].uv = ((ang / (2.0 * math.pi) + 0.5) * 1.6, co.z * 2.2)

    # Material indices: 0=main, 1=band (if any), 2=trim (if any)
    for f in bm.faces:
        if mat_trim is not None and f in welt_faces:
            f.material_index = 2 if (mat_band is not None and mat_band != mat_main) else 1
        else:
            f.material_index = 0

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    obj.data.materials.append(mat_main)
    idx_band = 0
    if mat_band is not None and mat_band != mat_main:
        obj.data.materials.append(mat_band)
        idx_band = len(obj.data.materials) - 1
    if mat_trim is not None:
        obj.data.materials.append(mat_trim)

    if idx_band > 0:
        for poly in obj.data.polygons:
            if poly.material_index == 0:
                z_avg = sum(obj.data.vertices[vi].co.z for vi in poly.vertices) / len(poly.vertices)
                if z_avg >= z_waist_band_bot - 0.002 or z_avg <= z_cuff_top + 0.002:
                    poly.material_index = idx_band

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        z = v.co.z
        if z >= 0.805:
            c_p = _slice_centroid_z(verts_pelvis, z, tol=0.03, fallback=Vector((0.0022, 0.0, z)))
            clr_p = 0.0068 if (v.co.y > 0.02 and 0.805 <= z <= 0.98) else 0.0052
            v.co = _ensure_z_plane_clearance(v.co, Vector((c_p.x, c_p.y)), bvh_pelvis, clr_p, max_r=0.25)
        elif v.co.x > 0.008:
            c_l = _slice_centroid_z(verts_left_leg, z, tol=0.03, fallback=Vector((0.072, 0.0, z)))
            clr_min = 0.0062 if 0.46 < z < 0.62 else 0.0046
            v.co = _ensure_z_plane_clearance(v.co, Vector((c_l.x, c_l.y)), bvh_left_leg, clr_min, max_r=0.14)
        elif v.co.x < -0.004:
            c_r = _slice_centroid_z(verts_right_leg, z, tol=0.03, fallback=Vector((-0.072, 0.0, z)))
            clr_min = 0.0062 if 0.46 < z < 0.62 else 0.0046
            v.co = _ensure_z_plane_clearance(v.co, Vector((c_r.x, c_r.y)), bvh_right_leg, clr_min, max_r=0.14)

    if add_drawstrings and mat_cord is not None:
        cords_obj = _build_drawstrings(
            f"{name}_drawstrings",
            bvh_pelvis,
            verts_pelvis,
            eyelets=[(-0.014, 1.054), (0.018, 1.054)],
            z_end=0.955,
            mat_cord=mat_cord,
            mat_metal=mat_metal,
            extra_y=-0.015,
        )
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        cords_obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.join()

    return obj


# ---------------------------------------------------------------------------
# Drawstrings Helper
# ---------------------------------------------------------------------------
def _build_drawstrings(name: str, bvh_front: BVHTree, verts_front, eyelets, z_end: float, mat_cord, mat_metal=None, extra_y: float = -0.016):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")
    aglet_faces = set()

    for side_idx, (ex, ez) in enumerate(eyelets):
        sign = -1.0 if side_idx == 0 else 1.0
        pts = []
        n_steps = 14
        for i in range(n_steps):
            t = i / (n_steps - 1)
            z = ez - (ez - z_end) * t
            x = ex + sign * 0.010 * math.sin(t * math.pi * 0.75) + sign * 0.004 * t
            c = _slice_centroid_z(verts_front, z, tol=0.03, fallback=Vector((0.0022, 0.0, z)))
            r_surf = _radial_surface_radius(bvh_front, Vector((x, c.y, z)), Vector((0.0, -1.0, 0.0)), max_r=0.22)
            y = c.y - r_surf + extra_y - 0.004 * math.sin(t * math.pi)
            pts.append(Vector((x, y, z)))

        n_rad = 8
        radius = 0.0025
        rings = []
        for i, p in enumerate(pts):
            if i == 0:
                tang = (pts[1] - pts[0]).normalized()
            elif i == len(pts) - 1:
                tang = (pts[-1] - pts[-2]).normalized()
            else:
                tang = (pts[i + 1] - pts[i - 1]).normalized()
            up_ref = Vector((1.0, 0.0, 0.0)) if abs(tang.x) < 0.8 else Vector((0.0, 1.0, 0.0))
            b1 = tang.cross(up_ref).normalized()
            b2 = tang.cross(b1).normalized()
            r_cur = radius * (1.18 if i >= n_steps - 2 else 1.0)
            rv = []
            for k in range(n_rad):
                a = (k / n_rad) * 2.0 * math.pi
                rv.append(bm.verts.new(p + (b1 * math.cos(a) + b2 * math.sin(a)) * r_cur))
            rings.append(rv)

        for i in range(len(rings) - 1):
            for k in range(n_rad):
                kn = (k + 1) % n_rad
                f = bm.faces.new((rings[i][k], rings[i][kn], rings[i + 1][kn], rings[i + 1][k]))
                if i >= len(rings) - 3:
                    aglet_faces.add(f)
        aglet_faces.add(bm.faces.new(rings[-1]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        for loop in f.loops:
            loop[uv_layer].uv = (loop.vert.co.x * 18.0, loop.vert.co.z * 18.0)

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(mat_cord)
    if mat_metal is not None:
        obj.data.materials.append(mat_metal)
        for poly in obj.data.polygons:
            z_avg = sum(obj.data.vertices[vi].co.z for vi in poly.vertices) / len(poly.vertices)
            if z_avg <= z_end + 0.015:
                poly.material_index = 1
    return obj


# ---------------------------------------------------------------------------
# Zipped Cotton Hoodie Generator (lara_hoodie_zip.glb)
# ---------------------------------------------------------------------------
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
    mat_zip_metal,
    mat_cord,
    *,
    z_hem_bot: float = 0.960,
    z_hem_top: float = 1.015,
    n_body_z: int = 30,
    include_sleeves: bool = True,
    include_pockets: bool = True,
    tank_armhole: bool = False,
):
    bm = bmesh.new()
    uv_layer = bm.loops.layers.uv.new("UVMap")

    z_collar = 1.476
    n_theta = 48

    zs = []
    for i in range(5):
        zs.append(z_hem_bot + (z_hem_top - z_hem_bot) * (i / 4.0))
    for i in range(1, n_body_z + 1):
        zs.append(z_hem_top + (z_collar - z_hem_top) * (i / n_body_z))
    n_rings = len(zs)

    torso_grid = []
    torso_centers = []
    hem_clr = 0.0105 if z_hem_bot > 1.10 else 0.0085
    for zi, z in enumerate(zs):
        c = _slice_centroid_z(verts_torso, z, tol=0.028, fallback=Vector((0.0022, -0.010, z)))
        torso_centers.append(c)
        is_hem = z <= z_hem_top + 1e-4
        radii = []
        dirs = []
        thetas = []
        for j in range(n_theta):
            t = j / (n_theta - 1)
            gap_ang = 0.065 if z < 1.38 else (0.065 + 0.14 * ((z - 1.38) / (z_collar - 1.38)) ** 2)
            theta = (-0.5 * math.pi + gap_ang) + t * (2.0 * math.pi - 2.0 * gap_ang)
            d = Vector((math.cos(theta), math.sin(theta), 0.0))
            r = _radial_surface_radius(bvh_torso, c, d, max_r=0.22)
            radii.append(r)
            dirs.append(d)
            thetas.append(theta)

        radii = _bridge_convex_radii(radii, max_dip=0.0018, passes=8)
        radii = _smooth_ring_radii(radii, passes=3)

        ring_verts = []
        for j in range(n_theta):
            th = thetas[j]
            r_eff = radii[j]
            if tank_armhole and z >= 1.430:
                # Prevent 3D find_nearest at shoulder/neck slope from grabbing lower deltoids:
                # taper lateral strap boundary smoothly inward toward the neck base (|x| ~ 0.062).
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
                # Extra vertical shoulder cap ease so deltoids never poke through
                shoulder_ease = 0.004 * (math.cos(th) ** 2)
                clr = 0.0105 + shoulder_ease - 0.002 * ((z - 1.40) / (z_collar - 1.40))

            p = c + dirs[j] * (r_eff + clr)
            if not (tank_armhole and z >= 1.430):
                p = _ensure_z_plane_clearance(p, Vector((c.x, c.y)), bvh_torso, 0.0080, max_r=0.22)
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
                c_ref = _slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.010, v.co.z)))
                rad_out = Vector((v.co.x - c_ref.x, v.co.y - c_ref.y, 0.0)).normalized()
                in_hole = (c_hole - v.co).normalized()
                p_rim = v.co + rad_out * 0.0028 + in_hole * 0.0085
                if p_rim.z < 1.430:
                    p_rim = _ensure_z_plane_clearance(p_rim, Vector((c_ref.x, c_ref.y)), bvh_torso, 0.0085, max_r=0.22)
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
        c_sh = _slice_centroid_x(verts_arm, x_start, tol=0.03)
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
            c_arm = _slice_centroid_x(verts_arm, x, tol=0.025)
            t_arm = max(0.0, min(1.0, (abs(x) - 0.13) / (0.56 - 0.13)))

            ring_v = []
            for k in range(n_sl):
                ang = hole_angles[k]
                d = Vector((0.0, math.cos(ang), math.sin(ang)))
                r = _radial_surface_radius(bvh_arm, c_arm, d, max_r=0.11)
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
                    p = _ensure_radial_clearance(p, c_arm, bvh_arm, 0.0125, max_r=0.11)
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
        c_wrist = _slice_centroid_x(verts_arm, x_wrist, tol=0.025)
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
    # Split Kangaroo Pockets (with subtle darker entry welt trim)
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
                    # Outer pocket entry lip strip gets subtle trim shade
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
    # Cupped Watertight Draped Hood (2-manifold closed pouch flush on collar)
    # -----------------------------------------------------------------------
    # Kept strictly disconnected (2-manifold watertight pouch) from torso_grid[-1]
    # so there are zero 3-way non-manifold seams while kissing the collar line seamlessly.
    hood_margin = 13 if tank_armhole else 5
    hood_col_indices = list(range(hood_margin, n_theta - hood_margin))
    n_hc = len(hood_col_indices)

    # 16-station non-self-intersecting CCW cross-section in (u_frac, v_frac):
    # 0..3: underside wall resting cleanly on upper back; 4: bottom U-fold hem;
    # 5..8: plump outer fleece shell (+Y); 9: soft slumped top hood rim;
    # 10..15: concave inner lining bowl returning seamlessly to the inner collar lip.
    hood_profile = [
        (0.00,  0.00),   # 0: seam outer lip anchored directly on torso collar
        (0.02, -0.35),   # 1: underside wall upper
        (0.05, -0.70),   # 2: underside wall lower
        (0.18, -0.96),   # 3: bottom U-fold under-bend
        (0.50, -1.02),   # 4: bottom U-fold hem
        (0.84, -0.88),   # 5: outer fleece lower swell
        (1.00, -0.58),   # 6: outer fleece max plumpness (+Y)
        (0.96, -0.32),   # 7: outer fleece upper slope
        (0.82, -0.14),   # 8: outer fleece upper slumped crest
        (0.66, -0.08),   # 9: rolled upper opening rim
        (0.62, -0.22),   # 10: inner lining outer-wall upper
        (0.66, -0.52),   # 11: inner lining outer-wall lower
        (0.46, -0.80),   # 12: inner lining pocket floor
        (0.24, -0.52),   # 13: inner lining collar-side slope
        (0.14, -0.20),   # 14: inner lining throat curve
        (0.10, +0.01),   # 15: inner lining collar lip (flush inside collar)
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

        # Smooth drape axis: collar radial outward at front corners, turning cleanly
        # straight backward (+Y) across the upper back between the shoulder blades.
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

            c_ref = _slice_centroid_z(verts_torso, z_pt, tol=0.03, fallback=Vector((0.0022, -0.010, z_pt)))
            # Underside resting path starts directly on collar base and glides down/back
            # cleanly outside the hoodie torso surface (1.65 cm clearance when v_frac < 0).
            back_slope = 0.036 * w * min(1.0, abs(v_frac))
            p_under = Vector((base.x, base.y, z_pt)) + d_drape * back_slope
            if abs(v_frac) > 0.04:
                p_under = _ensure_z_plane_clearance(
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
        c0 = hood_rings[k]
        c1 = hood_rings[k + 1]
        for s in range(n_hp):
            sn = (s + 1) % n_hp
            f = bm.faces.new((c0[s], c0[sn], c1[sn], c1[s]))
            hood_faces.append(f)
            if 9 <= s <= 14:
                lining_faces.append(f)
            elif 5 <= s <= 7 and 0.25 <= (k / (n_hc - 1)) <= 0.75:
                hood_outer_check_faces.append(f)

    # Watertight U-wall end-caps at left (k=0) and right (k=n_hc-1) collar ends
    # Partition the 16-gon strictly inside the fabric thickness so no chord crosses the open mouth.
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

    # Orient the watertight 2-manifold hood unit outward & verify back outer faces point +Y
    bmesh.ops.recalc_face_normals(bm, faces=hood_faces)
    if hood_outer_check_faces:
        bm.normal_update()
        avg_outer_ny = sum(f.normal.y for f in hood_outer_check_faces) / len(hood_outer_check_faces)
        if avg_outer_ny < 0.0:
            bmesh.ops.reverse_faces(bm, faces=hood_faces)

    # -----------------------------------------------------------------------
    # Full-Length Front Zipper Tape + Metallic Teeth + Slider & Pull Tab
    # -----------------------------------------------------------------------
    zip_tape_faces = []
    zip_metal_faces = []
    z_zip_top = 1.430
    zip_rows_tape = []
    zip_rows_teeth = []
    for zi in range(n_rings):
        if zs[zi] > z_zip_top + 0.015:
            continue
        vL = torso_grid[zi][0].co
        vR = torso_grid[zi][-1].co
        mid = 0.5 * (vL + vR)
        tL = bm.verts.new(vL + Vector((-0.001, 0.0005, 0.0)))
        tML = bm.verts.new(mid + Vector((-0.0032, -0.0008, 0.0)))
        tMR = bm.verts.new(mid + Vector((+0.0032, -0.0008, 0.0)))
        tR = bm.verts.new(vR + Vector((+0.001, 0.0005, 0.0)))
        zip_rows_tape.append((tL, tML, tMR, tR))

        mL = bm.verts.new(mid + Vector((-0.0028, -0.0028, 0.0)))
        mR = bm.verts.new(mid + Vector((+0.0028, -0.0028, 0.0)))
        zip_rows_teeth.append((tML, mL, mR, tMR))

    for r in range(len(zip_rows_tape) - 1):
        a0, a1, a2, a3 = zip_rows_tape[r]
        b0, b1, b2, b3 = zip_rows_tape[r + 1]
        zip_tape_faces.append(bm.faces.new((a0, b0, b1, a1)))
        zip_tape_faces.append(bm.faces.new((a2, b2, b3, a3)))
        zip_tape_faces.append(bm.faces.new((a1, b1, b2, a2)))

        c0, c1, c2, c3 = zip_rows_teeth[r]
        d0, d1, d2, d3 = zip_rows_teeth[r + 1]
        zip_metal_faces.append(bm.faces.new((c0, d0, d1, c1)))
        zip_metal_faces.append(bm.faces.new((c1, d1, d2, c2)))
        zip_metal_faces.append(bm.faces.new((c2, d2, d3, c3)))

    slider_faces = []
    top_mid = 0.5 * (zip_rows_teeth[-1][1].co + zip_rows_teeth[-1][2].co)
    slider_mat_loc = Matrix.Translation(top_mid + Vector((0.0, -0.0025, 0.0)))
    res_sl = bmesh.ops.create_cube(bm, size=1.0)
    for v in res_sl["verts"]:
        v.co = slider_mat_loc @ Vector((v.co.x * 0.009, v.co.y * 0.0055, v.co.z * 0.013))
        for f in v.link_faces:
            if f not in slider_faces:
                slider_faces.append(f)
    zip_metal_faces.extend(slider_faces)
    bmesh.ops.recalc_face_normals(bm, faces=slider_faces)

    pull_faces = []
    pull_mat_loc = Matrix.Translation(top_mid + Vector((0.0, -0.0065, -0.013))) @ Matrix.Rotation(-0.18, 4, "X")
    res_pl = bmesh.ops.create_cube(bm, size=1.0)
    for v in res_pl["verts"]:
        v.co = pull_mat_loc @ Vector((v.co.x * 0.0065, v.co.y * 0.0022, v.co.z * 0.017))
        for f in v.link_faces:
            if f not in pull_faces:
                pull_faces.append(f)
    zip_metal_faces.extend(pull_faces)
    bmesh.ops.recalc_face_normals(bm, faces=pull_faces)

    # Explicitly orient each tracked garment sub-part (never guess by X coordinate)
    bm.normal_update()
    for f in torso_shell_faces:
        fc = f.calc_center_median()
        c_t = _slice_centroid_z(verts_torso, fc.z, tol=0.03, fallback=Vector((0.0022, -0.010, fc.z)))
        rad = Vector((fc.x - c_t.x, fc.y - c_t.y, 0.03 if fc.z > 1.445 else 0.0))
        if rad.length > 1e-6 and rad.dot(f.normal) < 0.0:
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
        c_t = _slice_centroid_z(verts_torso, fc.z, tol=0.03, fallback=Vector((0.0022, -0.010, fc.z)))
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
    slider_pull_set = set(slider_faces) | set(pull_faces)
    for f in set(zip_tape_faces) | (set(zip_metal_faces) - slider_pull_set):
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
    lining_set = set(lining_faces)
    tape_set = set(zip_tape_faces) | set(pocket_trim_faces)
    metal_set = set(zip_metal_faces)

    for f in bm.faces:
        if f in metal_set:
            f.material_index = 4
        elif f in tape_set:
            f.material_index = 3
        elif f in lining_set:
            f.material_index = 2
        elif f in hem_set or f in cuff_set:
            f.material_index = 1
        else:
            f.material_index = 0

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for p in mesh.polygons:
        p.use_smooth = True

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for m in (mat_fleece, mat_rib, mat_lining, mat_zip_tape, mat_zip_metal):
        obj.data.materials.append(m)

    sub = obj.modifiers.new("Subsurf", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)

    for v in obj.data.vertices:
        if include_sleeves and v.co.x > 0.165 and v.co.z > 1.30:
            c_a = _slice_centroid_x(verts_left_arm, v.co.x, tol=0.03)
            clr_a = 0.0110 if v.co.x < 0.25 else 0.0055
            v.co = _ensure_radial_clearance(v.co, c_a, bvh_left_arm, clr_a, max_r=0.11)
        elif include_sleeves and v.co.x < -0.165 and v.co.z > 1.30:
            c_a = _slice_centroid_x(verts_right_arm, v.co.x, tol=0.03)
            clr_a = 0.0110 if v.co.x > -0.25 else 0.0055
            v.co = _ensure_radial_clearance(v.co, c_a, bvh_right_arm, clr_a, max_r=0.11)
        else:
            c_t = _slice_centroid_z(verts_torso, v.co.z, tol=0.03, fallback=Vector((0.0022, -0.01, v.co.z)))
            v.co = _ensure_z_plane_clearance(v.co, Vector((c_t.x, c_t.y)), bvh_torso, 0.0065, max_r=0.22)

    cords_obj = _build_drawstrings(
        f"{name}_hood_cords",
        bvh_torso,
        verts_torso,
        eyelets=[(-0.026, 1.448), (0.030, 1.448)],
        z_end=1.320 if z_hem_bot > 1.10 else 1.305,
        mat_cord=mat_cord,
        mat_metal=mat_zip_metal,
        extra_y=-0.016,
    )
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    cords_obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.join()

    return obj


# ---------------------------------------------------------------------------
# Main Build Entry Point
# ---------------------------------------------------------------------------
def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
    armature = bpy.data.objects["Armature"]

    textures = _generate_cotton_textures()

    mat_legging = _make_pbr_material(
        "Legging_Cotton_Red",
        base_color=(0.42, 0.015, 0.025, 1.0),
        roughness=0.86,
        metallic=0.0,
        color_img=textures["red_legging_col"],
        normal_img=textures["jersey_nrm"],
        normal_strength=0.40,
        uv_scale=2.2,
    )
    mat_fleece = _make_pbr_material(
        "Cotton_Fleece_Red",
        base_color=(0.50, 0.020, 0.030, 1.0),
        roughness=0.90,
        metallic=0.0,
        color_img=textures["red_fleece_col"],
        normal_img=textures["fleece_nrm"],
        normal_strength=0.50,
        uv_scale=2.0,
    )
    mat_rib = _make_pbr_material(
        "Cotton_Rib_Red",
        base_color=(0.36, 0.014, 0.022, 1.0),
        roughness=0.90,
        metallic=0.0,
        color_img=textures["red_rib_col"],
        normal_img=textures["rib_nrm"],
        normal_strength=0.65,
        uv_scale=2.5,
    )
    mat_lining = _make_pbr_material(
        "Cotton_Hood_Lining_Red",
        base_color=(0.24, 0.010, 0.016, 1.0),
        roughness=0.95,
        metallic=0.0,
        color_img=textures["red_lining_col"],
        normal_img=textures["jersey_nrm"],
        normal_strength=0.35,
        uv_scale=2.2,
    )
    mat_zip_tape = _make_pbr_material(
        "Zipper_Tape_Red",
        base_color=(0.28, 0.012, 0.020, 1.0),
        roughness=0.88,
        metallic=0.0,
    )
    mat_zip_metal = _make_pbr_material(
        "Zipper_Metal_Nickel",
        base_color=(0.76, 0.78, 0.81, 1.0),
        roughness=0.28,
        metallic=0.88,
    )
    mat_cord = _make_pbr_material(
        "Cotton_Drawstring_Red",
        base_color=(0.56, 0.022, 0.032, 1.0),
        roughness=0.92,
        metallic=0.0,
        color_img=textures["cord_col"],
        normal_img=textures["cord_nrm"],
        normal_strength=0.55,
        uv_scale=1.0,
    )

    bvh_left_leg, verts_left_leg = _build_filtered_bvh(
        ["body_nude_feet", "body_nude_legs"],
        face_filter=lambda f: f.calc_center_median().x > 0.0022 and f.calc_center_median().z < 0.86,
    )
    bvh_right_leg, verts_right_leg = _build_filtered_bvh(
        ["body_nude_feet", "body_nude_legs"],
        face_filter=lambda f: f.calc_center_median().x <= 0.0022 and f.calc_center_median().z < 0.86,
    )
    bvh_pelvis, verts_pelvis = _build_filtered_bvh(
        ["body_nude_legs", "body_nude_panties", "body_nude_torso"],
        face_filter=lambda f: 0.77 <= f.calc_center_median().z <= 1.15,
    )
    bvh_torso, verts_torso = _build_filtered_bvh(
        ["body_nude_legs", "body_nude_panties", "body_nude_torso"],
        face_filter=lambda f: 0.90 <= f.calc_center_median().z <= 1.50,
    )
    bvh_left_arm, verts_left_arm = _build_filtered_bvh(
        ["arms"],
        face_filter=lambda f: f.calc_center_median().x > 0.0,
    )
    bvh_right_arm, verts_right_arm = _build_filtered_bvh(
        ["arms"],
        face_filter=lambda f: f.calc_center_median().x < 0.0,
    )

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
    donor_arms_only = [
        bpy.data.objects["arms"],
    ]
    donor_top = donor_torso_only + donor_arms_only

    # 1. Legging
    legging = build_trousers(
        name="lara_legging",
        bvh_left_leg=bvh_left_leg,
        verts_left_leg=verts_left_leg,
        bvh_right_leg=bvh_right_leg,
        verts_right_leg=verts_right_leg,
        bvh_pelvis=bvh_pelvis,
        verts_pelvis=verts_pelvis,
        z_ankle=0.145,
        z_cuff_top=0.175,
        z_crotch=0.778,
        z_waist_band_bot=1.045,
        z_waist_top=1.095,
        clearance_leg=lambda z, ang, zi: 0.0055 + (0.0018 if 0.46 < z < 0.62 else 0.0),
        clearance_pelvis=lambda z, th, is_band, bt: (
            0.0074 if is_band else (0.0086 if (math.sin(th) > 0.15 and 0.80 < z < 0.98) else 0.0058)
        ),
        max_dip_pelvis=0.0018,
        n_leg=32,
        mat_main=mat_legging,
        mat_band=mat_legging,
        add_waistband_ribs=False,
        add_side_seam_ridge=True,
        add_pocket_welts=False,
        add_drawstrings=False,
    )
    _bind_and_transfer_weights(legging, donor_legs, armature, smooth_passes=1)
    _export_garment_glb([legging], armature, "lara_legging.glb")

    # 2. Sweatpants (Cotton Tracksuit Bottom)
    def _sweat_leg_clr(z: float, ang: float, zi: int) -> float:
        if z <= 0.225:
            base = 0.0055 + 0.0105 * max(0.0, min(1.0, (z - 0.185) / 0.04))
        else:
            base = 0.0155 + 0.0038 * math.sin((z - 0.22) / 0.56 * math.pi) + 0.0016 * math.cos(ang * 3.0)
        # Keep high inner thigh slim near crotch so legs stay cleanly separated when stepping forward
        if z > 0.60 and math.cos(ang) > 0.0:
            inner_t = max(0.0, min(1.0, (z - 0.60) / 0.18)) * math.cos(ang)
            return base * (1.0 - 0.62 * inner_t)
        return base

    sweatpants = build_trousers(
        name="lara_sweatpants",
        bvh_left_leg=bvh_left_leg,
        verts_left_leg=verts_left_leg,
        bvh_right_leg=bvh_right_leg,
        verts_right_leg=verts_right_leg,
        bvh_pelvis=bvh_pelvis,
        verts_pelvis=verts_pelvis,
        z_ankle=0.155,
        z_cuff_top=0.205,
        z_crotch=0.778,
        z_waist_band_bot=1.022,
        z_waist_top=1.080,
        clearance_leg=_sweat_leg_clr,
        clearance_pelvis=lambda z, th, is_band, bt: 0.0082 if is_band else 0.0145,
        max_dip_pelvis=0.0012,
        n_leg=32,
        mat_main=mat_fleece,
        mat_band=mat_rib,
        add_waistband_ribs=True,
        add_side_seam_ridge=True,
        add_pocket_welts=False,
        add_drawstrings=True,
        mat_cord=mat_cord,
        mat_metal=mat_zip_metal,
        mat_trim=mat_zip_tape,
    )
    _bind_and_transfer_weights(sweatpants, donor_legs, armature, smooth_passes=1)
    _export_garment_glb([sweatpants], armature, "lara_sweatpants.glb")

    # 3-6. Zipped Cotton Hoodie & Variants (standard, crop, tank, crop-tank)
    hoodie_variants = [
        {
            "name": "lara_hoodie_zip",
            "filename": "lara_hoodie_zip.glb",
            "z_hem_bot": 0.960,
            "z_hem_top": 1.015,
            "n_body_z": 30,
            "include_sleeves": True,
            "include_pockets": True,
            "tank_armhole": False,
        },
        {
            "name": "lara_hoodie_crop",
            "filename": "lara_hoodie_crop.glb",
            "z_hem_bot": 1.185,
            "z_hem_top": 1.225,
            "n_body_z": 22,
            "include_sleeves": True,
            "include_pockets": False,
            "tank_armhole": False,
        },
        {
            "name": "lara_hoodie_tank",
            "filename": "lara_hoodie_tank.glb",
            "z_hem_bot": 0.960,
            "z_hem_top": 1.015,
            "n_body_z": 30,
            "include_sleeves": False,
            "include_pockets": True,
            "tank_armhole": True,
        },
        {
            "name": "lara_hoodie_crop_tank",
            "filename": "lara_hoodie_crop_tank.glb",
            "z_hem_bot": 1.185,
            "z_hem_top": 1.225,
            "n_body_z": 22,
            "include_sleeves": False,
            "include_pockets": False,
            "tank_armhole": True,
        },
    ]

    for spec in hoodie_variants:
        garment = build_zip_hoodie(
            name=spec["name"],
            bvh_torso=bvh_torso,
            verts_torso=verts_torso,
            bvh_left_arm=bvh_left_arm,
            verts_left_arm=verts_left_arm,
            bvh_right_arm=bvh_right_arm,
            verts_right_arm=verts_right_arm,
            mat_fleece=mat_fleece,
            mat_rib=mat_rib,
            mat_lining=mat_lining,
            mat_zip_tape=mat_zip_tape,
            mat_zip_metal=mat_zip_metal,
            mat_cord=mat_cord,
            z_hem_bot=spec["z_hem_bot"],
            z_hem_top=spec["z_hem_top"],
            n_body_z=spec["n_body_z"],
            include_sleeves=spec["include_sleeves"],
            include_pockets=spec["include_pockets"],
            tank_armhole=spec["tank_armhole"],
        )
        if spec["include_sleeves"]:
            donor_sel = donor_top
            region_sel = lambda vco: donor_arms_only if (abs(vco.x) > 0.145 and vco.z > 1.325) else donor_torso_only
        else:
            donor_sel = donor_torso_only
            region_sel = None
        _bind_and_transfer_weights(
            garment,
            donor_sel,
            armature,
            bone_attenuation={"breast_left_base": 0.45, "breast_right_base": 0.45},
            smooth_passes=1,
            region_selector=region_sel,
        )
        _export_garment_glb([garment], armature, spec["filename"])

    print("All Lara garments generated successfully!")


if __name__ == "__main__":
    main()
