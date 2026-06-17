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

def get_indices(js, bin_data, accessor_idx):
    accessor = js['accessors'][accessor_idx]
    buffer_view_idx = accessor['bufferView']
    buffer_view = js['bufferViews'][buffer_view_idx]
    
    offset = buffer_view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    count = accessor['count']
    component_type = accessor['componentType']
    
    if component_type == 5123:
        fmt = 'H'
        size = 2
    elif component_type == 5125:
        fmt = 'I'
        size = 4
    else:
        return None
        
    res = []
    for i in range(count):
        elem_offset = offset + size * i
        chunk = bin_data[elem_offset : elem_offset + size]
        unpacked = struct.unpack(fmt, chunk)[0]
        res.append(unpacked)
    return np.array(res)

def barycentric_coords(p, a, b, c):
    v0 = b - a
    v1 = c - a
    v2 = p - a
    d00 = np.dot(v0, v0)
    d01 = np.dot(v0, v1)
    d11 = np.dot(v1, v1)
    d20 = np.dot(v2, v0)
    d21 = np.dot(v2, v1)
    denom = d00 * d11 - d01 * d01
    if abs(denom) < 1e-9:
        return -1, -1, -1
    v = (d11 * d20 - d01 * d21) / denom
    w = (d00 * d21 - d01 * d20) / denom
    u = 1.0 - v - w
    return u, v, w

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
    pos = None
    uv = None
    indices = None
    
    for mesh_idx, mesh in enumerate(js.get('meshes', [])):
        for prim_idx, prim in enumerate(mesh.get('primitives', [])):
            if prim.get('material') == target_mat_idx:
                attributes = prim.get('attributes', {})
                pos = get_accessor_data(js, bin_data, attributes['POSITION'])
                uv = get_accessor_data(js, bin_data, attributes['TEXCOORD_0'])
                indices = get_indices(js, bin_data, prim['indices'])
                break
                
    width, height = 512, 512
    
    # Target pixels
    targets = [(96, 32), (34, 44), (50, 38), (467, 429)]
    
    for px, py in targets:
        p = np.array([px / width, 1.0 - py / height])
        best_h = -1.0
        matching_triangles = 0
        
        for i in range(0, len(indices), 3):
            idx0, idx1, idx2 = indices[i], indices[i+1], indices[i+2]
            uv0, uv1, uv2 = uv[idx0], uv[idx1], uv[idx2]
            y0, y1, y2 = pos[idx0, 1], pos[idx1, 1], pos[idx2, 1]
            
            a = np.array([uv0[0], uv0[1]])
            b = np.array([uv1[0], uv1[1]])
            c = np.array([uv2[0], uv2[1]])
            
            u_c, v_c, w_c = barycentric_coords(p, a, b, c)
            if u_c >= -0.01 and v_c >= -0.01 and w_c >= -0.01:
                h_val = u_c * y0 + v_c * y1 + w_c * y2
                best_h = max(best_h, h_val)
                matching_triangles += 1
                
        print(f"Pixel X={px}, Y={py} | Matching Triangles={matching_triangles} | Height={best_h:.2f}cm")

if __name__ == "__main__":
    main()
