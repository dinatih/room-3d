import struct
import json
import math

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

def print_cc_bones(path, model_name):
    gltf = read_glb_json(path)
    if not gltf:
        print(f"Could not load {model_name}")
        return
    print(f"\n=== Nodes in {model_name} ===")
    nodes = gltf.get('nodes', [])
    for idx, node in enumerate(nodes):
        name = node.get('name', '')
        if 'hip' in name.lower() or 'pelvis' in name.lower() or 'thigh' in name.lower() or 'upperarm' in name.lower():
            pos = node.get('translation', [0, 0, 0])
            rot = node.get('rotation', [0, 0, 0, 1])
            scale = node.get('scale', [1, 1, 1])
            print(f"Node {idx:02d}: {name:<45}")
            print(f"  Translation: {pos}")
            print(f"  Rotation:    {rot}")

print_cc_bones("/home/dinatih/Projects/room-3d/public/media/sandbox/CChomme.glb", "CC Homme GLB")
print_cc_bones("/home/dinatih/Projects/room-3d/public/media/sandbox/CCFemme.glb", "CC Femme GLB")
