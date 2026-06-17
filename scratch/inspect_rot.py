import json
import struct
import sys

def inspect_rotation(path):
    print(f"--- INSPECTING ROTATIONS {path} ---")
    with open(path, 'rb') as f:
        data = f.read()
    
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    
    nodes = js.get('nodes', [])
    for node in nodes:
        name = node.get('name', 'NONAME')
        if 'Hips' in name or 'root' in name.lower():
            print(f"Node: {name}")
            if 'rotation' in node:
                print(f"  Rotation: {node['rotation']}")
            if 'translation' in node:
                print(f"  Translation: {node['translation']}")
            if 'scale' in node:
                print(f"  Scale: {node['scale']}")

inspect_rotation(sys.argv[1])
