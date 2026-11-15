"""CLI entry point to generate Lara's custom GLB outfits from lara_perfect.blend.

Usage:
  blender --background --python scripts/lara_outfits/build.py -- --family hoodies
  blender --background --python scripts/lara_outfits/build.py -- --only hoodie_open_1_3 hoodie_open_full
"""

import argparse
import os
import sys
import bpy

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from scripts.lara_outfits.accessories import generate_accessories
from scripts.lara_outfits.common import BLEND_PATH
from scripts.lara_outfits.dresses import generate_dresses
from scripts.lara_outfits.footwear import generate_footwear
from scripts.lara_outfits.geometry import build_body_bvhs
from scripts.lara_outfits.hoodies import generate_hoodies
from scripts.lara_outfits.materials import create_material_library
from scripts.lara_outfits.swimwear import generate_swimwear
from scripts.lara_outfits.tops import generate_tops
from scripts.lara_outfits.trousers import generate_trousers


FAMILIES = {
    "trousers": generate_trousers,
    "hoodies": generate_hoodies,
    "swimwear": generate_swimwear,
    "tops": generate_tops,
    "dresses": generate_dresses,
    "footwear": generate_footwear,
    "accessories": generate_accessories,
}


def _parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []
    parser = argparse.ArgumentParser(description="Build Lara custom outfit GLBs")
    parser.add_argument("--family", nargs="*", choices=sorted(FAMILIES.keys()), help="Families to generate")
    parser.add_argument("--only", nargs="*", help="Specific outfit IDs to generate")
    return parser.parse_args(argv)


def main():
    args = _parse_args()
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
    armature = bpy.data.objects["Armature"]

    mats = create_material_library()
    bvhs = build_body_bvhs()

    selected_families = args.family if args.family else list(FAMILIES.keys())
    only_ids = set(args.only) if args.only else None

    for fam in selected_families:
        FAMILIES[fam](bvhs, mats, armature, only_ids=only_ids)

    print("Lara outfit generation complete!")


if __name__ == "__main__":
    main()
