import bpy, sys, os, json
from pathlib import Path
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/tmp/star-fish/source/StarFish.blend')
print('OBJECTS', [(o.name, o.type, tuple(o.dimensions)) for o in bpy.context.scene.objects])
print('ACTIONS', [(a.name, tuple(a.frame_range)) for a in bpy.data.actions])
print('IMAGES', [(i.name, i.filepath, bool(i.packed_file)) for i in bpy.data.images])
for material in bpy.data.materials:
 print('MATERIAL',material.name, [(n.type, tuple(n.inputs['Base Color'].default_value) if n.type == 'BSDF_PRINCIPLED' else '') for n in material.node_tree.nodes] if material.use_nodes else tuple(material.diffuse_color))
armatures=[o for o in bpy.context.scene.objects if o.type=='ARMATURE']
if len(armatures)!=1 or len(bpy.data.actions)!=1:
 raise RuntimeError('Expected one starfish armature and one action')
armature=armatures[0]
armature.animation_data_create()
armature.animation_data.action=bpy.data.actions[0]
if bpy.data.actions[0].slots:
 armature.animation_data.action_slot=bpy.data.actions[0].slots[0]
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
if not meshes: raise RuntimeError('Starfish mesh missing')
for obj in meshes:
 obj.data.validate(verbose=True)
 obj.data.update()
points=[]
for frame in range(0,81):
 bpy.context.scene.frame_set(frame)
 deps=bpy.context.evaluated_depsgraph_get()
 for obj in meshes:
  evaluated=obj.evaluated_get(deps)
  points.extend(evaluated.matrix_world @ Vector(v) for v in evaluated.bound_box)
low=Vector(tuple(min(p[i] for p in points) for i in range(3))); high=Vector(tuple(max(p[i] for p in points) for i in range(3)))
print('BOUNDS',tuple(low),tuple(high))
center=(low+high)/2
size=high-low
scale=12/max(size.x,size.y) # 12 cm across, adapted to the source model's units.
metadata={'scale':scale,'center':[center.x,center.z,-center.y],
 'radius':((size.x/2)**2+(size.y/2)**2)**0.5*scale,'halfHeight':size.z/2*scale}
(Path.cwd()/'src/features/scene/items/starfishModel.json').write_text(json.dumps(metadata,indent=2)+'\n')
print('NORMALIZED',metadata)
bpy.context.scene.frame_set(0)
print('SCENE',bpy.context.scene.frame_start,bpy.context.scene.frame_end)
print('ARMATURE',armature.hide_get(),armature.hide_viewport,armature.animation_data.action_slot)
for layer in bpy.data.actions[0].layers:
 for strip in layer.strips:
  for bag in strip.channelbags:
   print('CURVES',[(c.data_path,len(c.keyframe_points)) for c in bag.fcurves])
bpy.context.scene.frame_start=0
bpy.context.scene.frame_end=80
for obj in bpy.context.scene.objects:
 obj.hide_set(False)
 obj.hide_viewport=False
# Export only the starfish meshes and their armatures, not the authoring camera/lights.
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
 if o.type in ('MESH','ARMATURE'): o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(Path.cwd()/'public/characters/star-fish/star-fish.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIVE_ACTIONS',export_frame_range=False)
sys.stdout.flush(); sys.stderr.flush(); os._exit(0)
