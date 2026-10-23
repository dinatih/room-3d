"""Bake rest poses with a 3 cm foot gap. Run: blender -b --python scripts/temp_feet_tpose.py"""
from pathlib import Path
import math
import os
import sys
import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.context.preferences.filepaths.save_version = 0

FOOT_GAP_METERS = 0.03  # Blender sources are in meters; each foot stays 1.5 cm from center.
CHARACTERS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['alex', 'james', 'david', 'lewis', 'valby']


def foot_vertices(mesh, side):
    groups = {g.index for g in mesh.vertex_groups if g.name.startswith('mixamorig:' + side) and ('Foot' in g.name or 'Toe' in g.name)}
    return [v.index for v in mesh.data.vertices if sum(g.weight for g in v.groups if g.group in groups) > 0.5]


def render(path, meshes):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'MATERIAL'
    scene.display.shading.show_shadows = True
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.film_transparent = True
    points = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
    center = Vector(tuple((min(p[i] for p in points) + max(p[i] for p in points)) / 2 for i in range(3)))
    camera = bpy.data.objects.new('TposeReview', bpy.data.cameras.new('TposeReview'))
    scene.collection.objects.link(camera)
    camera.location = center + Vector((0, -5, 0))
    camera.rotation_euler = (center - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = max(max(p[i] for p in points) - min(p[i] for p in points) for i in (0, 2)) * 1.12
    scene.camera = camera
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(camera, do_unlink=True)


for character in CHARACTERS:
    folder = ROOT / 'public/characters' / character
    filename = f'{character}.blend'
    source = ROOT / 'sources_backup/valby/valby_tpose.blend' if character == 'valby' else folder / filename
    bpy.ops.wm.open_mainfile(filepath=str(source))
    arm, = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' and m.object == arm for m in o.modifiers)]
    assert arm.animation_data is None, 'Expected unanimated source rest pose'
    assert all(p.matrix_basis == Matrix.Identity(4) for p in arm.pose.bones), 'Expected identity source pose'
    render(Path('/tmp') / f'{character}_tpose_before.png', meshes)
    original_lengths = {b.name: b.length for b in arm.data.bones}
    for side, sign in [('Left', 1), ('Right', -1)]:
        thigh = arm.pose.bones[f'mixamorig:{side}UpLeg']
        foot = arm.pose.bones[f'mixamorig:{side}Foot']
        toe = arm.pose.bones[f'mixamorig:{side}ToeBase']
        thigh_rest, foot_rest = thigh.matrix.copy(), foot.matrix.copy()
        indices = [(mesh, foot_vertices(mesh, side)) for mesh in meshes]
        assert any(ids for _, ids in indices), 'No weighted foot vertices'
        before = foot.head.x

        def pose(angle):
            pivot = thigh_rest.translation
            thigh.matrix = Matrix.Translation(pivot) @ Matrix.Rotation(sign * angle, 4, 'Y') @ Matrix.Translation(-pivot) @ thigh_rest
            bpy.context.view_layer.update()
            # Preserve foot pitch/roll, removing the original outward toe direction.
            position = foot.head.copy()
            direction = toe.bone.head_local - foot.bone.head_local
            yaw = math.atan2(-direction.x, -direction.y)
            foot.matrix = Matrix.Translation(position) @ Matrix.Rotation(yaw, 4, 'Z') @ foot_rest.to_3x3().to_4x4()
            bpy.context.view_layer.update()
            graph = bpy.context.evaluated_depsgraph_get()
            medial = []
            for mesh, ids in indices:
                evaluated = mesh.evaluated_get(graph)
                medial.extend(sign * (evaluated.matrix_world @ evaluated.data.vertices[i].co).x for i in ids)
            return min(medial) - FOOT_GAP_METERS / 2

        high = math.atan2(abs(thigh.head.x), thigh.head.z - foot.head.z) * 2
        low = -high
        assert pose(low) > 0 and pose(high) < 0, 'Contact must be bracketed'
        while high - low > 1e-8:
            middle = (low + high) / 2
            if pose(middle) > 0:
                low = middle
            else:
                high = middle
        contact = pose((low + high) / 2)
        assert abs(contact) < 1e-5
        print('CONTACT', character, side, 'ankle before/after', before, foot.head.x, 'angle degrees', math.degrees((low + high) / 2), 'medial gap', contact, flush=True)

    # Bake evaluated skin into the mesh, then make the exact same pose the bind pose.
    for mesh in meshes:
        bpy.context.view_layer.objects.active = mesh
        modifier, = [m for m in mesh.modifiers if m.type == 'ARMATURE']
        if mesh.data.shape_keys:
            # Linear skinning must deform every shape key, preserving facial expressions.
            assert not modifier.use_deform_preserve_volume
            to_arm = arm.matrix_world.inverted() @ mesh.matrix_world
            transforms = {g.index: to_arm.inverted() @ arm.pose.bones[g.name].matrix
                          @ arm.data.bones[g.name].matrix_local.inverted() @ to_arm
                          for g in mesh.vertex_groups if g.name in arm.data.bones and arm.data.bones[g.name].use_deform}
            for vertex in mesh.data.vertices:
                weights = [(transforms[g.group], g.weight) for g in vertex.groups if g.group in transforms]
                total = sum(weight for _, weight in weights)
                if not total:
                    continue
                for key in mesh.data.shape_keys.key_blocks:
                    point = key.data[vertex.index].co.copy()
                    key.data[vertex.index].co = sum((matrix @ point * weight for matrix, weight in weights), Vector()) / total
                vertex.co = mesh.data.shape_keys.key_blocks[0].data[vertex.index].co
        else:
            bpy.ops.object.modifier_copy(modifier=modifier.name)
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='POSE')
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    for bone in arm.data.bones:
        # Allow 0.01 mm of Blender transform roundoff, expressed in armature units.
        assert math.isclose(bone.length, original_lengths[bone.name], abs_tol=1e-5 / arm.matrix_world.to_scale().x), bone.name
    bpy.context.view_layer.update()
    # Bringing the feet together changes the lowest sole vertex: ground the new rest pose.
    floor = min((mesh.matrix_world @ vertex.co).z for mesh in meshes for vertex in mesh.data.vertices)
    shift = Vector((0, 0, -floor))
    arm.data.transform(Matrix.Translation(arm.matrix_world.to_3x3().inverted() @ shift))
    for mesh in meshes:
        mesh.data.transform(mesh.matrix_world.inverted() @ Matrix.Translation(shift) @ mesh.matrix_world, shape_keys=True)
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    for obj in [arm, *meshes]:
        obj.select_set(True)
    arm.show_in_front = True
    bpy.ops.wm.save_as_mainfile(filepath=str(folder / filename), compress=True)
    if character == 'valby':
        bpy.ops.wm.save_as_mainfile(filepath=str(source), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(folder / f'{character}.glb'), export_format='GLB', use_selection=True, export_animations=False, export_skins=True, export_cameras=False, export_lights=False, export_draco_mesh_compression_enable=True, export_draco_position_quantization=20, export_image_format='WEBP')
    render(folder / f'{character}_3d_preview.png', meshes)
    render(Path('/tmp') / f'{character}_tpose_after.png', meshes)
    # Reimport the exported asset to check the bind pose and skin survived export.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(folder / f'{character}.glb'))
    imported_arm, = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
    edges = []
    for side in ['Left', 'Right']:
        foot = imported_arm.data.bones[f'mixamorig:{side}Foot']
        print('EXPORT VERIFIED', character, side, tuple(imported_arm.matrix_world @ foot.head_local), flush=True)
        sign = 1 if side == 'Left' else -1
        edges.append(min(sign * (o.matrix_world @ o.data.vertices[i].co).x
                         for o in bpy.context.scene.objects if o.type == 'MESH'
                         for i in foot_vertices(o, side)))
    assert abs(sum(edges) - FOOT_GAP_METERS) < 1e-4, edges
    print('EXPORTED FOOT GAP (cm)', character, sum(edges) * 100, flush=True)

sys.stdout.flush()
os._exit(0)
