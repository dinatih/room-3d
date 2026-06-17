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

gltf = read_glb_json("/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_just_dont_stare_into_the_eyes.glb")
if gltf:
    nodes = gltf.get('nodes', [])
    print("Transformations for nodes 60-71:")
    for idx in range(60, len(nodes)):
        node = nodes[idx]
        name = node.get('name', '')
        pos = node.get('translation', [0, 0, 0])
        rot = node.get('rotation', [0, 0, 0, 1])
        scale = node.get('scale', [1, 1, 1])
        children = node.get('children', [])
        print(f"Node {idx:02d}: {name:<35} | Children: {children}")
        print(f"  Translation: {pos}")
        print(f"  Rotation:    {rot}")
        print(f"  Scale:       {scale}")
