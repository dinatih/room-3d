"""Fast offline Blender preview renderer (Front + 3/4 + Back) for Lara outfits.

Usage:
  blender --background --python scripts/lara_outfits/render_preview.py -- \
    --glb public/characters/clothing/lara/hoodies/lara_hoodie_zip_open_1_3.glb \
    --out /tmp/lara-outfit-previews/hoodie_1_3.png
"""

import argparse
import math
import os
import sys
import bpy
from mathutils import Vector

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from scripts.lara_outfits.common import BLEND_PATH, PREVIEW_DIR


def _parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser(description="Render Front/3-4/Back preview of Lara wearing GLB outfit(s)")
    parser.add_argument("--glb", nargs="+", required=True, help="One or more garment GLB paths")
    parser.add_argument("--out", required=True, help="Output PNG path")
    parser.add_argument("--focus-z", type=float, default=1.05, help="Camera look-at Z height")
    parser.add_argument("--dist", type=float, default=2.35, help="Camera distance")
    return parser.parse_args(argv)


def _setup_nude_lara():
    hide_names = {
        "bikini_top", "bikini_bottom", "shirt", "shorts", "body_torso", "body_legs",
        "body_legs_barefoot", "body_bare_feet_clothed", "boots", "backpack", "gear",
        "handgun_left", "handgun_right", "handgun_left_holster", "handgun_right_holster",
        "buckle", "metal", "glasses", "hair_classic", "hair_fmv",
    }
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            hide = obj.name in hide_names
            obj.hide_render = hide
            obj.hide_viewport = hide


def _render_view(cam, target: Vector, pos: Vector, out_path: str):
    cam.location = pos
    direction = (target - pos).normalized()
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.render.filepath = out_path
    bpy.ops.render.render(write_still=True)


def main():
    args = _parse_args()
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
    _setup_nude_lara()

    for glb_path in args.glb:
        abs_glb = os.path.abspath(glb_path)
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=abs_glb)
        imported = [o for o in bpy.data.objects if o not in before]
        for o in imported:
            if o.type == "ARMATURE":
                o.hide_viewport = True
                o.hide_render = True

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
    scene.render.resolution_x = 520
    scene.render.resolution_y = 760
    scene.render.film_transparent = False
    if scene.world and scene.world.use_nodes:
        bg = scene.world.node_tree.nodes.get("Background")
        if bg:
            bg.inputs[0].default_value = (0.14, 0.15, 0.17, 1.0)
            bg.inputs[1].default_value = 1.1

    for name, loc, energy in [
        ("KeyLight", (-1.5, -2.5, 2.5), 180.0),
        ("FillLight", (2.0, -2.0, 1.8), 90.0),
        ("RimLight", (0.2, 2.5, 2.2), 140.0),
    ]:
        ldata = bpy.data.lights.new(name, type="POINT")
        ldata.energy = energy
        lobj = bpy.data.objects.new(name, ldata)
        lobj.location = loc
        scene.collection.objects.link(lobj)

    cdata = bpy.data.cameras.new("PreviewCam")
    cdata.lens = 50.0
    cam = bpy.data.objects.new("PreviewCam", cdata)
    scene.collection.objects.link(cam)
    scene.camera = cam

    os.makedirs(PREVIEW_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    stem, _ = os.path.splitext(args.out)

    target = Vector((0.0, 0.0, args.focus_z))
    d = args.dist
    views = [
        ("front", Vector((0.0, -d, args.focus_z + 0.08))),
        ("three_quarter", Vector((d * 0.65, -d * 0.76, args.focus_z + 0.12))),
        ("back", Vector((0.0, d, args.focus_z + 0.08))),
    ]
    paths = []
    for tag, pos in views:
        p = f"{stem}_{tag}.png"
        _render_view(cam, target, pos, p)
        paths.append(p)

    # Composite 3 views side by side using Blender image pixels / numpy
    import numpy as np
    imgs = [bpy.data.images.load(p) for p in paths]
    w, h = imgs[0].size
    arrs = [np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4) for im in imgs]
    comp = np.concatenate(arrs, axis=1)
    out_img = bpy.data.images.new("Composite", width=w * len(arrs), height=h, alpha=True)
    out_img.pixels.foreach_set(comp.ravel())
    out_img.filepath_raw = os.path.abspath(args.out)
    out_img.file_format = "PNG"
    out_img.save()
    print(f"Saved preview composite: {os.path.abspath(args.out)}")


if __name__ == "__main__":
    main()
