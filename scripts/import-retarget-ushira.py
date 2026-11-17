"""Import UshirA and retarget the original Pitbull catalog for comparison."""
from pathlib import Path
import bpy, math, os, zipfile, tempfile
from mathutils import Vector, Matrix, Quaternion
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/characters/ushira'
OUT.mkdir(parents=True,exist_ok=True)
work=Path(tempfile.mkdtemp(prefix='ushira-source-'))
with zipfile.ZipFile(Path.home()/'3D Resources/animals/shiba-inu-texture-updated.zip') as archive:archive.extractall(work)
bpy.ops.wm.open_mainfile(filepath=str(work/'source/Shibaa.blend'))
for obj in list(bpy.context.scene.objects):
 if obj.type in ['LIGHT','CAMERA']:bpy.data.objects.remove(obj,do_unlink=True)
target_objects=set(bpy.context.scene.objects)
target=next(o for o in target_objects if o.type=='ARMATURE')
native_actions=set(bpy.data.actions)
for image in bpy.data.images:
 path=work/'textures'/Path(image.filepath).name
 if path.is_file():image.filepath=str(path);image.reload();image.pack()
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/characters/animated-pitbull-dog/dog.glb'))
source_objects=set(bpy.data.objects)-before
source=next(o for o in source_objects if o.type=='ARMATURE')
# Retarget bones without recalculating high-resolution skin and corrective smoothing at every sample.
for obj in target_objects | source_objects:
 if obj.type=='MESH':obj.hide_viewport=True
for rig in [source,target]:
 for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
source.animation_data.action=None;target.animation_data.action=None
names={b.name.rsplit('.',1)[0]:b.name for b in target.data.bones}
def target_bone(name):return names[name]
mapping={target_bone('pelvis_jnt'):'Hips',target_bone('spine_1_jnt'):'Spine1',target_bone('spine_2_jnt'):'Spine3',target_bone('chest_jnt'):'Spine4',target_bone('neck_base_jnt'):'Neck01',target_bone('neck_mid_jnt'):'Neck03',target_bone('head_jnt'):'Head',target_bone('jaw_jnt'):'Jaw'}
for side,word in [('L','Left'),('R','Right')]:
 for dst,src in [('hip','UpLeg'),('knee','Leg'),('ankle','Foot'),('foot','ToeBase'),('clavicle','Shoulder'),('shoulder','Arm'),('elbow','ForeArm'),('wrist','Hand'),('hand','HandMiddle1')]:mapping[target_bone(f'{side}_{dst}_jnt')]=word+src
 mapping[target_bone(f'{side}_ear_base_jnt')]=word+'Ear';mapping[target_bone(f'{side}_ear_tip_jnt')]=word+'Ear3'
for i in range(1,7):mapping[target_bone(f'tail_{i}_jnt')]=f'Tail{i:02d}'
for dst,src in mapping.items():assert dst in target.pose.bones and src in source.pose.bones,(dst,src)
source_rest={n:(source.matrix_world@source.data.bones[n].matrix_local).to_quaternion() for n in mapping.values()}
target_rest={n:(target.matrix_world@b.matrix_local).to_quaternion() for n,b in target.data.bones.items()}
ratio=(target.matrix_world@target.data.bones[target_bone('pelvis_jnt')].head_local).z/(source.matrix_world@source.data.bones['Hips'].head_local).z
source_forward=(source.matrix_world@source.data.bones['Head'].head_local)-(source.matrix_world@source.data.bones['Hips'].head_local)
target_forward=(target.matrix_world@target.data.bones[target_bone('head_jnt')].head_local)-(target.matrix_world@target.data.bones[target_bone('pelvis_jnt')].head_local)
align=Quaternion((0,0,1), math.atan2(target_forward.y,target_forward.x)-math.atan2(source_forward.y,source_forward.x))
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
   desired=align@pose@source_rest[src].inverted()@align.inverted()@target_rest[bone.name]
   bone.rotation_quaternion=rest_local[bone.name].inverted()@parent.inverted()@desired
   posed[bone.name]=desired
   bone.keyframe_insert('rotation_quaternion',frame=min(frame,end-start))

  rest_z=(source.matrix_world@source.data.bones['Hips'].head_local).z
  pose_z=(source.matrix_world@source.pose.bones['Hips'].matrix.translation).z
  pelvis=target.pose.bones[target_bone('pelvis_jnt')]
  vector=target.matrix_world.inverted().to_3x3()@Vector((0,0,(pose_z-rest_z)*ratio))
  pelvis.location=pelvis.bone.matrix_local.to_3x3().inverted()@vector
  pelvis.keyframe_insert('location',frame=min(frame,end-start))
  frame+=1
 result.use_fake_user=True
 print('RETARGETED',name,'frames',frame,flush=True)
# Preserve only the target rig and geometry in the review artifact.
for obj in source_objects:bpy.data.objects.remove(obj,do_unlink=True)
source_actions=[a for a in list(bpy.data.actions) if a not in new_actions and a not in native_actions]
for a in source_actions:bpy.data.actions.remove(a)
target.animation_data.action=new_actions[0]
scene.frame_set(0)
for result,(original,_) in zip(new_actions,clips):result.name=original
bpy.ops.object.select_all(action='DESELECT')
for obj in target_objects:
 obj.hide_set(False);obj.hide_viewport=False;obj.hide_render=False;obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'ushira.glb'),export_format='GLB',use_selection=True,export_animations=True,export_skins=True,export_apply=False,export_animation_mode='ACTIONS',export_force_sampling=False)
print('OUTPUT',OUT,flush=True)
os._exit(0)
