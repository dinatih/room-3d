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
    
    target_mat_idx = 8 # 5_Boots_1.0_0_0
    for mesh_idx, mesh in enumerate(js.get('meshes', [])):
        for prim_idx, prim in enumerate(mesh.get('primitives', [])):
            if prim.get('material') == target_mat_idx:
                attributes = prim.get('attributes', {})
                pos_accessor_idx = attributes.get('POSITION')
                uv_accessor_idx = attributes.get('TEXCOORD_0')
                
                if pos_accessor_idx is not None and uv_accessor_idx is not None:
                    positions = get_accessor_data(js, bin_data, pos_accessor_idx)
                    uvs = get_accessor_data(js, bin_data, uv_accessor_idx)
                    
                    y_coords = positions[:, 1]
                    
                    # We will create a grid of 16x16 in UV space.
                    GRID_SIZE = 16
                    grid_heights = [[] for _ in range(GRID_SIZE * GRID_SIZE)]
                    
                    for pos, uv in zip(positions, uvs):
                        u, v = uv
                        # Clamping to [0, 0.999] to avoid index out of bounds
                        u = max(0.0, min(0.999, u))
                        v = max(0.0, min(0.999, v))
                        
                        col = int(u * GRID_SIZE)
                        # In GLTF, V=0 is bottom of image, V=1 is top of image.
                        # For Pillow/image coordinates, Y=0 is top, Y=GRID_SIZE-1 is bottom.
                        # So row = GRID_SIZE - 1 - int(v * GRID_SIZE)
                        row = GRID_SIZE - 1 - int(v * GRID_SIZE)
                        
                        idx = row * GRID_SIZE + col
                        grid_heights[idx].append(pos[1])
                        
                    # Let's print the grid representation
                    print("GRID OF VERTEX COUNTS:")
                    for r in range(GRID_SIZE):
                        row_strs = []
                        for c in range(GRID_SIZE):
                            idx = r * GRID_SIZE + c
                            cnt = len(grid_heights[idx])
                            if cnt == 0:
                                row_strs.append(" .  ")
                            else:
                                row_strs.append(f"{cnt:3d} ")
                        print("".join(row_strs))
                        
                    print("\nGRID OF AVERAGE HEIGHTS (cm):")
                    for r in range(GRID_SIZE):
                        row_strs = []
                        for c in range(GRID_SIZE):
                            idx = r * GRID_SIZE + c
                            heights = grid_heights[idx]
                            if len(heights) == 0:
                                row_strs.append(" .  ")
                            else:
                                avg_h = np.mean(heights)
                                row_strs.append(f"{int(avg_h):2d}  ")
                        print("".join(row_strs))
                        
                    # Let's print coordinates of cells with average height > 23 cm (socks)
                    # and count >= 5
                    print("\nSocks candidates (average height > 23cm, count >= 5):")
                    for r in range(GRID_SIZE):
                        for c in range(GRID_SIZE):
                            idx = r * GRID_SIZE + c
                            heights = grid_heights[idx]
                            if len(heights) >= 5:
                                avg_h = np.mean(heights)
                                if avg_h > 23.0:
                                    # Translate grid cell to pixel coords on 512x512
                                    x_start = int((c / GRID_SIZE) * 512)
                                    x_end = int(((c + 1) / GRID_SIZE) * 512)
                                    y_start = int((r / GRID_SIZE) * 512)
                                    y_end = int(((r + 1) / GRID_SIZE) * 512)
                                    print(f"Cell Row={r}, Col={c} | U=[{c/GRID_SIZE:.2f}, {(c+1)/GRID_SIZE:.2f}], V=[{1-(r+1)/GRID_SIZE:.2f}, {1-r/GRID_SIZE:.2f}] | Px X=[{x_start},{x_end}], Y=[{y_start},{y_end}] | Count={len(heights)}, Avg H={avg_h:.1f}cm")

if __name__ == "__main__":
    main()
