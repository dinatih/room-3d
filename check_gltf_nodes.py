import json
import struct

with open('/home/dinatih/Projects/room-3d/public/models/test_metarig_anims/idle.glb', 'rb') as f:
    magic = f.read(4)
    version = struct.unpack('<I', f.read(4))[0]
    length = struct.unpack('<I', f.read(4))[0]
    
    chunk_len = struct.unpack('<I', f.read(4))[0]
    chunk_type = f.read(4)
    json_data = f.read(chunk_len).decode('utf-8')
    
gltf = json.loads(json_data)

def get_node_by_name(name):
    for i, n in enumerate(gltf.get('nodes', [])):
        if n.get('name') == name:
            return i, n
    return None, None

def print_node_hierarchy():
    for i, n in enumerate(gltf.get('nodes', [])):
        print(f"Node {i}: {n.get('name')} rotation: {n.get('rotation', [0,0,0,1])}")
        children = n.get('children', [])
        if children:
            print(f"  Children: {children}")

print_node_hierarchy()
