import bpy, json, struct, sys, os
from pathlib import Path
for name, source in [('jikin','JikinSF'),('tosakin','TosakinSf')]:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.fbx(filepath=f'/tmp/{name}-goldfish/source/{source}.fbx')
 print('FISH',name,'ACTIONS',[(a.name,tuple(a.frame_range)) for a in bpy.data.actions])
 for obj in bpy.context.scene.objects:
  if obj.type=='MESH': print('MESH',obj.name,tuple(obj.dimensions),[s.material.name for s in obj.material_slots])
 for m in bpy.data.materials:
  print('MATERIAL',m.name,'diffuse',tuple(m.diffuse_color))
  for n in m.node_tree.nodes:
   if n.type=='BSDF_PRINCIPLED': print('BSDF',[(i.name,tuple(i.default_value) if hasattr(i.default_value,'__len__') else i.default_value,[l.from_node.name for l in i.links]) for i in n.inputs if i.name in ['Base Color','Metallic','Roughness','Alpha','Transmission Weight','Specular IOR Level']])
   if n.type=='TEX_IMAGE': print('IMAGE',n.image.name,n.image.filepath)
 print('FPS',bpy.context.scene.render.fps)
b=Path('public/characters/jikin-goldfish/jikin-goldfish.glb').read_bytes();n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);print('GLB_MATERIALS',d['materials'])
sys.stdout.flush();os._exit(0)
