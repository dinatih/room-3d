import struct
import json

def read_glb_json(path):
    with open(path, 'rb') as f:
        # Read header
        magic = f.read(4)
        if magic != b'glTF':
            print("Not a GLB file")
            return None
        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]
        
        # Read chunk 0 (JSON)
        chunk_length = struct.unpack('<I', f.read(4))[0]
        chunk_type = f.read(4)
        if chunk_type != b'JSON':
            print("First chunk is not JSON")
            return None
        
        json_data = f.read(chunk_length)
        return json.loads(json_data.decode('utf-8'))

gltf = read_glb_json("/home/dinatih/Projects/room-3d/public/media/all_lara/lara_croft_just_dont_stare_into_the_eyes.glb")
if gltf:
    nodes = gltf.get('nodes', [])
    skins = gltf.get('skins', [])
    print(f"Loaded GLB. Nodes: {len(nodes)}, Skins: {len(skins)}")
    
    # Let's print all nodes that are bones, or all nodes that have mixamorig in their names
    mixamo_nodes = []
    for i, node in enumerate(nodes):
        name = node.get('name', '')
        if 'mixamo' in name.lower() or 'shoulder' in name.lower() or 'clavicle' in name.lower() or 'arm' in name.lower():
            mixamo_nodes.append((i, name))
            
    print("\nRelevant nodes in GLB:")
    for idx, name in mixamo_nodes:
        print(f"Node {idx}: {name}")
