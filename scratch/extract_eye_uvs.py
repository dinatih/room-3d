import json
import struct
import numpy as np

GLB_PATH = "public/media/sandbox/lara_native.glb"

def main():
    with open(GLB_PATH, 'rb') as f:
        data = f.read()
    
    # Read GLB header
    magic, version, length = struct.unpack('<III', data[:12])
    if magic != 0x46546C67:
        print("Not a valid GLB file")
        return
        
    json_len, json_type = struct.unpack('<II', data[12:20])
    json_data = data[20:20+json_len]
    js = json.loads(json_data.decode('utf-8'))
    
    bin_offset = 20 + json_len
    # Binary chunk starts with length and type
    bin_len, bin_type = struct.unpack('<II', data[bin_offset:bin_offset+8])
    bin_data = data[bin_offset+8 : bin_offset+8+bin_len]
    
    # Let's find the mesh that has the material "5_Eyes_1.0_0_0" (material index 11)
    target_mat_idx = 11
    
    # Traverse meshes
    for mesh_idx, mesh in enumerate(js.get('meshes', [])):
        for prim_idx, prim in enumerate(mesh.get('primitives', [])):
            if prim.get('material') == target_mat_idx:
                print(f"Mesh {mesh_idx} ({mesh.get('name')}), Primitive {prim_idx} uses material 11")
                # Get TEXCOORD_0 accessor
                attributes = prim.get('attributes', {})
                uv_accessor_idx = attributes.get('TEXCOORD_0')
                if uv_accessor_idx is not None:
                    uvs = get_accessor_data(js, bin_data, uv_accessor_idx)
                    u_min, u_max = uvs[:, 0].min(), uvs[:, 0].max()
                    v_min, v_max = uvs[:, 1].min(), uvs[:, 1].max()
                    print(f"UV Bounds: U=[{u_min:.4f}, {u_max:.4f}], V=[{v_min:.4f}, {v_max:.4f}]")
                    # Pixel coordinates (assuming 512x512, Y is inverted in webgl UV space: Y = 1 - V)
                    # So y_min_pixel = (1 - v_max) * 512, y_max_pixel = (1 - v_min) * 512
                    x_min_px = int(u_min * 512)
                    x_max_px = int(u_max * 512)
                    y_min_px = int((1.0 - v_max) * 512)
                    y_max_px = int((1.0 - v_min) * 512)
                    print(f"Pixel bounds (512x512): X=[{x_min_px}, {x_max_px}], Y=[{y_min_px}, {y_max_px}]")

def get_accessor_data(js, bin_data, accessor_idx):
    accessor = js['accessors'][accessor_idx]
    buffer_view_idx = accessor['bufferView']
    buffer_view = js['bufferViews'][buffer_view_idx]
    
    offset = buffer_view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    count = accessor['count']
    component_type = accessor['componentType']
    type_str = accessor['type']
    
    # componentType 5126 is FLOAT
    if component_type == 5126:
        fmt = 'f'
        size = 4
    else:
        # We assume float for UVs in general, but if it's 5121 (UNSIGNED_BYTE) or 5123 (UNSIGNED_SHORT) normalized:
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
        if component_type == 5123: # normalized unsigned short
            unpacked = [x / 65535.0 for x in unpacked]
        elif component_type == 5121: # normalized unsigned byte
            unpacked = [x / 255.0 for x in unpacked]
        res.append(unpacked)
        
    return np.array(res)

if __name__ == "__main__":
    main()
