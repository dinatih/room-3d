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
    
    # Build child-to-parent map
    parent_map = {}
    for idx, node in enumerate(nodes):
        children = node.get('children', [])
        for c_idx in children:
            parent_map[c_idx] = idx
            
    print("Skeletal Hierarchy:")
    for idx, node in enumerate(nodes):
        name = node.get('name', '')
        # Only show bones/joints
        is_bone = 'mixamorig' in name.lower() or 'root' in name.lower() or 'hip' in name.lower()
        if is_bone:
            parent_idx = parent_map.get(idx)
            parent_name = nodes[parent_idx].get('name') if parent_idx is not None else "Root (none)"
            print(f"Node {idx:02d}: {name:<30} | Parent: {parent_name}")
