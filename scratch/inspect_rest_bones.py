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

gltf = read_glb_json("/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_just_dont_stare_into_the_eyes.glb")
if gltf:
    nodes = gltf.get('nodes', [])
    print("Nodes default transformations:")
    for idx, node in enumerate(nodes):
        name = node.get('name', '')
        if 'root' in name.lower() or 'hips' in name.lower() or 'shoulder' in name.lower() or 'spine' in name.lower():
            pos = node.get('translation', [0, 0, 0])
            rot = node.get('rotation', [0, 0, 0, 1])
            scale = node.get('scale', [1, 1, 1])
            print(f"Node {idx:02d}: {name:<35}")
            print(f"  Translation: {pos}")
            print(f"  Rotation:    {rot}")
            print(f"  Scale:       {scale}")
