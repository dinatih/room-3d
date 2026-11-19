"""Replace only the three reviewed clips after a draft rebuild of the same rig.

blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/update-ushiro-base-clips.py
Rejects changed bind skeletons, meshes or weights; those require a full rebuild.
"""
from pathlib import Path
import bpy, os
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
BASE=['idle 50','walk_fwd 29','run_fwd 13']
path=ROOT/'artifacts/ushiro/ushiro.blend'
bpy.ops.wm.open_mainfile(filepath=str(path))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
meshes=sorted((o for o in bpy.data.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices))
old={name:bpy.data.actions[name] for name in BASE}
with bpy.data.libraries.load(str(ROOT/'artifacts/ushiro/rebuild/candidate.blend'),link=False) as (source,target):
    target.objects=list(source.objects)
    target.actions=list(BASE)
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
    if list(before.vertex_groups.keys())!=list(after.vertex_groups.keys()):raise RuntimeError('Skin groups changed')
    a=np.empty(len(before.data.vertices)*3);b=np.empty_like(a)
    before.data.vertices.foreach_get('co',a);after.data.vertices.foreach_get('co',b)
    if float(np.max(np.abs(a-b)))>1e-6:raise RuntimeError('Bind geometry changed')
    for va,vb in zip(before.data.vertices,after.data.vertices):
        ga={g.group:g.weight for g in va.groups};gb={g.group:g.weight for g in vb.groups}
        if ga.keys()!=gb.keys() or any(abs(ga[n]-gb[n])>1e-6 for n in ga):raise RuntimeError('Skin weights changed')
rig.animation_data.action=None
for name,action in zip(BASE,actions):
    bpy.data.actions.remove(old[name]);action.name=name;action.use_fake_user=True
for obj in objects:bpy.data.objects.remove(obj,do_unlink=True)
action=bpy.data.actions['idle 50'];rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
bpy.context.scene.frame_set(0);bpy.data.orphans_purge(do_recursive=True)
if len(bpy.data.actions)!=119:raise RuntimeError('Incomplete animation catalog after base update')
bpy.ops.wm.save_as_mainfile(filepath=str(path),compress=True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/characters/ushiro/ushiro.glb'),export_format='GLB',export_animations=True,export_skins=True,export_animation_mode='ACTIONS',export_force_sampling=False)
print('UPDATED: 3 base clips, identical bind skeleton, geometry and skin; 119 clips retained.',flush=True)
os._exit(0)
