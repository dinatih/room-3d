import json
import struct
import numpy as np

GLB_PATH = "public/media/sandbox/lara_native.glb"

def get_accessor_data(js, bin_data, accessor_idx):
    accessor = js['accessors'][accessor_idx]
    buffer_view_idx = accessor['bufferView']
    buffer_view = js['bufferViews'][buffer_view_idx]
    
    offset = buffer_view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    count = accessor['count']
    component_type = accessor['componentType']
    type_str = accessor['type']
    
    if component_type == 5126:
        fmt = 'f'
        size = 4
    elif component_type == 5123:
        fmt = 'H'
        size = 2
    elif component_type == 5121:
        fmt = 'B'
        size = 1
    else:
        return None
        
    num_components = {
        'SCALAR': 1,
        'VEC2': 2,
        'VEC3': 3,
        'VEC4': 4
    }[type_str]
    
    byte_stride = buffer_view.get('byteStride')
    
    res = []
    for i in range(count):
        elem_offset = offset + (byte_stride if byte_stride else size * num_components) * i
        chunk = bin_data[elem_offset : elem_offset + size * num_components]
        unpacked = struct.unpack(fmt * num_components, chunk)
        if component_type == 5123 and accessor.get('normalized'):
            unpacked = [x / 65535.0 for x in unpacked]
        elif component_type == 5121 and accessor.get('normalized'):
            unpacked = [x / 255.0 for x in unpacked]
        res.append(unpacked)
        
    return np.array(res)

def main():
    with open(GLB_PATH, 'rb') as f:
        data = f.read()
    
    magic, version, length = struct.unpack('<III', data[:12])
    json_len, json_type = struct.unpack('<II', data[12:20])
    json_data = data[20:20+json_len]
    js = json.loads(json_data.decode('utf-8'))
    
    bin_offset = 20 + json_len
    bin_len, bin_type = struct.unpack('<II', data[bin_offset:bin_offset+8])
    bin_data = data[bin_offset+8 : bin_offset+8+bin_len]
    
    target_mat_idx = 8
    
    for mesh_idx, mesh in enumerate(js.get('meshes', [])):
        for prim_idx, prim in enumerate(mesh.get('primitives', [])):
            if prim.get('material') == target_mat_idx:
                attributes = prim.get('attributes', {})
                print(f"Boots Primitive Attributes: {list(attributes.keys())}")
                
                pos_idx = attributes.get('POSITION')
                color_idx = attributes.get('COLOR_0')
                
                if pos_idx is not None:
                    pos = get_accessor_data(js, bin_data, pos_idx)
                    y_coords = pos[:, 1]
                    
                    if color_idx is not None:
                        colors = get_accessor_data(js, bin_data, color_idx)
                        print(f"COLOR_0 type: {js['accessors'][color_idx]['type']}")
                        print(f"Loaded {len(colors)} vertex colors.")
                        
                        # Socks (Y > 22.0)
                        socks_mask = y_coords > 22.0
                        # Boots (Y <= 22.0)
                        boots_mask = y_coords <= 22.0
                        
                        if np.sum(socks_mask) > 0:
                            avg_socks_color = np.mean(colors[socks_mask], axis=0)
                            print(f"Socks average vertex color: {avg_socks_color}")
                        if np.sum(boots_mask) > 0:
                            avg_boots_color = np.mean(colors[boots_mask], axis=0)
                            print(f"Boots average vertex color: {avg_boots_color}")
                    else:
                        print("No COLOR_0 attribute found in this primitive.")

if __name__ == "__main__":
    main()
