"""Align editable rigs with grounded GLBs: run ground-extra-characters.cjs first."""
import json
import struct
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
for character in ['lewis', 'david', 'alex', 'mannequin']:
    folder = ROOT / 'public/characters' / character
    data = (folder / f'{character}.glb').read_bytes()
    length, = struct.unpack_from('<I', data, 12)
    gltf = json.loads(data[20:20 + length])
    height = next(n['translation'][1] for n in gltf['nodes'] if n.get('name', '').replace(':', '').replace('_', '') == 'mixamorigHips')
    bpy.ops.wm.open_mainfile(filepath=str(folder / f'{character}.blend'))
    armature, = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' and m.object == armature for m in o.modifiers)]
    shift = Vector((0, 0, height - (armature.matrix_world @ armature.data.bones['mixamorig:Hips'].head_local).z))
    armature.animation_data_clear()
    for bone in armature.pose.bones:
        bone.matrix_basis.identity()
    armature.data.transform(Matrix.Translation(armature.matrix_world.to_3x3().inverted() @ shift))
    for mesh in meshes:
        mesh.data.transform(mesh.matrix_world.inverted() @ Matrix.Translation(shift) @ mesh.matrix_world)
    bpy.context.view_layer.update()
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(folder / f'{character}.blend'), compress=True)
    print(f'{character}: editable rest pose moved {shift.z * 100:.3f} cm', flush=True)
