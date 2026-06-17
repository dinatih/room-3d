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
    pos = None
    uv = None
    
    for mesh_idx, mesh in enumerate(js.get('meshes', [])):
        for prim_idx, prim in enumerate(mesh.get('primitives', [])):
            if prim.get('material') == target_mat_idx:
                attributes = prim.get('attributes', {})
                pos = get_accessor_data(js, bin_data, attributes['POSITION'])
                uv = get_accessor_data(js, bin_data, attributes['TEXCOORD_0'])
                break
                
    # Load original 8016.png
    orig_img = Image.open("sources_backup/lara-croft-2026-rigged/textures/8016.png").convert('RGB')
    orig_arr = np.array(orig_img)
    h, w, _ = orig_arr.shape
    
    # Let's find vertices that map to grey/white pixels in the original texture
    # Grey/white in 8016.png is where r > 100, g > 100, b > 100, and abs(r-g) < 8, abs(g-b) < 8
    r_chan = orig_arr[:, :, 0]
    g_chan = orig_arr[:, :, 1]
    b_chan = orig_arr[:, :, 2]
    
    socks_heights = []
    boots_heights = []
    
    for position, texcoord in zip(pos, uv):
        u, v = texcoord
        px = min(w - 1, max(0, int(u * w)))
        py = min(h - 1, max(0, int((1.0 - v) * h)))
        
        r, g, b = orig_arr[py, px]
        is_grey_white = (r > 100) and (g > 100) and (b > 100) and (abs(int(r) - int(g)) < 8) and (abs(int(g) - int(b)) < 8)
        
        # We also want to exclude the boot highlights/stitching at the bottom (Y < 12.0)
        # So we look at the vertical strip on the far right (Column 15, i.e., px >= 480)
        # and bottom-right-ish (px >= 416, py >= 416)
        is_socks_texture_region = (px >= 480) or (px >= 416 and py >= 416)
        
        if is_grey_white and is_socks_texture_region:
            socks_heights.append(position[1])
        else:
            boots_heights.append(position[1])
            
    socks_heights = np.array(socks_heights)
    boots_heights = np.array(boots_heights)
    
    print(f"Detected {len(socks_heights)} vertices mapping to socks texture regions.")
    if len(socks_heights) > 0:
        print(f"Socks Heights (Y): min={socks_heights.min():.2f}cm, max={socks_heights.max():.2f}cm, mean={socks_heights.mean():.2f}cm")
        # Print percentiles
        print(f"Socks percentiles [0, 10, 50, 90, 100]: {np.percentile(socks_heights, [0, 10, 50, 90, 100])}")
        
    print(f"Detected {len(boots_heights)} vertices mapping to boots texture regions.")
    if len(boots_heights) > 0:
        print(f"Boots Heights (Y): min={boots_heights.min():.2f}cm, max={boots_heights.max():.2f}cm, mean={boots_heights.mean():.2f}cm")

if __name__ == "__main__":
    main()
