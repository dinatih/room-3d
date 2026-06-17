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
    else:
        if component_type == 5123:
            fmt = 'H'
            size = 2
        elif component_type == 5121:
            fmt = 'B'
            size = 1
        else:
            raise ValueError(f"Unsupported component type {component_type}")
            
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
        if component_type == 5123:
            unpacked = [x / 65535.0 for x in unpacked]
        elif component_type == 5121:
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
    
    materials = js.get('materials', [])
    
    print("Primitives containing vertices in height range [22.0, 33.0] and legs region (abs(x) between 3.0 and 15.0):")
    
    for mesh_idx, mesh in enumerate(js.get('meshes', [])):
        for prim_idx, prim in enumerate(mesh.get('primitives', [])):
            attributes = prim.get('attributes', {})
            pos_accessor_idx = attributes.get('POSITION')
            
            if pos_accessor_idx is not None:
                positions = get_accessor_data(js, bin_data, pos_accessor_idx)
                
                # Filter vertices by height and lateral position matching the legs
                x = positions[:, 0]
                y = positions[:, 1]
                z = positions[:, 2]
                
                # Left/Right leg area: 3.0 < abs(X) < 15.0, Z between -12 and 15, Y between 22 and 33
                mask = (y >= 22.0) & (y <= 33.0) & (np.abs(x) >= 3.0) & (np.abs(x) <= 15.0) & (z >= -12.0) & (z <= 15.0)
                matching_count = np.sum(mask)
                
                if matching_count > 0:
                    mat_idx = prim.get('material')
                    mat_name = materials[mat_idx].get('name') if mat_idx is not None else "None"
                    print(f"Mesh {mesh_idx}, Prim {prim_idx} ({mat_name}): {matching_count} vertices in leg height zone")
                    print(f"  -> X bounds: [{x[mask].min():.2f}, {x[mask].max():.2f}], Y bounds: [{y[mask].min():.2f}, {y[mask].max():.2f}]")

if __name__ == "__main__":
    main()
