"""Read the supplied Shiba and donor joint frames before rebuilding the rig."""
from pathlib import Path
import bpy, json, tempfile, zipfile, os
from mathutils import Matrix

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'artifacts/ushiro/rebuild'
OUTPUT.mkdir(parents=True, exist_ok=True)
report = {}

def record(label, rig):
    bones = {}
    for b in rig.pose.bones:
        world = rig.matrix_world @ b.matrix
        bones[b.name] = dict(head=list(world.translation), tail=list(rig.matrix_world @ b.tail),
                             parent=b.parent.name if b.parent else None,
                             matrix=[list(row) for row in world])
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    body = max(meshes, key=lambda o: len(o.data.vertices))
    counts = {}
    for vertex in body.data.vertices:
        for g in vertex.groups:
            name = body.vertex_groups[g.group].name
            counts[name] = counts.get(name, 0) + g.weight
    report[label] = dict(bones=bones, meshes=[dict(name=o.name, vertices=len(o.data.vertices),
                         modifiers=[m.type for m in o.modifiers]) for o in meshes],
                         totalWeights=dict(sorted(counts.items(), key=lambda item: -item[1])))

with tempfile.TemporaryDirectory(prefix='ushiro-reference-') as work:
    with zipfile.ZipFile(Path.home() / '3D Resources/animals/shiba-inu-texture-updated.zip') as z:
        z.extractall(work)
    bpy.ops.wm.open_mainfile(filepath=str(Path(work) / 'source/Shibaa.blend'))
    rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    print('ORIGINAL_ACTIONS', [a.name for a in bpy.data.actions], flush=True)
    for track in list(rig.animation_data.nla_tracks): rig.animation_data.nla_tracks.remove(track)
    rig.animation_data.action = None
    for pb in rig.pose.bones: pb.matrix_basis = Matrix.Identity(4)
    bpy.context.view_layer.update()
    record('original-rest', rig)
    action = bpy.data.actions['standing_skeletal.3']
    rig.animation_data.action = action; rig.animation_data.action_slot = action.slots[0]
    bpy.context.scene.frame_set(0); bpy.context.view_layer.update()
    record('original-standing', rig)

for label, path in [('donor', ROOT / 'public/characters/animated-pitbull-dog/dog.glb'), ('previous', Path('/tmp/ushiro-before-rebuild.glb'))]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    for track in list(rig.animation_data.nla_tracks): rig.animation_data.nla_tracks.remove(track)
    rig.animation_data.action = None
    for pb in rig.pose.bones: pb.matrix_basis = Matrix.Identity(4)
    bpy.context.view_layer.update(); record(label + '-rest', rig)
    action = bpy.data.actions['idle 50']
    rig.animation_data.action = action; rig.animation_data.action_slot = action.slots[0]
    bpy.context.scene.frame_set(0); bpy.context.view_layer.update(); record(label + '-idle', rig)

(OUTPUT / 'reference-audit.json').write_text(json.dumps(report, indent=2) + '\n')
for label, data in report.items():
    print(label, 'BONES', len(data['bones']), 'MESHES', data['meshes'], flush=True)
    for name, bone in data['bones'].items():
        if label.startswith('original') or name in ['Hips','Spine4','Neck01','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','LeftHandMiddle1','LeftUpLeg','LeftLeg','LeftFoot','LeftToeBase']:
            print(name, [round(x, 5) for x in bone['head']], '=>', [round(x, 5) for x in bone['tail']], flush=True)
os._exit(0)
