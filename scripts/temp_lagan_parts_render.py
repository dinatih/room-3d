import bpy
from pathlib import Path
from mathutils import Vector
exec(compile(Path('scripts/temp_inspect_lagan.py').read_text(),'inspect','exec'))
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
# Rebuild the same seam-connected component list for inspection only.
mesh=obj.data
parts=[]
remaining=set(range(len(mesh.vertices)))
while remaining:
    todo=[min(remaining)];ids=set()
    while todo:
        i=todo.pop()
        if i in ids:continue
        ids.add(i);todo.extend(adjacency[i]-ids)
    remaining-=ids;parts.append(ids)
selected=[28,29,31,32,33,34,35,36,37,38,39,40,45,48,50,51]
material=bpy.data.materials.new('Inspection');material.diffuse_color=(.65,.75,.85,1)
for index,part in enumerate(selected):
    ids=parts[part];vertices=sorted(ids);mapping={old:new for new,old in enumerate(vertices)}
    coords=[obj.matrix_world @ mesh.vertices[i].co for i in vertices]
    center=sum(coords,Vector())/len(coords)
    faces=[[mapping[i] for i in face.vertices] for face in mesh.polygons if face.vertices[0] in ids]
    data=bpy.data.meshes.new(str(part));data.from_pydata([v-center for v in coords],[],faces)
    item=bpy.data.objects.new(f'part_{part}',data);bpy.context.collection.objects.link(item)
    item.location=((index%4)*.7,0,-(index//4)*.65);item.data.materials.append(material)
    bpy.ops.object.text_add(location=(item.location.x-.15,-.3,item.location.z-.26),rotation=(1.570796,0,0))
    label=bpy.context.object;label.data.body=str(part);label.data.size=.1
bpy.data.objects.remove(obj,do_unlink=True)
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.display.shading.light='STUDIO';scene.display.shading.color_type='MATERIAL';scene.display.shading.show_shadows=False;scene.display.shading.show_cavity=True
scene.render.resolution_x=1400;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
bpy.ops.object.camera_add(location=(1.05,-5,-.7));camera=bpy.context.object;camera.rotation_euler=(Vector((1.05,0,-.95))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.9;scene.camera=camera
scene.render.filepath='/tmp/lagan-components.png';bpy.ops.render.render(write_still=True)
