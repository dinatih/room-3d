"""Offline, synchronized donor/before/after cycle sheets and numerical joint audit."""
from pathlib import Path
import bpy, json, math, os, sys, argparse
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/ushiro/rebuild'
parser = argparse.ArgumentParser(); parser.add_argument('--final', action='store_true')
parser.add_argument('--candidate-only', action='store_true')
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
AFTER = ROOT/'public/characters/ushiro/ushiro.glb' if args.final else Path('/tmp/ushiro-candidate.glb')
models = [('Pitbull', ROOT/'public/characters/animated-pitbull-dog/dog.glb'),
          ('Ushiro avant', Path('/tmp/ushiro-before-rebuild.glb')), ('Ushiro corrigé', AFTER)]
clips = [('idle','idle 50'), ('walk','walk_fwd 29'), ('run','run_fwd 13')]
report = json.loads((OUT/'cycle-measurements.json').read_text()) if args.candidate_only else {}
for label, path in models:
    if args.candidate_only and label != 'Ushiro corrigé': continue
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=str(path))
    rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    for track in list(rig.animation_data.nla_tracks): rig.animation_data.nla_tracks.remove(track)
    rig.animation_data.action = None
    for pb in rig.pose.bones: pb.matrix_basis.identity()
    bpy.context.view_layer.update()
    if label=='Pitbull':
        for action in bpy.data.actions:
            for layer in action.layers:
                for strip in layer.strips:
                    for bag in strip.channelbags:
                        for curve in bag.fcurves:
                            for key in curve.keyframe_points:key.interpolation='LINEAR'
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.vertex_groups]
    body = max(meshes, key=lambda o: len(o.data.vertices))
    for material in bpy.data.materials:
        if material.use_nodes:
            texture = next((n for n in material.node_tree.nodes if n.type=='TEX_IMAGE' and n.image and ('diffuse' in n.image.name.lower() or 'basecolor' in n.image.name.lower())), None)
            if texture: material.node_tree.nodes.active = texture
    graph = bpy.context.evaluated_depsgraph_get()
    rest_points = [o.matrix_world @ v.co for o in meshes for v in o.evaluated_get(graph).data.vertices]
    lo = Vector([min(p[i] for p in rest_points) for i in range(3)])
    hi = Vector([max(p[i] for p in rest_points) for i in range(3)])
    height = hi.z-lo.z
    center = (lo+hi)/2
    scene = bpy.context.scene; scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.resolution_x = 480; scene.render.resolution_y = 360; scene.render.resolution_percentage = 100
    scene.display.shading.color_type='TEXTURE'; scene.display.shading.light='STUDIO'
    scene.display.shading.show_shadows=True; scene.display.shading.show_cavity=True
    scene.display.shading.background_type='WORLD'; scene.world=bpy.data.worlds.new('Review background'); scene.world.color=(.23,.26,.30)
    bpy.ops.object.camera_add(); camera=bpy.context.object; scene.camera=camera; camera.data.type='ORTHO'
    camera.data.ortho_scale = height * 1.8
    camera.location = center + Vector((height*4,0,height*.12))
    camera.rotation_euler = (center-camera.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=20); plane=bpy.context.object; plane.location.z=0; plane.color=(.4,.4,.4,1)
    for slug, name in clips:
        action = bpy.data.actions[name]; rig.animation_data.action=action; rig.animation_data.action_slot=action.slots[0]
        start,end=action.frame_range; samples=[]
        cycle_points=[]
        for i in range(8):
            frame=start+(end-start)*i/8;scene.frame_set(int(frame),subframe=frame%1);bpy.context.view_layer.update()
            graph=bpy.context.evaluated_depsgraph_get()
            cycle_points.extend(o.matrix_world@Vector(corner) for o in meshes for corner in o.evaluated_get(graph).bound_box)
        cycle_center=Vector([(min(p[i] for p in cycle_points)+max(p[i] for p in cycle_points))/2 for i in range(3)])
        def fit_camera(offset, points, focus):
            camera.location=focus+Vector(offset);camera.rotation_euler=(focus-camera.location).to_track_quat('-Z','Y').to_euler()
            right=camera.rotation_euler.to_quaternion()@Vector((1,0,0));up=camera.rotation_euler.to_quaternion()@Vector((0,1,0))
            width=max(p.dot(right) for p in points)-min(p.dot(right) for p in points)
            vertical=max(p.dot(up) for p in points)-min(p.dot(up) for p in points)
            camera.data.ortho_scale=max(width,vertical*scene.render.resolution_x/scene.render.resolution_y)*1.1
        fit_camera((height*4,0,height*.12),cycle_points,cycle_center)
        for i in range(8):
            frame=start+(end-start)*i/8; scene.frame_set(int(frame), subframe=frame%1); bpy.context.view_layer.update()
            graph=bpy.context.evaluated_depsgraph_get()
            skin=[o.matrix_world@v.co for o in meshes for v in o.evaluated_get(graph).data.vertices]
            joints={n:list(rig.matrix_world@rig.pose.bones[n].matrix.translation) for n in ['LeftShoulder','LeftArm','LeftForeArm','LeftHand','LeftPelvis','LeftUpLeg','LeftLeg','LeftFoot']}
            def angle(a,b,c):
                a,b,c=[Vector(joints[n]) for n in [a,b,c]]
                return math.degrees((a-b).angle(c-b))
            # Old rig's names were shifted; use its actual anatomical pivots.
            if label=='Ushiro avant':
                joints.update({n:list(rig.matrix_world@rig.pose.bones[n].matrix.translation) for n in ['LeftShoulder','LeftArm','LeftForeArm','LeftHand','LeftPelvis','LeftUpLeg','LeftLeg','LeftFoot']})
                elbow=angle('LeftArm','LeftForeArm','LeftHand'); knee=angle('LeftUpLeg','LeftLeg','LeftFoot')
            else:
                joints['LeftShoulder01']=list(rig.matrix_world@rig.pose.bones['LeftShoulder01'].matrix.translation)
                elbow=angle('LeftShoulder01','LeftArm','LeftForeArm'); knee=angle('LeftPelvis','LeftUpLeg','LeftLeg')
            samples.append(dict(phase=i/8, elbow=elbow, knee=knee, minimumGround=min(p.z for p in skin), height=height, joints=joints))
            filename=f'{slug}-{models.index((label,path))}-{i}.png'; scene.render.filepath=str(OUT/filename)
            bpy.ops.render.render(write_still=True)
        report.setdefault(label,{})[slug]=samples
        if label=='Ushiro corrigé':
            for i in ([0] if slug=='idle' else [0,2,4,6]):
                frame=start+(end-start)*i/8;scene.frame_set(int(frame),subframe=frame%1);bpy.context.view_layer.update()
                for view,offset in [('front',(0,-4*height,height*.1)),('three-quarter',(3*height,-3*height,height*.6))]:
                    fit_camera(offset,cycle_points,cycle_center)
                    scene.render.filepath=str(OUT/f'{slug}-{view}-{i}.png');bpy.ops.render.render(write_still=True)
                # Closest forelimb, selected by authored dominant skin weights.
                graph=bpy.context.evaluated_depsgraph_get();skin=body.evaluated_get(graph).data
                limb_names={'LeftShoulder01','LeftArm','LeftForeArm','LeftHand'}
                limb_points=[body.matrix_world@skin.vertices[v.index].co for v in body.data.vertices if v.groups and body.vertex_groups[max(v.groups,key=lambda g:g.weight).group].name in limb_names]
                focus=Vector([(min(p[i] for p in limb_points)+max(p[i] for p in limb_points))/2 for i in range(3)])
                fit_camera((height*4,0,0),limb_points,focus)
                scene.render.filepath=str(OUT/f'{slug}-forelimb-{i}.png');bpy.ops.render.render(write_still=True)
    print('RENDERED', label, flush=True)
(OUT/'cycle-measurements.json').write_text(json.dumps(report,indent=2)+'\n')
print('REVIEW_COMPLETE',flush=True);os._exit(0)
