"""Build the inventory comparison rig. Run with blender -b -t 2 --python this-file.

The donor hierarchy and local rotation axes are retained; bind pivots are fitted
independently to the sculpt. Source archives are never modified.
"""
import bpy, json, math, os
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/characters/dachshund-sculpt'
OUT.mkdir(parents=True, exist_ok=True)
EDITABLE = ROOT / 'artifacts/dachshund-sculpt'
EDITABLE.mkdir(parents=True, exist_ok=True)
import runpy
runpy.run_path(str(ROOT / 'scripts/inspect-dachshund-sculpt.py'), run_name='__main__')
rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
meshes = [bpy.data.objects[n] for n in ['CocoSculpt', 'Eyes', 'EyeSparklies']]
for obj in list(bpy.data.objects):
    if obj != rig and obj not in meshes:
        bpy.data.objects.remove(obj, do_unlink=True)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
rig.select_set(False)
rig.animation_data.action = None
for track in list(rig.animation_data.nla_tracks): rig.animation_data.nla_tracks.remove(track)
for bone in rig.pose.bones:
    bone.matrix_basis.identity()
# Sculpt floor is -0.0973 in Blender coordinates.
floor = min((meshes[0].matrix_world @ v.co).z for v in meshes[0].data.vertices)
for obj in meshes:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)
    for vertex in obj.data.vertices: vertex.co.z -= floor
# A 60k vertex presentation budget preserves the sculpt silhouette while
# avoiding deformation of all 350k source vertices on every animation frame.
body = meshes[0]
bpy.context.view_layer.objects.active = body
reduction = body.modifiers.new('Presentation mesh — 60k vertices', 'DECIMATE')
reduction.ratio = 60000 / len(body.data.vertices)
bpy.ops.object.modifier_apply(modifier=reduction.name)
# Piecewise longitudinal fit follows pelvis, chest, skull and nose landmarks.
def interpolate(value, knots):
    index = next((i for i in range(len(knots)-1) if value <= knots[i+1][0]), len(knots)-2)
    a,b = knots[index],knots[index+1]
    return a[1]+(value-a[0])*(b[1]-a[1])/(b[0]-a[0])
def fit(p):
    return Vector((p.x*1.35,
        interpolate(p.y,[(-.70,-.80),(-.408,-.57),(-.218,-.30),(.195,.59),(.519,1.23)]),
        interpolate(p.z,[(0,0),(.11,.14),(.31,.27),(.55,.43),(.74,.86)])))
translation_ratio = fit(Vector((0,.195,.55))).z / .55
inv = rig.matrix_world.inverted()
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
major = {'Hips','Spine','Spine1','Spine2','Spine3','Spine4','Neck01','Neck02','Neck03','Head'}
for side in ['Left','Right']:
    major.update(side+n for n in ['Shoulder','Shoulder01','Arm','ForeArm','Hand','HandMiddle1','Pelvis','UpLeg','Leg','Foot','ToeBase','Ear','Ear2','Ear3'])
major.update('Tail%02d'%i for i in range(1,8))
for bone in rig.data.edit_bones:
    h = rig.matrix_world @ bone.head
    delta = bone.tail-bone.head
    bone.head = inv @ fit(h)
    bone.tail = bone.head + delta * translation_ratio
    bone.use_deform = bone.name in major
bpy.ops.object.mode_set(mode='OBJECT')
rig.select_set(False)
# The small separate eye meshes follow the skull rigidly.
for obj in meshes:
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True); rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    if obj == meshes[0]:
        # Build heat weights on a closed voxel proxy, then interpolate onto
        # the sculpt. This removes the sculpt's overlapping internal surfaces
        # from the heat solver without altering its visible geometry.
        proxy = obj.copy(); proxy.data = obj.data.copy()
        bpy.context.collection.objects.link(proxy)
        bpy.ops.object.select_all(action='DESELECT')
        proxy.select_set(True); bpy.context.view_layer.objects.active = proxy
        remesh = proxy.modifiers.new('Closed weighting volume','REMESH')
        remesh.mode = 'VOXEL'; remesh.voxel_size = .01
        bpy.ops.object.modifier_apply(modifier=remesh.name)
        rig.select_set(True); bpy.context.view_layer.objects.active=rig
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')
        if any(not v.groups for v in proxy.data.vertices):
            raise RuntimeError('Heat solver failed on closed weighting proxy')
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True); bpy.context.view_layer.objects.active=obj
        transfer=obj.modifiers.new('Interpolated anatomical weights','DATA_TRANSFER')
        transfer.object=proxy; transfer.use_vert_data=True
        transfer.data_types_verts={'VGROUP_WEIGHTS'}
        transfer.vert_mapping='POLYINTERP_NEAREST'
        bpy.ops.object.datalayout_transfer(modifier=transfer.name)
        bpy.ops.object.modifier_apply(modifier=transfer.name)
        obj.parent=rig
        modifier=obj.modifiers.new('Skin','ARMATURE'); modifier.object=rig
        bpy.data.objects.remove(proxy,do_unlink=True)
    else:
        obj.parent = rig
        modifier = obj.modifiers.new('Skin', 'ARMATURE'); modifier.object = rig
        obj.vertex_groups.new(name='Head').add(list(range(len(obj.data.vertices))),1,'REPLACE')
    missing = [v.index for v in obj.data.vertices if not v.groups]
    if missing: raise RuntimeError(f'{obj.name}: {len(missing)} unweighted vertices')
# Keep the skull and separate eyes on the same rigid Head transform.
# The blend band follows the sculpt's neck junction, behind the ears.
body = bpy.data.objects['CocoSculpt']
head = body.vertex_groups['Head']
for vertex in body.data.vertices:
    y,z=vertex.co.y,vertex.co.z
    longitudinal=max(0.,min(1.,(-y-.30)/.15))
    vertical=max(0.,min(1.,(z-.45)/.15))
    weight=longitudinal*vertical
    weight=weight*weight*(3-2*weight)
    if not weight:continue
    groups=[(g.group,g.weight) for g in vertex.groups]
    old_head=sum(w for i,w in groups if i==head.index)
    for index,value in groups:
        if index!=head.index:body.vertex_groups[index].add([vertex.index],value*(1-weight),'REPLACE')
    head.add([vertex.index],old_head*(1-weight)+weight,'REPLACE')

# Keep all actions in the editable Blender file.
for action in bpy.data.actions: action.use_fake_user=True
# Retarget joint positions as well as rotations in world space. Copying
# angles alone raises the long trunk above the short paws in seated poses.
from mathutils import Matrix
original_actions = list(bpy.data.actions)
for action in original_actions: action.name='Target|'+action.name
before_objects = set(bpy.data.objects)
before_actions = set(bpy.data.actions)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/characters/animated-pitbull-dog/dog.glb'))
source_objects = set(bpy.data.objects)-before_objects
source = next(o for o in source_objects if o.type=='ARMATURE')
source_actions = {a.name:a for a in set(bpy.data.actions)-before_actions}
for obj in meshes: obj.hide_viewport=True
for obj in source_objects:
    if obj.type=='MESH': obj.hide_viewport=True
for track in list(source.animation_data.nla_tracks):source.animation_data.nla_tracks.remove(track)
scene=bpy.context.scene
for action in original_actions:
    source.animation_data.action=source_actions[action.name.removeprefix('Target|')]
    source.animation_data.action_slot=source.animation_data.action.slots[0]
    rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
    start,end=action.frame_range
    samples=[]
    for frame in range(math.floor(start),math.ceil(end)+1):
        scene.frame_set(frame)
        bpy.context.view_layer.update()
        desired={}
        for bone in rig.data.bones:
            pose=source.matrix_world@source.pose.bones[bone.name].matrix
            desired[bone.name]=rig.matrix_world.inverted()@Matrix.LocRotScale(fit(pose.translation),pose.to_quaternion(),Vector((1,1,1)))
        values=[]
        for bone in rig.data.bones:
            arguments={}
            if bone.parent:
                arguments={'parent_matrix':desired[bone.parent.name],'parent_matrix_local':bone.parent.matrix_local}
            basis=bone.convert_local_to_pose(desired[bone.name],bone.matrix_local,invert=True,**arguments)
            location,rotation,scale=basis.decompose()
            values.append((bone.name,location,rotation,scale))
        samples.append((frame,values))
    for frame,values in samples:
        for name,location,rotation,scale in values:
            bone=rig.pose.bones[name];bone.rotation_mode='QUATERNION'
            bone.location=location;bone.rotation_quaternion=rotation;bone.scale=scale
            bone.keyframe_insert('location',frame=frame)
            bone.keyframe_insert('rotation_quaternion',frame=frame)
            bone.keyframe_insert('scale',frame=frame)
    print('POSTURE',action.name,flush=True)
for obj in source_objects:bpy.data.objects.remove(obj,do_unlink=True)
for action in source_actions.values():bpy.data.actions.remove(action)
for action in original_actions:action.name=action.name.removeprefix('Target|')
for obj in meshes:obj.hide_viewport=False
# Remove redundant constant keys at float32 precision; preserve endpoints.
for action in bpy.data.actions:
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for curve in bag.fcurves:
     keys=curve.keyframe_points
     for key in keys:key.interpolation='LINEAR'
     if len(keys)>2 and all(math.isclose(k.co.y,keys[0].co.y,rel_tol=1e-6,abs_tol=1e-6) for k in keys):
      first,last=tuple(keys[0].co),tuple(keys[-1].co)
      keys.clear();keys.add(2)
      keys[0].co=first;keys[1].co=last
      for key in keys:key.interpolation='LINEAR'
      curve.update()
rig.animation_data.action = bpy.data.actions['idle 50']
rig.animation_data.action_slot = rig.animation_data.action.slots[0]
bpy.context.scene.frame_set(0)
for image in bpy.data.images:
    if image.has_data: image.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(EDITABLE/'dachshund.blend'), compress=True)
for obj in meshes:obj.hide_viewport=True
bpy.ops.export_scene.gltf(filepath=str(OUT/'dog.glb'),export_format='GLB',use_selection=False,export_animations=True,export_skins=True,export_animation_mode='ACTIONS',export_force_sampling=False)
print('RIG_EXPORTED',OUT,flush=True)
os._exit(0)
