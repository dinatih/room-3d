"""Measure linear skin collapse at the shoulder in the exported editable rig.

Singular values describe the blended skin transform, not tissue volume.
"""
from pathlib import Path
import bpy, numpy as np, json, os
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'artifacts/ushiro/ushiro.blend'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
body=max((o for o in bpy.data.objects if o.type=='MESH'),key=lambda o:len(o.data.vertices))
for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
report={}
for clip in ['interact_bed_sleep_exist 221','interact_bed_lay_exist 270']:
 action=bpy.data.actions[clip];rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
 start,end=action.frame_range;bpy.context.scene.frame_set(int((start+end)/2));bpy.context.view_layer.update()
 transforms={bone.name:np.array(rig.pose.bones[bone.name].matrix@bone.matrix_local.inverted())[:3,:3] for bone in rig.data.bones}
 rows=[]
 for vertex in body.data.vertices:
  weights=[(body.vertex_groups[g.group].name,g.weight) for g in vertex.groups]
  if not any(name in ['LeftShoulder','LeftShoulder01','RightShoulder','RightShoulder01'] for name,_ in weights):continue
  singular=np.linalg.svd(sum(transforms[name]*weight for name,weight in weights),compute_uv=False)
  rows.append(dict(minimumSingularValue=float(singular[-1]),vertex=vertex.index,weights=weights))
 if not rows:raise RuntimeError('No shoulder vertices')
 report[clip]=min(rows,key=lambda row:row['minimumSingularValue'])
out=ROOT/'artifacts/ushiro/shoulder-investigation';out.mkdir(parents=True,exist_ok=True)
(out/'collapse.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report),flush=True)
os._exit(0)
