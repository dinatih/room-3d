"""Project the dressed neck tattoo onto the nude torso's authored skin UVs."""
from pathlib import Path
import importlib.util
import sys
sys.dont_write_bytecode = True
import bpy

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'public/characters/lara'
spec = importlib.util.spec_from_file_location('limbs', ROOT / 'scripts/separate_lara_limb_uvs.py')
limbs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(limbs)

bpy.ops.wm.open_mainfile(filepath=str(FOLDER / 'lara_perfect.blend'))
torso = bpy.data.objects['body_nude_torso']
reference = limbs.tattoo_reference('body_torso')
for index in sorted({face.material_index for face in torso.data.polygons}):
    filename = f'body_nude_torso_{index}_neck_tattoo_uv.png'
    limbs.bake_projection(torso, index, reference, FOLDER / 'textures' / filename)
    torso.data.materials[index]['lara_sara_tattoo_projection'] = filename
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER / 'lara_perfect.blend'))
limbs.export()
