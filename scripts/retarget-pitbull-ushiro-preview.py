"""Full Pitbull catalog retarget for Ushiro inventory comparisons. Original assets are never modified.
blender -b --python-exit-code 1 --python scripts/retarget-pitbull-ushiro-preview.py
"""
from pathlib import Path
import bpy, math, os
from mathutils import Vector, Matrix
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/characters/ushiro'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
def load(path):
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=str(ROOT/path))
 objects=set(bpy.data.objects)-before
 return next(o for o in objects if o.type=='ARMATURE'),objects
source,source_objects=load('public/characters/animated-pitbull-dog/dog.glb')
target,target_objects=load('public/characters/ushiro/shiba_inu_dog_ushiro.glb')
for rig in [source,target]:
 for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
source.animation_data.action=None;target.animation_data.action=None
mapping={'Dogger_pelvis_j':'Hips','Dogger_spine1_j':'Spine','Dogger_spine2_j':'Spine2','Dogger_spine3_j':'Spine3','Dogger_chest_j':'Spine4','Dogger_neck1_j':'Neck01','Dogger_neck2_j':'Neck03','Dogger_head_j':'Head','Dogger_jaw_j':'Jaw'}
for side,word in [('l','Left'),('r','Right')]:
 for dst,src in [('hip','UpLeg'),('stifle','Leg'),('hock','Foot'),('hindfoot','ToeBase'),('clavicle','Shoulder'),('shoulder','Arm'),('elbow','ForeArm'),('wrist','Hand')]:mapping[f'Dogger_{dst}_{side}_j']=word+src
 mapping[f'Dogger_ear1_{side}_j']=word+'Ear';mapping[f'Dogger_ear2_{side}_j']=word+'Ear3'
for i in range(1,7):mapping[f'Dogger_tail{i:02d}_j']=f'Tail{i:02d}'
for dst,src in mapping.items():assert dst in target.pose.bones and src in source.pose.bones,(dst,src)
source_rest={n:(source.matrix_world@source.data.bones[n].matrix_local).to_quaternion() for n in mapping.values()}
target_rest={n:(target.matrix_world@b.matrix_local).to_quaternion() for n,b in target.data.bones.items()}
ratio=(target.matrix_world@target.data.bones['Dogger_pelvis_j'].head_local).z/(source.matrix_world@source.data.bones['Hips'].head_local).z
scene=bpy.context.scene
# Imported glTF action ranges are expressed at the scene's existing frame rate.
fps=scene.render.fps/scene.render.fps_base
import json,struct
binary=(ROOT/'public/characters/animated-pitbull-dog/dog.glb').read_bytes()
document=json.loads(binary[20:20+struct.unpack_from('<I',binary,12)[0]])
clips=[(a['name'],'Retarget|'+a['name']) for a in document['animations']]
rest_local={b.name:((b.parent.matrix_local.inverted()@b.matrix_local) if b.parent else b.matrix_local).to_quaternion() for b in target.data.bones}
def depth(bone):return 0 if bone.parent is None else 1+depth(bone.parent)
ordered=sorted(target.pose.bones,key=depth)
new_actions=[]
for source_name,name in clips:
 action=bpy.data.actions[source_name]
 source.animation_data.action=action;source.animation_data.action_slot=action.slots[0]
 start,end=action.frame_range
 target.animation_data.action=None
 for bone in target.pose.bones:bone.matrix_basis=Matrix.Identity(4);bone.rotation_mode='QUATERNION'
 result=bpy.data.actions.new(name);target.animation_data.action=result;new_actions.append(result)
 frame=0
 while frame<=math.ceil(end-start):
  scene.frame_set(0,subframe=0)
  scene.frame_set(int(start+min(frame,end-start)),subframe=(start+min(frame,end-start))%1)
  posed={}
  for bone in ordered:
   parent=posed[bone.parent.name] if bone.parent else target.matrix_world.to_quaternion()
   if bone.name not in mapping:
    posed[bone.name]=parent@rest_local[bone.name]
    continue
   src=mapping[bone.name]
   pose=(source.matrix_world@source.pose.bones[src].matrix).to_quaternion()
   desired=pose@source_rest[src].inverted()@target_rest[bone.name]
   bone.rotation_quaternion=rest_local[bone.name].inverted()@parent.inverted()@desired
   posed[bone.name]=desired
   bone.keyframe_insert('rotation_quaternion',frame=min(frame,end-start))

  rest_z=(source.matrix_world@source.data.bones['Hips'].head_local).z
  pose_z=(source.matrix_world@source.pose.bones['Hips'].matrix.translation).z
  pelvis=target.pose.bones['Dogger_pelvis_j']
  vector=target.matrix_world.inverted().to_3x3()@Vector((0,0,(pose_z-rest_z)*ratio))
  pelvis.location=pelvis.bone.matrix_local.to_3x3().inverted()@vector
  pelvis.keyframe_insert('location',frame=min(frame,end-start))
  frame+=1
 result.use_fake_user=True
 print('RETARGETED',name,'frames',frame,flush=True)
# Preserve only the target rig and geometry in the review artifact.
for obj in source_objects:bpy.data.objects.remove(obj,do_unlink=True)
source_actions=[a for a in list(bpy.data.actions) if a not in new_actions and a.name not in ['Dog|Idle','Dog|Walk','Dog|Run','Dog|Jump','Dog|SitDown']]
for a in source_actions:bpy.data.actions.remove(a)
target.animation_data.action=new_actions[0]
scene.frame_set(0)
for result,(original,_) in zip(new_actions,clips):result.name=original
bpy.ops.object.select_all(action='DESELECT')
for obj in target_objects:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'shiba_inu_pitbull_preview.glb'),export_format='GLB',use_selection=True,export_animations=True)
print('OUTPUT',OUT,flush=True)
os._exit(0)
