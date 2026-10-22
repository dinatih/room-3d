"""Author the two high-box interactions. Run: blender -b --python scripts/build-drona-carry.py
Coordinates in the choreography are centimetres, Y up, facing +Z.
The exported clips use Xbot's unchanged rest rig; hands are solved with analytic
2-bone IK, baked at 30 Hz. The same sampled box motion is exported for R3F.
"""
import bpy
import json
import math
from pathlib import Path
from mathutils import Vector, Quaternion

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/animations/custom'
FPS = 30
APPROACH = 62.0
DURATIONS = {'pull': 5.6, 'search': 4.0, 'push': 5.6}
HEIGHTS = {'pyjama': 145.75, 'upper': 136.25}

def world(p):
    return Vector((p[0] / 100, -p[2] / 100, p[1] / 100))

def smooth(a, b, t):
    t = max(0, min(1, t)); t = t*t*(3-2*t)
    return Vector(a).lerp(Vector(b), t)

def curve(keys, t):
    for (ta, a), (tb, b) in zip(keys, keys[1:]):
        if t <= tb:
            return smooth(a, b, (t-ta)/(tb-ta))
    return Vector(keys[-1][1])

def choreography(height, phase, time):
    if phase == 'push':
        return choreography(height, 'pull', DURATIONS['push'] - time)
    box = curve([(0, (0,height,APPROACH)), (1.2,(0,height,APPROACH)),
                 (2.6,(0,height,APPROACH-40)), (3.0,(0,height,APPROACH-40)),
                 (4.6,(27,126,22)), (5.6,(27,126,22))], time)
    if phase == 'search':
        box = Vector((27,126,22))
    # Contact points are palm centres. Direction points from wrist toward fingers.
    left_hold = box + Vector((0,-15,4))
    right_hover = Vector((12,144,16))
    if phase == 'search':
        left = left_hold
        right = curve([(0,right_hover),(.8,(17,150,22)),(1.5,(17,134,22)),
                       (2.1,(22,147,18)),(2.9,(-8,126,15)),(4,right_hover)],time)
        left_dir = Vector((-1,0,0))
        right_dir = curve([(0,(0,-1,0)),(1.5,(0,-1,0)),(2.9,(0,-.4,1)),(4,(0,-1,0))],time).normalized()
    else:
        left_side = box + Vector((16.5,-4,-19))
        right_handle = box + Vector((0,4,-19))
        left = curve([(0,IDLE_PALMS['Left']),(.9,(16.5,height-4,APPROACH-19)),
                      (1.2,left_side),(2.6,left_side),(3,left_hold),(4.6,left_hold),(5.6,left_hold)],time)
        right = curve([(0,IDLE_PALMS['Right']),(.9,(0,height+4,APPROACH-19)),
                       (1.2,right_handle),(2.6,right_handle),(3,right_handle),
                       (4.6,box+Vector((-16.5,4,-5))),(5.6,right_hover)],time)
        left_dir = curve([(0,IDLE_DIRS['Left']),(.9,(-1,0,0)),(5.6,(-1,0,0))],time).normalized()
        right_dir = curve([(0,IDLE_DIRS['Right']),(.9,(0,0,1)),(3,(0,0,1)),(5.6,(0,-1,0))],time).normalized()
    return box, {'Left': (left,left_dir), 'Right': (right,right_dir)}

def aim(bone, child, target):
    bpy.context.view_layer.update()
    origin = rig.matrix_world @ bone.head
    actual = rig.matrix_world @ child.head - origin
    delta = actual.rotation_difference(target-origin)
    rotation = rig.matrix_world.to_quaternion()
    matrix = bone.matrix.copy()
    matrix = (rotation.inverted() @ delta @ rotation).to_matrix().to_4x4() @ matrix
    matrix.translation = bone.matrix.translation
    bone.matrix = matrix
    bpy.context.view_layer.update()

def solve(side, palm, direction):
    upper = rig.pose.bones['mixamorig:'+side+'Arm']
    fore = rig.pose.bones['mixamorig:'+side+'ForeArm']
    hand = rig.pose.bones['mixamorig:'+side+'Hand']
    middle = rig.pose.bones['mixamorig:'+side+'HandMiddle1']
    wrist = world(palm-direction*PALM_LENGTH[side])
    shoulder = rig.matrix_world @ upper.head
    length1, length2 = ARM_LENGTHS[side]
    axis = wrist-shoulder
    dist = axis.length
    if dist >= length1+length2:
        raise ValueError(f'{side} wrist out of reach: {dist*100:.2f} > {(length1+length2)*100:.2f} cm')
    axis.normalize()
    pole = world((65 if side=='Left' else -65,110,0))-shoulder
    pole = (pole-axis*pole.dot(axis)).normalized()
    along = (length1*length1-length2*length2+dist*dist)/(2*dist)
    elbow = shoulder+axis*along+pole*math.sqrt(max(0,length1*length1-along*along))
    aim(upper,fore,elbow)
    aim(fore,hand,wrist)
    aim(hand,middle,wrist+world(direction))
    error = (rig.matrix_world@hand.head-wrist).length*100
    if error > .05:
        raise ValueError(f'IK residual {side}: {error:.3f} cm')
    return error

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'public/characters/xbot/Xbot_official.glb'))
rig = next(o for o in bpy.data.objects if o.type=='ARMATURE')
rig.animation_data.action = bpy.data.actions['idle']
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()
base = {b.name:b.matrix_basis.copy() for b in rig.pose.bones}
rig.animation_data_clear()
IDLE_PALMS, IDLE_DIRS, PALM_LENGTH, ARM_LENGTHS = {},{},{},{}
for side in ['Left','Right']:
    bones = [rig.pose.bones['mixamorig:'+side+n] for n in ['Arm','ForeArm','Hand','HandMiddle1']]
    positions = [rig.matrix_world@b.head for b in bones]
    direction = (positions[3]-positions[2]).normalized()
    PALM_LENGTH[side] = (positions[3]-positions[2]).length*100*.65
    p = positions[2]+direction*PALM_LENGTH[side]/100
    IDLE_PALMS[side] = Vector((p.x*100,p.z*100,-p.y*100))
    IDLE_DIRS[side] = Vector((direction.x,direction.z,-direction.y))
    ARM_LENGTHS[side] = [(positions[i+1]-positions[i]).length for i in range(2)]
# Keep the editable character and an actual-size prop in the .blend.
bpy.ops.mesh.primitive_cube_add(size=1)
prop = bpy.context.object; prop.name='Drona'
prop.dimensions=(.33,.38,.33)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
material=bpy.data.materials.new('Drona red');material.diffuse_color=(.65,.015,.02,1);prop.data.materials.append(material)
scene=bpy.context.scene;scene.render.fps=FPS
trajectories={}; metrics={}
OUT.mkdir(parents=True,exist_ok=True)
for variant,height in HEIGHTS.items():
 for phase,duration in DURATIONS.items():
    animation=f'drona-{variant}-{phase}'
    action=bpy.data.actions.new(animation);rig.animation_data_create();rig.animation_data.action=action
    prop.animation_data_clear()
    samples=[];weights=[];contacts={side: {'palms': [], 'directions': []} for side in ['Left','Right']};worst=0
    for frame in range(round(duration*FPS)+1):
        scene.frame_set(frame)
        for b in rig.pose.bones:
            b.matrix_basis=base[b.name]
        bpy.context.view_layer.update()
        box,hands=choreography(height,phase,frame/FPS)
        reach_time = duration-frame/FPS if phase=='push' else frame/FPS
        weight = min(1,reach_time/.9) if phase!='search' else 1
        weights.append(round(weight*weight*(3-2*weight),6))
        for side,(p,d) in hands.items():
            worst=max(worst,solve(side,p,d))
            contacts[side]['palms'].append([round(v,5) for v in p])
            contacts[side]['directions'].append([round(v,6) for v in d])
            for finger in ['Index','Middle','Ring','Pinky']:
                for segment in [1,2,3]:
                    bone=rig.pose.bones['mixamorig:'+side+'Hand'+finger+str(segment)]
                    grip=.16 if side=='Left' else (.5 if phase=='search' and 1.5 <= frame/FPS <= 2.9 else .12)
                    bone.rotation_quaternion = base[bone.name].to_quaternion() @ Quaternion((1,0,0),grip)
        for b in rig.pose.bones:
            b.rotation_mode='QUATERNION'
            b.keyframe_insert('rotation_quaternion',frame=frame,group=b.name)
            b.keyframe_insert('location',frame=frame,group=b.name)
        prop.location=world(box);prop.keyframe_insert('location',frame=frame)
        # Local offset relative to the original cell, in Three.js centimetres.
        samples.append([round(v,5) for v in (box-Vector((0,height,APPROACH)))])
    prop.animation_data.action.name=animation+'-box'
    for a in [action,prop.animation_data.action]:
        a.use_fake_user=True
        for layer in a.layers:
          for strip in layer.strips:
            for bag in strip.channelbags:
              for fc in bag.fcurves:
                for key in fc.keyframe_points:key.interpolation='LINEAR'
    scene.frame_start=0;scene.frame_end=round(duration*FPS)
    # Export a rig-only animation. Meshes remain in the editable source file.
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{variant}_{phase}.glb'),export_format='GLB',use_selection=True,
        export_animations=True,export_animation_mode='ACTIVE_ACTIONS',export_force_sampling=True,
        export_frame_range=True,export_yup=True)
    trajectories[animation]={'duration':duration,'positions':samples,'hands':contacts,'weights':weights}
    metrics[animation]={'frames':len(samples),'maxWristErrorCm':worst}
rig.animation_data.action=bpy.data.actions['drona-pyjama-pull']
prop.animation_data.action=bpy.data.actions['drona-pyjama-pull-box']
scene.frame_set(0);scene.render.image_settings.file_format='PNG';bpy.context.preferences.filepaths.save_version=0;scene.frame_end=round(DURATIONS['pull']*FPS)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'drona-carry.blend'))
(ROOT/'src/features/scene/animations/dronaCarryMotion.json').write_text(json.dumps(trajectories,separators=(',',':'))+'\n')
print('DRONA_VALIDATION',json.dumps(metrics))
