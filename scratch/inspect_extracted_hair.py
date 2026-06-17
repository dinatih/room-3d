import struct
import json

def read_glb_json(path):
    with open(path, 'rb') as f:
        magic = f.read(4)
        if magic != b'glTF':
            return None
        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]
        chunk_length = struct.unpack('<I', f.read(4))[0]
        chunk_type = f.read(4)
        json_data = f.read(chunk_length)
        return json.loads(json_data.decode('utf-8'))

gltf = read_glb_json("/home/dinatih/Projects/room-3d/public/media/all_lara/lara_hair.glb")
if gltf:
    nodes = gltf.get('nodes', [])
    meshes = gltf.get('meshes', [])
    print(f"Nodes: {len(nodes)}, Meshes: {len(meshes)}")
    print("\nNode Names:")
    for idx, node in enumerate(nodes):
        print(f"  - Node {idx:02d}: {node.get('name', '')}")
    print("\nMesh Names:")
    for idx, mesh in enumerate(meshes):
        print(f"  - Mesh {idx:02d}: {mesh.get('name', '')}")
