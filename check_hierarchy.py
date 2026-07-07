import json
import struct

with open('/home/dinatih/Projects/room-3d/public/models/lara_perfect.glb', 'rb') as f:
    magic = f.read(4)
    version = struct.unpack('<I', f.read(4))[0]
    length = struct.unpack('<I', f.read(4))[0]
    
    chunk_len = struct.unpack('<I', f.read(4))[0]
    chunk_type = f.read(4)
    json_data = f.read(chunk_len).decode('utf-8')
    
gltf = json.loads(json_data)
nodes = gltf.get('nodes', [])

def get_node_by_name(name):
    for i, n in enumerate(nodes):
        if n.get('name') == name:
            return i, n
    return None, None

def print_translation(name):
    idx, node = get_node_by_name(name)
    if not node:
        print(f"{name} not found")
        return
    t = node.get('translation', [0,0,0])
    print(f"{name} translation: {t}")

print_translation('spine.003')
print_translation('spine.004')
print_translation('shoulder.L')
print_translation('upper_arm.L')
