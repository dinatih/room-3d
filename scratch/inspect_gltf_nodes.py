import json

def inspect_gltf(path, label):
    print(f"\n=== GLTF INSPECTION FOR {label} ===")
    with open(path, 'rb') as f:
        data = f.read()
    
    # Simple glb parser to extract JSON chunk
    magic = data[:4]
    if magic != b'glTF':
        print("Not a GLB file!")
        return
        
    version = int.from_bytes(data[4:8], 'little')
    length = int.from_bytes(data[8:12], 'little')
    
    # First chunk is JSON
    chunk_length = int.from_bytes(data[12:16], 'little')
    chunk_type = data[16:20]
    
    if chunk_type != b'JSON':
        print("First chunk is not JSON!")
        return
        
    json_data = data[20:20+chunk_length].decode('utf-8')
    gltf = json.loads(json_data)
    
    # Print node list and their translations
    nodes = gltf.get('nodes', [])
    print(f"Total nodes: {len(nodes)}")
    
    # Find some leg/foot/breast nodes
    interesting_names = ['breast_left_base', 'breast_right_base', 'left_foot', 'left_ankle', 'left_knee', 'left_thigh', 'spine_upper', 'spine_3']
    for idx, node in enumerate(nodes):
        name = node.get('name', '')
        name_lower = name.lower()
        if any(x in name_lower for x in interesting_names) or 'breast' in name_lower:
            print(f"  Node {idx} '{name}':")
            if 'translation' in node:
                print(f"    Translation: {node['translation']}")
            else:
                print(f"    Translation: None (defaults to [0,0,0])")
            if 'rotation' in node:
                print(f"    Rotation: {node['rotation']}")
            if 'scale' in node:
                print(f"    Scale: {node['scale']}")
            if 'children' in node:
                print(f"    Children: {node['children']}")

inspect_gltf("/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb", "lara_native")
inspect_gltf("/home/dinatih/Projects/room-3d/public/media/all_lara/01_bikini.glb", "01_bikini")
inspect_gltf("/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb", "07_scoop")
