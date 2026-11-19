"""Replace selected reviewed clips after a draft rebuild of the same rig.

blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/update-ushiro-base-clips.py
Rejects changed bind skeletons, meshes or weights; those require a full rebuild.
"""
from pathlib import Path
import bpy, os, sys, argparse, json
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--clips',nargs='+',default=['idle 50','walk_fwd 29','run_fwd 13'])
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
CLIPS=args.clips
if len(set(CLIPS))!=len(CLIPS):raise ValueError('Duplicate clips')
path=ROOT/'artifacts/ushiro/ushiro.blend'
bpy.ops.wm.open_mainfile(filepath=str(path))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
meshes=sorted((o for o in bpy.data.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices))
old={name:bpy.data.actions[name] for name in CLIPS}
with bpy.data.libraries.load(str(ROOT/'artifacts/ushiro/rebuild/candidate.blend'),link=False) as (source,target):
    target.objects=list(source.objects)
    target.actions=list(CLIPS)
objects=list(target.objects);actions=list(target.actions)
candidate=next(o for o in objects if o.type=='ARMATURE')
if set(candidate.data.bones.keys())!=set(rig.data.bones.keys()):raise RuntimeError('Bind hierarchy changed; rebuild all clips')
for bone in rig.data.bones:
    other=candidate.data.bones[bone.name]
    if (bone.parent.name if bone.parent else None)!=(other.parent.name if other.parent else None):raise RuntimeError('Bind parenting changed')
    if max(abs(a-b) for ra,rb in zip(bone.matrix_local,other.matrix_local) for a,b in zip(ra,rb))>1e-6:
        raise RuntimeError('Bind axes or pivot changed: '+bone.name)
candidate_meshes=sorted((o for o in objects if o.type=='MESH'),key=lambda o:len(o.data.vertices))
if len(meshes)!=len(candidate_meshes):raise RuntimeError('Mesh set changed')
for before,after in zip(meshes,candidate_meshes):
    if len(before.data.vertices)!=len(after.data.vertices):raise RuntimeError('Topology changed')
    if before.get('groundContactSurface',True)!=after.get('groundContactSurface',True):raise RuntimeError('Contact surface changed')
    if [tuple(p.vertices) for p in before.data.polygons]!=[tuple(p.vertices) for p in after.data.polygons]:raise RuntimeError('Mesh connectivity changed')
    if list(before.data.uv_layers.keys())!=list(after.data.uv_layers.keys()):raise RuntimeError('UV layers changed')
    for uv_name in before.data.uv_layers.keys():
        uv_a=np.empty(len(before.data.loops)*2);uv_b=np.empty_like(uv_a)
        before.data.uv_layers[uv_name].data.foreach_get('uv',uv_a);after.data.uv_layers[uv_name].data.foreach_get('uv',uv_b)
        if float(np.max(np.abs(uv_a-uv_b)))>1e-6:raise RuntimeError('UV coordinates changed')
    if list(before.vertex_groups.keys())!=list(after.vertex_groups.keys()):raise RuntimeError('Skin groups changed')
    a=np.empty(len(before.data.vertices)*3);b=np.empty_like(a)
    before.data.vertices.foreach_get('co',a);after.data.vertices.foreach_get('co',b)
    if float(np.max(np.abs(a-b)))>1e-6:raise RuntimeError('Bind geometry changed')
    for va,vb in zip(before.data.vertices,after.data.vertices):
        ga={g.group:g.weight for g in va.groups};gb={g.group:g.weight for g in vb.groups}
        if ga.keys()!=gb.keys() or any(abs(ga[n]-gb[n])>1e-6 for n in ga):raise RuntimeError('Skin weights changed')
rig.animation_data.action=None
for name,action in zip(CLIPS,actions):
    bpy.data.actions.remove(old[name]);action.name=name;action.use_fake_user=True
for obj in objects:bpy.data.objects.remove(obj,do_unlink=True)
action=bpy.data.actions['idle 50'];rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
bpy.context.scene.frame_set(0);bpy.data.orphans_purge(do_recursive=True)
if len(bpy.data.actions)!=119:raise RuntimeError('Incomplete animation catalog after base update')
reports=ROOT/'artifacts/ushiro/rebuild'
contact_report=json.loads((reports/'contact-report.json').read_text())
draft_report=json.loads((reports/'draft/contact-report.json').read_text())
for clip in CLIPS:contact_report[clip]=draft_report[clip]
if len(contact_report)!=119:raise RuntimeError('Incomplete contact report')
(reports/'contact-report.json').write_text(json.dumps(contact_report,indent=2)+'\n')
bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/characters/ushiro/ushiro.glb'),export_format='GLB',export_extras=True,export_animations=True,export_skins=True,export_animation_mode='ACTIONS',export_force_sampling=False)
print('UPDATED:',len(CLIPS),'clips, identical bind skeleton, geometry and skin; 119 clips retained.',flush=True)
os._exit(0)
