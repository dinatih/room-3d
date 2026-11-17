"""Render Native Lara orthographic PNG references without writing any 3D asset.

Run: blender -b -t 4 --python scripts/render-lara-reference.py
Anatomical: append -- --anatomical (neutral clay surface, no equipment).
"""
from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/references/xray'
OUT.mkdir(parents=True, exist_ok=True)
anatomical = '--anatomical' in sys.argv
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/characters/lara/lara_native.glb'))
# Display only the original clothed outfit, excluding alternate body/hair meshes.
hidden = {
    'bikini_bottom', 'bikini_top', 'body_bare_feet_clothed', 'body_legs_barefoot',
    'body_nude_feet', 'body_nude_hands', 'body_nude_legs', 'body_nude_panties',
    'body_nude_torso', 'hair_classic', 'hair_fmv', 'Icosphere',
    'handgun_left', 'handgun_right',
}
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH':
        obj.hide_render = obj.name in hidden
        if anatomical:
            obj.hide_render = obj.name not in {
                'body_nude_torso', 'body_nude_legs', 'body_nude_feet',
                'body_nude_hands', 'body_nude_panties', 'arms', 'face',
                'eyes', 'eye2', 'lashes', 'hair_base',
            }
            # Neutral anatomical mannequin: no outfit textures or accessories.
            material = bpy.data.materials.get('AnatomicalClay')
            if material is None:
                material = bpy.data.materials.new('AnatomicalClay')
                material.diffuse_color = (0.5, 0.58, 0.62, 1)
            for slot in obj.material_slots:
                slot.material = material
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render]
points = [o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
center = (low + high) / 2
scale = max(high - low) * 1.18  # Common framing margin for every orthographic view.
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 12
scene.cycles.use_denoising = True
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.world = bpy.data.worlds.new('ReferenceWorld')
scene.world.color = (0.25, 0.25, 0.25)
scene.view_settings.view_transform = 'AgX'
for name, offset, energy in [('Key', (2, -3, 3), 200), ('Fill', (-2, 1, 2), 140), ('Back', (1, 3, 2), 180)]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = 3
    light = bpy.data.objects.new(name, data)
    scene.collection.objects.link(light)
    light.location = center + Vector(offset)
    light.rotation_euler = (center - light.location).to_track_quat('-Z', 'Y').to_euler()
data = bpy.data.cameras.new('OrthographicReference')
data.type = 'ORTHO'
data.ortho_scale = scale
camera = bpy.data.objects.new('OrthographicReference', data)
scene.collection.objects.link(camera)
scene.camera = camera
for label, direction in [('anterior', (0, -1, 0)), ('lateral', (1, 0, 0)), ('posterior', (0, 1, 0)), ('dorsal', (0, 0, 1))]:
    camera.location = center + Vector(direction) * 4
    camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
    prefix = 'lara-native-anatomical' if anatomical else 'lara-native'
    scene.render.filepath = str(OUT / f'{prefix}-{label}.png')
    bpy.ops.render.render(write_still=True)
print('Orthographic reference images saved; source model unchanged.')
