"""Convert Ulotte's original FBX archive to an animated, textured GLB.

blender -b -noaudio -t 2 --python scripts/import-ulotte.py -- /path/to/dashshund-dog.zip
"""
import sys
import tempfile
import zipfile
from pathlib import Path

import bpy

archive_path = Path(sys.argv[sys.argv.index('--') + 1])
output = Path(__file__).resolve().parents[1] / 'public/characters/ulotte/ulotte.glb'
with tempfile.TemporaryDirectory(prefix='room-ulotte-') as directory:
    root = Path(directory)
    with zipfile.ZipFile(archive_path) as archive:
        archive.extractall(root)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(root / 'source/Dashshund.fbx'))
    rig = bpy.data.objects['Armature']
    rig.animation_data.action = bpy.data.actions['Armature|Armature|Idle_1']
    bpy.context.scene.frame_set(1)
    for image in bpy.data.images:
        image.filepath = str(root / 'textures' / ('Dash_Specular.png' if image.name == 'Dash_Specular' else image.name))
        image.reload()
    for material in bpy.data.materials:
        nodes = material.node_tree.nodes
        shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
        shader.inputs['Metallic'].default_value = 0
        shader.inputs['Roughness'].default_value = 0.8
        shader.inputs['Alpha'].default_value = 1
        texture = nodes.new('ShaderNodeTexImage')
        texture.image = bpy.data.images['Dach_Diff.png']
        material.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])
    for action in list(bpy.data.actions):
        name = action.name.split('|')[-1]
        if name == 'PoseLib':
            bpy.data.actions.remove(action)
        else:
            action.name = name.lower().replace('_', '-')
    # The source walk continues into a different pose after its cycle (frame 22).
    walk = bpy.data.actions['walk']
    walk.use_frame_range = True
    walk.frame_end = 22
    # The FBX has no jaw bone: the Head bone tip supplies the muzzle direction.
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    head = rig.data.edit_bones['Head']
    muzzle = rig.data.edit_bones.new('Muzzle')
    muzzle.head = head.tail
    muzzle.tail = head.tail + (head.tail - head.head).normalized() * 0.1
    muzzle.parent = head
    bpy.ops.object.mode_set(mode='OBJECT')
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output), export_format='GLB',
                              export_animation_mode='ACTIONS', export_force_sampling=True)
    print(f'Exported {output}', flush=True)
