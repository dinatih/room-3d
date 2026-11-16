#!/usr/bin/env python3
"""
build-tjena-organiser.py — Génère le GLB haute précision de l'organiseur de bureau
IKEA TJENA noir (réf. 803.954.89) dans la configuration modifiée demandée :
  - Bac plateau plat extérieur : 25,0 × 17,5 × 2,8 cm
  - Grande boîte rectangulaire arrière : 24,6 × 8,8 × 17,0 cm
  - Rangée avant modifiée (uniquement les 2 plus grandes tailles de cubes, sans
    le petit cube 5 cm) :
      • Gauche  : Cube moyen  8,2 × 8,2 × 9,0 cm
      • Milieu  : Grand cube  8,2 × 8,2 × 13,0 cm
      • Droite  : Cube moyen  8,2 × 8,2 × 9,0 cm
  - Carton noir mat laminé réaliste avec bords biseautés et cavités creuses.
  - Export en mètres (Y-up glTF), centré X/Z, posé au sol Y=0, 1 Draw Call, Draco.

Usage :
  blender -b -P scripts/build-tjena-organiser.py -- --render
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
from mathutils import Vector
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(REPO_ROOT, "public", "items", "tjena80395489")
OUT_GLB = os.path.join(OUT_DIR, "Tjena80395489.glb")
TEX_DIR = "/tmp/tjena_tex"
RENDER_DIR = (
    "/home/dinatih/.gemini/antigravity-cli/brain/"
    "23ad45a2-31a1-49bf-a3f8-542818ad8a9f/scratch"
)

# ── Dimensions réelles IKEA TJENA 803.954.89 (mètres, Blender Z-up, front = -Y) ──
TRAY_W = 0.250
TRAY_D = 0.175
TRAY_H = 0.028
TRAY_WALL = 0.0018
TRAY_FLOOR = 0.0020

LONG_W = 0.2456
LONG_D = 0.0876
LONG_H = 0.1700

CUBE_W = 0.0815
CUBE_D = 0.0815
CUBE_MED_H = 0.0900
CUBE_TALL_H = 0.1300

BOX_WALL = 0.0019
BOX_FLOOR = 0.0020
SEED = 108


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def generate_textures():
    os.makedirs(TEX_DIR, exist_ok=True)
    rng = np.random.default_rng(SEED)
    S = 256

    # Micro-fibre carton laminé noir mat (tuilable propre, léger)
    yy, xx = np.mgrid[0:S, 0:S]
    fiber = (
        np.sin((xx * 0.8 + yy * 0.3) * 0.45) * 0.25
        + np.sin((xx * 0.25 - yy * 0.9) * 0.55) * 0.25
        + rng.normal(0.0, 0.28, (S, S))
    ).astype(np.float32)

    # Noir mat IKEA TJENA (~15,15,16 sRGB pour rester bien noir tout en gardant les reflets sur chanfreins)
    base_rgb = np.array([15.0, 15.0, 16.0], dtype=np.float32)
    col = np.clip(base_rgb[None, None, :] + fiber[:, :, None] * 1.1, 8, 24).astype(np.uint8)
    base_path = os.path.join(TEX_DIR, "tjena_basecolor.jpg")
    Image.fromarray(col, "RGB").save(base_path, quality=88, optimize=True)

    # Roughness mat papier satiné (~0.62..0.72)
    rough = np.clip(170.0 + fiber * 8.0, 154, 192).astype(np.uint8)
    orm = np.stack([
        np.full((S, S), 255, dtype=np.uint8),
        rough,
        np.zeros((S, S), dtype=np.uint8),
    ], axis=-1)
    orm_path = os.path.join(TEX_DIR, "tjena_orm.jpg")
    Image.fromarray(orm, "RGB").save(orm_path, quality=88, optimize=True)

    # Normale douce fibre carton
    gx = np.zeros_like(fiber)
    gy = np.zeros_like(fiber)
    gx[:, 1:-1] = (fiber[:, 2:] - fiber[:, :-2]) * 0.16
    gy[1:-1, :] = (fiber[2:, :] - fiber[:-2, :]) * 0.16
    nz = np.ones_like(fiber)
    ln = np.sqrt(gx * gx + gy * gy + nz * nz)
    nrm = np.stack([(-gx / ln * 0.5 + 0.5), (gy / ln * 0.5 + 0.5), (nz / ln * 0.5 + 0.5)], axis=-1)
    norm_path = os.path.join(TEX_DIR, "tjena_normal.jpg")
    Image.fromarray(np.clip(nrm * 255.0, 0, 255).astype(np.uint8), "RGB").save(norm_path, quality=88, optimize=True)

    return base_path, orm_path, norm_path


def build_material(paths):
    base_path, orm_path, norm_path = paths
    mat = bpy.data.materials.new("TjenaBlackCardboard")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.38
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    t_col = nt.nodes.new("ShaderNodeTexImage")
    t_col.image = bpy.data.images.load(base_path)
    nt.links.new(t_col.outputs["Color"], bsdf.inputs["Base Color"])

    t_orm = nt.nodes.new("ShaderNodeTexImage")
    t_orm.image = bpy.data.images.load(orm_path)
    t_orm.image.colorspace_settings.name = "Non-Color"
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(t_orm.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])

    gltf_grp = bpy.data.node_groups.new("glTF Settings", "ShaderNodeTree")
    gltf_grp.interface.new_socket(name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    gltf_node = nt.nodes.new("ShaderNodeGroup")
    gltf_node.node_tree = gltf_grp
    nt.links.new(sep.outputs["Red"], gltf_node.inputs["Occlusion"])

    t_nrm = nt.nodes.new("ShaderNodeTexImage")
    t_nrm.image = bpy.data.images.load(norm_path)
    t_nrm.image.colorspace_settings.name = "Non-Color"
    nrm_node = nt.nodes.new("ShaderNodeNormalMap")
    nrm_node.inputs["Strength"].default_value = 0.32
    nt.links.new(t_nrm.outputs["Color"], nrm_node.inputs["Color"])
    nt.links.new(nrm_node.outputs["Normal"], bsdf.inputs["Normal"])

    return mat


def create_open_box(name, w, d, h, wall, floor_t, center_xy, z_base, mat):
    """Crée une boîte en carton ouverte en haut avec épaisseur de parois et chanfrein net."""
    bm = bmesh.new()
    cx, cy = center_xy
    hw, hd = w * 0.5, d * 0.5
    ihw, ihd = hw - wall, hd - wall
    z0 = z_base
    z1 = z_base + floor_t
    z2 = z_base + h

    # 8 sommets anneau extérieur bas (0..3) et haut (4..7)
    bo = [
        bm.verts.new((cx - hw, cy - hd, z0)),
        bm.verts.new((cx + hw, cy - hd, z0)),
        bm.verts.new((cx + hw, cy + hd, z0)),
        bm.verts.new((cx - hw, cy + hd, z0)),
    ]
    to = [
        bm.verts.new((cx - hw, cy - hd, z2)),
        bm.verts.new((cx + hw, cy - hd, z2)),
        bm.verts.new((cx + hw, cy + hd, z2)),
        bm.verts.new((cx - hw, cy + hd, z2)),
    ]
    # 8 sommets anneau intérieur fond (0..3) et haut (4..7)
    bi = [
        bm.verts.new((cx - ihw, cy - ihd, z1)),
        bm.verts.new((cx + ihw, cy - ihd, z1)),
        bm.verts.new((cx + ihw, cy + ihd, z1)),
        bm.verts.new((cx - ihw, cy + ihd, z1)),
    ]
    ti = [
        bm.verts.new((cx - ihw, cy - ihd, z2)),
        bm.verts.new((cx + ihw, cy - ihd, z2)),
        bm.verts.new((cx + ihw, cy + ihd, z2)),
        bm.verts.new((cx - ihw, cy + ihd, z2)),
    ]

    # Fond extérieur & fond intérieur
    bm.faces.new((bo[3], bo[2], bo[1], bo[0]))
    bm.faces.new((bi[0], bi[1], bi[2], bi[3]))

    for i in range(4):
        ni = (i + 1) % 4
        # Paroi extérieure
        bm.faces.new((bo[i], bo[ni], to[ni], to[i]))
        # Paroi intérieure
        bm.faces.new((bi[ni], bi[i], ti[i], ti[ni]))
        # Tranche supérieure
        bm.faces.new((to[i], to[ni], ti[ni], ti[i]))

    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # Chanfrein fin sur toutes les arêtes pour attraper la lumière sur les plis du carton
    bmesh.ops.bevel(
        bm,
        geom=list(bm.edges),
        offset=0.00045,
        segments=2,
        profile=0.5,
        affect="EDGES",
    )
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    # Projection cubique simple en UV métriques (~15 cm par tuile)
    uv_layer = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        n = f.normal
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
        for loop in f.loops:
            co = loop.vert.co
            if az >= ax and az >= ay:
                u, v = co.x, co.y
            elif ax >= ay:
                u, v = co.y, co.z
            else:
                u, v = co.x, co.z
            loop[uv_layer].uv = (u * 6.5, v * 6.5)
        f.smooth = True

    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(mat)

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)

    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL")
    mod.keep_sharp = False
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def build_organiser(mat):
    objs = []
    # 1. Bac plateau plat (25.0 × 17.5 × 2.8 cm)
    objs.append(create_open_box(
        "Tjena_Tray",
        TRAY_W, TRAY_D, TRAY_H, TRAY_WALL, TRAY_FLOOR,
        (0.0, 0.0), 0.0, mat
    ))

    # Espace intérieur du plateau en Y : -(TRAY_D/2 - TRAY_WALL) .. +(TRAY_D/2 - TRAY_WALL)
    # Avant = -Y (glTF +Z), Arrière = +Y (glTF -Z)
    inner_half_d = TRAY_D * 0.5 - TRAY_WALL - 0.0004
    y_back = inner_half_d - LONG_D * 0.5
    y_front = -inner_half_d + CUBE_D * 0.5

    # 2. Grande boîte rectangulaire arrière (24.6 × 8.8 × 17.0 cm)
    objs.append(create_open_box(
        "Tjena_BackLongBox",
        LONG_W, LONG_D, LONG_H, BOX_WALL, BOX_FLOOR,
        (0.0, y_back), TRAY_FLOOR, mat
    ))

    # 3. Rangée avant modifiée : [Moyen 9cm | Grand 13cm | Moyen 9cm]
    cube_step = CUBE_W + 0.0005  # 0.5 mm interstice réel entre boîtes
    objs.append(create_open_box(
        "Tjena_Cube_Med_Left",
        CUBE_W, CUBE_D, CUBE_MED_H, BOX_WALL, BOX_FLOOR,
        (-cube_step, y_front), TRAY_FLOOR, mat
    ))
    objs.append(create_open_box(
        "Tjena_Cube_Tall_Center",
        CUBE_W, CUBE_D, CUBE_TALL_H, BOX_WALL, BOX_FLOOR,
        (0.0, y_front), TRAY_FLOOR, mat
    ))
    objs.append(create_open_box(
        "Tjena_Cube_Med_Right",
        CUBE_W, CUBE_D, CUBE_MED_H, BOX_WALL, BOX_FLOOR,
        (+cube_step, y_front), TRAY_FLOOR, mat
    ))

    # Fusion en 1 seul objet / 1 Draw Call propre
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    merged = bpy.context.active_object
    merged.name = "TjenaOrganiser80395489"
    return merged


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
        bg.inputs[0].default_value = (0.86, 0.86, 0.87, 1.0)
        bg.inputs[1].default_value = 0.90

    temp_objs = []
    for name, loc, energy, size in [
        ("KeyLight", (-0.65, -0.75, 0.95), 42.0, 0.9),
        ("FillLight", (0.70, -0.55, 0.70), 22.0, 1.2),
        ("RimLight", (0.10, 0.85, 0.80), 26.0, 0.9),
    ]:
        ldata = bpy.data.lights.new(name, type="AREA")
        ldata.energy = energy
        ldata.size = size
        lobj = bpy.data.objects.new(name, ldata)
        lobj.location = loc
        lobj.rotation_euler = (Vector((0.0, 0.0, 0.08)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lobj)
        temp_objs.append(lobj)

    bpy.ops.mesh.primitive_plane_add(size=1.4, location=(0.0, 0.0, -0.0005))
    plane = bpy.context.active_object
    pmat = bpy.data.materials.new("GroundPlane")
    pmat.use_nodes = True
    pmat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.90, 0.90, 0.91, 1.0)
    pmat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.85
    plane.data.materials.append(pmat)
    temp_objs.append(plane)

    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj
    temp_objs.append(cam_obj)

    views = [
        ("tjena_front_3q.png", (-0.36, -0.38, 0.28), (0.0, 0.0, 0.075)),
        ("tjena_back_3q.png", (0.34, 0.38, 0.27), (0.0, 0.0, 0.075)),
        ("tjena_front.png", (0.0, -0.48, 0.22), (0.0, 0.0, 0.075)),
    ]
    for fname, loc, target in views:
        cam_obj.location = loc
        cam_obj.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = os.path.join(RENDER_DIR, fname)
        bpy.ops.render.render(write_still=True)

    for to in temp_objs:
        bpy.data.objects.remove(to, do_unlink=True)
    bpy.data.worlds.remove(world, do_unlink=True)


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


def inspect_glb(obj):
    size_bytes = os.path.getsize(OUT_GLB)
    with open(OUT_GLB, "rb") as f:
        f.read(12)
        clen, _ = struct.unpack("<II", f.read(8))
        gltf = json.loads(f.read(clen).decode("utf-8"))

    mesh = obj.data
    mesh.calc_loop_triangles()
    tris = len(mesh.loop_triangles)
    xs = [v.co.x for v in mesh.vertices]
    ys = [v.co.y for v in mesh.vertices]
    zs = [v.co.z for v in mesh.vertices]
    prims = sum(len(m.get("primitives", [])) for m in gltf.get("meshes", []))
    print(f"OUT_GLB={OUT_GLB}")
    print(f"BYTES={size_bytes} ({size_bytes / 1024:.2f} Ko)")
    print(f"TRIS={tris} PRIMITIVES={prims}")
    print(f"DIMS_CM=({(max(xs)-min(xs))*100:.2f}, {(max(ys)-min(ys))*100:.2f}, {(max(zs)-min(zs))*100:.2f}) [w, d, h]")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args(argv)

    clear_scene()
    paths = generate_textures()
    mat = build_material(paths)
    obj = build_organiser(mat)

    if args.render:
        render_views(obj)

    export_glb(obj)
    inspect_glb(obj)


if __name__ == "__main__":
    main()
