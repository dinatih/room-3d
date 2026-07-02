import bpy
import zipfile

bpy.ops.wm.read_factory_settings(use_empty=True)

zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall("/tmp/scoop_inspect_vc")
fbx_path = "/tmp/scoop_inspect_vc/07 Scoop bodysuit - Shorts.fbx"
bpy.ops.import_scene.fbx(filepath=fbx_path)

mesh_obj = None
for obj in bpy.data.objects:
    if obj.type == 'MESH' and len(obj.data.vertices) > 2000:
        mesh_obj = obj
        break

print(f"Mesh: {mesh_obj.name}")

if mesh_obj.data.color_attributes:
    color_layer = mesh_obj.data.color_attributes.active
    print(f"Active vertex color layer: {color_layer.name}, domain: {color_layer.domain}")
    
    # Let's inspect the vertex colors of the faces in the left slit region
    print("LEFT SLIT FACES VERTEX COLORS:")
    for poly in mesh_obj.data.polygons:
        c = poly.center
        if 0.04 <= c.x <= 0.09 and -0.12 <= c.y <= -0.05 and 1.21 <= c.z <= 1.26:
            colors = []
            for v_idx in poly.vertices:
                if color_layer.domain == 'POINT':
                    color = color_layer.data[v_idx].color
                else:
                    # corner/loop domain
                    color = (1.0, 1.0, 1.0, 1.0)
                colors.append(f"({color[0]:.3f}, {color[1]:.3f}, {color[2]:.3f})")
            print(f"Face {poly.index}: colors={', '.join(colors)}")
else:
    print("No vertex colors found on this mesh.")
