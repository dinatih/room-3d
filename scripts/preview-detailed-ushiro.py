"""Render Ushiro's three inventory views; update measured presentation bounds."""
import bpy,json,os
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];folder=root/'public/characters/ushiro'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(folder/'ushiro.glb'))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
for track in list(rig.animation_data.nla_tracks):rig.animation_data.nla_tracks.remove(track)
action=bpy.data.actions['standing_skeletal.3'];rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0]
bpy.context.scene.frame_set(0)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];depsgraph=bpy.context.evaluated_depsgraph_get()
points=[o.matrix_world@v.co for o in meshes for v in o.evaluated_get(depsgraph).data.vertices]
lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)));size=hi-lo;center=(lo+hi)/2;span=max(size)
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='TEXTURE';scene.display.shading.background_type='WORLD';scene.world=bpy.data.worlds.new('Grey');scene.world.color=(.15,.15,.15)
scene.render.resolution_x=550;scene.render.resolution_y=550;scene.render.resolution_percentage=100;scene.render.image_settings.color_depth='8';scene.render.image_settings.compression=50
bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=span*1.35
for label,vector in [('front',(0,-2,.6)),('three-quarter',(1.5,-2,.8)),('back',(-1.5,2,.8))]:
 scene.camera.location=center+Vector(vector)*span;scene.camera.rotation_euler=(center-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(folder/(label+'.png'));bpy.ops.render.render(write_still=True)
# Additional poses to inspect the transferred limb chains.
for label,name in [('walk','walk_fwd 29'),('run','run_fwd 13')]:
 action=bpy.data.actions[name];rig.animation_data.action=action;rig.animation_data.action_slot=action.slots[0];scene.frame_set(round(action.frame_range[1]/2));scene.render.filepath='/tmp/ushiro-'+label+'.png';bpy.ops.render.render(write_still=True)
print('VALIDATED',str(folder/'ushiro.glb'),flush=True);os._exit(0)
