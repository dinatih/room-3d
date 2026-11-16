"""Render three quick offline views and measure the six imported dogs."""
import bpy,json,os
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
p=root/'src/features/inventory/extraDogs.json'
items=json.loads(p.read_text())
for item in items:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 path=root/'public'/item['glbPath'];bpy.ops.import_scene.gltf(filepath=str(path))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 depsgraph=bpy.context.evaluated_depsgraph_get()
 points=[o.matrix_world@v.co for o in meshes for v in o.evaluated_get(depsgraph).data.vertices]
 lo=Vector(tuple(min(v[a] for v in points) for a in range(3)));hi=Vector(tuple(max(v[a] for v in points) for a in range(3)))
 size=hi-lo
 item['dims']={'w':round(size.x/size.z*item['dims']['h'],2),'d':round(size.y/size.z*item['dims']['h'],2),'h':item['dims']['h']}
 scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='TEXTURE';scene.display.shading.show_shadows=True;scene.display.shading.background_type='WORLD';scene.world=bpy.data.worlds.new('Preview grey');scene.world.color=(.15,.15,.15)
 scene.render.resolution_x=500;scene.render.resolution_y=500;scene.render.resolution_percentage=100;scene.render.image_settings.color_depth='8';scene.render.image_settings.compression=50
 for o in bpy.context.scene.objects:
  if o.type=='ARMATURE':o.hide_render=True
 center=(hi+lo)/2;span=max(size)
 bpy.ops.object.camera_add();scene.camera=bpy.context.object;scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=span*1.5
 item['photos']=[]
 for name,vec in [('front',(0,-2,.6)),('three-quarter',(1.4,-2,1)),('back',(-1.3,2,.8))]:
  scene.camera.location=center+Vector(vec)*span;scene.camera.rotation_euler=(center-scene.camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(path.parent/f'{name}.png');bpy.ops.render.render(write_still=True);item['photos'].append(str((path.parent/f'{name}.png').relative_to(root/'public')))
 print('VALIDATED',str(path),flush=True)
p.write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n');os._exit(0)
