"""Add readable product names to the existing laundry GLBs; regenerate their previews.
Run: blender -b --python-exit-code 1 --python scripts/label-laundry-bottles.py
"""
from pathlib import Path
import bpy
from mathutils import Vector
import math
ROOT=Path(__file__).resolve().parents[1]
# Reuse the same offline studio and material helpers as the cleaning accessories.
source=(ROOT/'scripts/generate-cleaning-accessories.py').read_text()
exec(source[:source.index('bpy.ops.wm.read_factory_settings(use_empty=True)')])
for folder,filename,label in [('laundry-detergent','LaundryDetergent','Lessive'),('fabric-softener','FabricSoftener','Adoucissant')]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    OUT=ROOT/'public/items'/folder
    bpy.ops.import_scene.gltf(filepath=str(OUT/(filename+'.glb')))
    # Make this script repeatable without accumulating lettering.
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith('Product label'): bpy.data.objects.remove(obj,do_unlink=True)
    points=[o.matrix_world@Vector(v) for o in bpy.context.scene.objects if o.type=='MESH' for v in o.bound_box]
    lo=Vector(tuple(min(v[i] for v in points) for i in range(3))); hi=Vector(tuple(max(v[i] for v in points) for i in range(3)))
    w,d,h=hi-lo
    ink=mat('Product label navy',(.012,.028,.065),.8)
    # Raised lettering on both broad faces stays legible from either shelf orientation.
    for side in [-1,1]:
        bpy.ops.object.text_add(location=(0,side*(d/2+.0008),h*.49),rotation=(math.pi/2,0,0 if side==-1 else math.pi))
        obj=bpy.context.object; obj.name='Product label '+label; obj.data.body=label; obj.data.align_x='CENTER'; obj.data.align_y='CENTER'; obj.data.size=.01; obj.data.extrude=.00015; obj.data.materials.append(ink)
        bpy.context.view_layer.update(); obj.scale*=w*.84/obj.dimensions.x
        bpy.ops.object.convert(target='MESH')
    finish(filename,(0,0,h/2),h*1.35)
    for view in ['front','three-quarter','back']:
        (OUT/(filename+'-'+view+'.png')).replace(OUT/('preview-'+view+'.png'))
