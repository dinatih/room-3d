import json
import struct
import numpy as np
from PIL import Image

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
    
    if component_type == 5123: # UNSIGNED_SHORT
        fmt = 'H'
        size = 2
    elif component_type == 5125: # UNSIGNED_INT
        fmt = 'I'
        size = 4
    elif component_type == 5121: # UNSIGNED_BYTE
        fmt = 'B'
        size = 1
    else:
        raise ValueError(f"Unsupported index component type {component_type}")
        
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
    
    # Extract Boots Primitive (Material 8)
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
                
    if pos is None or uv is None or indices is None:
        print("Could not find boots primitive data")
        return
        
    print(f"Boots Primitive: {len(pos)} vertices, {len(indices)//3} triangles.")
    
    # Rasterize height map
    width, height = 512, 512
    height_map = np.full((height, width), -1.0, dtype=np.float32)
    
    # For each triangle
    for i in range(0, len(indices), 3):
        idx0, idx1, idx2 = indices[i], indices[i+1], indices[i+2]
        
        # 3D Positions (height is Y, index 1)
        y0, y1, y2 = pos[idx0, 1], pos[idx1, 1], pos[idx2, 1]
        
        # UVs
        uv0, uv1, uv2 = uv[idx0], uv[idx1], uv[idx2]
        
        # Bounding box in UV space
        u_min = min(uv0[0], uv1[0], uv2[0])
        u_max = max(uv0[0], uv1[0], uv2[0])
        v_min = min(uv0[1], uv1[1], uv2[1])
        v_max = max(uv0[1], uv1[1], uv2[1])
        
        # Convert to pixel bbox
        px_min = max(0, int(u_min * width))
        px_max = min(width - 1, int(u_max * width) + 1)
        py_min = max(0, int((1.0 - v_max) * height))
        py_max = min(height - 1, int((1.0 - v_min) * height) + 1)
        
        # 2D UV points for triangle vertices
        a = np.array([uv0[0], uv0[1]])
        b = np.array([uv1[0], uv1[1]])
        c = np.array([uv2[0], uv2[1]])
        
        for py in range(py_min, py_max + 1):
            for px in range(px_min, px_max + 1):
                # Pixel UV center
                p = np.array([px / width, 1.0 - py / height])
                
                # Check barycentric coordinates
                u_coord, v_coord, w_coord = barycentric_coords(p, a, b, c)
                if u_coord >= -0.01 and v_coord >= -0.01 and w_coord >= -0.01:
                    # Interpolated height
                    h_val = u_coord * y0 + v_coord * y1 + w_coord * y2
                    # Store max height if overlapping
                    height_map[py, px] = max(height_map[py, px], h_val)
                    
    # Now load original 8016.png
    orig_path = "sources_backup/lara-croft-2026-rigged/textures/8016.png"
    orig_img = Image.open(orig_path).convert('RGBA')
    orig_arr = np.array(orig_img)
    
    new_arr = orig_arr.copy()
    
    # Golden and Red target RGBs
    gold_rgb = np.array([230, 180, 34], dtype=np.float32)   # Vibrant gold
    red_rgb = np.array([235, 15, 15], dtype=np.float32)     # Vibrant red
    
    sock_count = 0
    boot_count = 0
    
    for py in range(height):
        for px in range(width):
            h_val = height_map[py, px]
            if h_val >= 0.0:
                r_orig, g_orig, b_orig, a_orig = orig_arr[py, px]
                
                # Relative luminance of the original pixel
                lum = 0.299 * r_orig + 0.587 * g_orig + 0.114 * b_orig
                
                if h_val > 22.0:
                    # SOCKS -> Golden
                    # Use a baseline of 50% brightness + 50% original luminance scaling
                    factor = 0.5 + 0.5 * (lum / 255.0)
                    r_new = min(255, int(gold_rgb[0] * factor))
                    g_new = min(255, int(gold_rgb[1] * factor))
                    b_new = min(255, int(gold_rgb[2] * factor))
                    new_arr[py, px] = [r_new, g_new, b_new, a_orig]
                    sock_count += 1
                else:
                    # BOOTS -> Red
                    # Use a baseline of 40% brightness + 60% original luminance scaling
                    factor = 0.4 + 0.6 * (lum / 255.0)
                    r_new = min(255, int(red_rgb[0] * factor))
                    g_new = min(255, int(red_rgb[1] * factor))
                    b_new = min(255, int(red_rgb[2] * factor))
                    new_arr[py, px] = [r_new, g_new, b_new, a_orig]
                    boot_count += 1
                    
    print(f"Processed: {sock_count} socks pixels, {boot_count} boots pixels.")
    
    out_path = "public/media/textures/8016_cha.png"
    Image.fromarray(new_arr).save(out_path)
    print(f"Successfully generated mathematically perfect texture at {out_path}!")

if __name__ == "__main__":
    main()
