import json
import struct
import numpy as np
from PIL import Image
import os

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
    
    # Get Boots primitive (material 8)
    target_mat_idx = 8
    pos = None
    uv = None
    
    for mesh_idx, mesh in enumerate(js.get('meshes', [])):
        for prim_idx, prim in enumerate(mesh.get('primitives', [])):
            if prim.get('material') == target_mat_idx:
                attributes = prim.get('attributes', {})
                pos = get_accessor_data(js, bin_data, attributes['POSITION'])
                uv = get_accessor_data(js, bin_data, attributes['TEXCOORD_0'])
                break
                
    if pos is None or uv is None:
        print("Boots primitive data not found")
        return
        
    # Get all vertices that are socks (Y > 22.0)
    y_coords = pos[:, 1]
    socks_mask = y_coords > 22.0
    socks_uvs = uv[socks_mask]
    
    print(f"Analyzing {len(socks_uvs)} socks vertices...")
    
    # Load all original textures from sources_backup/lara-croft-2026-rigged/textures/
    tex_dir = "sources_backup/lara-croft-2026-rigged/textures"
    images = {}
    for f in os.listdir(tex_dir):
        if f.endswith('.png'):
            img_path = os.path.join(tex_dir, f)
            images[f] = np.array(Image.open(img_path).convert('RGB'))
            
    # For each texture, find the average color of the pixels corresponding to socks UVs
    for name, img_arr in sorted(images.items()):
        h, w, _ = img_arr.shape
        colors = []
        for u, v in socks_uvs:
            px = min(w - 1, max(0, int(u * w)))
            py = min(h - 1, max(0, int((1.0 - v) * h)))
            colors.append(img_arr[py, px])
        colors = np.array(colors)
        avg_col = np.mean(colors, axis=0)
        print(f"Texture {name}: Avg Socks Color = RGB={avg_col.astype(int)}")

if __name__ == "__main__":
    main()
