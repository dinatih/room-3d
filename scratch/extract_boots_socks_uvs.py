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
    
    # componentType 5126 is FLOAT
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
        if component_type == 5123: # normalized unsigned short
            unpacked = [x / 65535.0 for x in unpacked]
        elif component_type == 5121: # normalized unsigned byte
            unpacked = [x / 255.0 for x in unpacked]
        res.append(unpacked)
        
    return np.array(res)

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
    bin_len, bin_type = struct.unpack('<II', data[bin_offset:bin_offset+8])
    bin_data = data[bin_offset+8 : bin_offset+8+bin_len]
    
    # Traverse meshes
    target_mat_idx = 8 # 5_Boots_1.0_0_0
    for mesh_idx, mesh in enumerate(js.get('meshes', [])):
        for prim_idx, prim in enumerate(mesh.get('primitives', [])):
            if prim.get('material') == target_mat_idx:
                print(f"Mesh {mesh_idx} ({mesh.get('name')}), Primitive {prim_idx} uses Boots Material")
                
                attributes = prim.get('attributes', {})
                pos_accessor_idx = attributes.get('POSITION')
                uv_accessor_idx = attributes.get('TEXCOORD_0')
                
                if pos_accessor_idx is not None and uv_accessor_idx is not None:
                    positions = get_accessor_data(js, bin_data, pos_accessor_idx)
                    uvs = get_accessor_data(js, bin_data, uv_accessor_idx)
                    
                    # Print stats
                    print(f"Loaded {len(positions)} vertices.")
                    print(f"Local 3D position range:")
                    print(f"  X: [{positions[:,0].min():.2f}, {positions[:,0].max():.2f}]")
                    print(f"  Y (height): [{positions[:,1].min():.2f}, {positions[:,1].max():.2f}]")
                    print(f"  Z: [{positions[:,2].min():.2f}, {positions[:,2].max():.2f}]")
                    
                    # Sort vertices by local Y coordinate (height) and segment them
                    # Let's see the height distribution of vertices
                    y_coords = positions[:, 1]
                    percentiles = np.percentile(y_coords, [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])
                    print("Y Coordinate Percentiles:", [f"{p:.2f}" for p in percentiles])
                    
                    # Let's print UV ranges for different height intervals
                    # Typically, boots are at the bottom, socks are at the top of this primitive.
                    # Let's divide in 4 height bands:
                    # Band 1 (Boots bottom): min_y to min_y + 0.4 * height_range
                    # Band 2 (Boots top / Socks bottom): ...
                    # Band 3 (Socks top): ...
                    y_min, y_max = y_coords.min(), y_coords.max()
                    y_range = y_max - y_min
                    
                    # We can also plot/cluster or save them to check.
                    # Let's print the actual UV coordinates of vertices whose local Y is in the top 25% (likely socks)
                    # and the bottom 50% (likely boots)
                    socks_mask = y_coords > (y_min + 0.7 * y_range)
                    boots_mask = y_coords < (y_min + 0.5 * y_range)
                    
                    print(f"\nSocks Candidate Vertices (Y > {y_min + 0.7*y_range:.2f}): {np.sum(socks_mask)}")
                    if np.sum(socks_mask) > 0:
                        socks_uvs = uvs[socks_mask]
                        su_min, su_max = socks_uvs[:, 0].min(), socks_uvs[:, 0].max()
                        sv_min, sv_max = socks_uvs[:, 1].min(), socks_uvs[:, 1].max()
                        print(f"Socks UV Bounds: U=[{su_min:.4f}, {su_max:.4f}], V=[{sv_min:.4f}, {sv_max:.4f}]")
                        print(f"Socks Pixel bounds (512x512): X=[{int(su_min*512)}, {int(su_max*512)}], Y=[{int((1.0-sv_max)*512)}, {int((1.0-sv_min)*512)}]")
                        
                    print(f"\nBoots Candidate Vertices (Y < {y_min + 0.5*y_range:.2f}): {np.sum(boots_mask)}")
                    if np.sum(boots_mask) > 0:
                        boots_uvs = uvs[boots_mask]
                        bu_min, bu_max = boots_uvs[:, 0].min(), boots_uvs[:, 0].max()
                        bv_min, bv_max = boots_uvs[:, 1].min(), boots_uvs[:, 1].max()
                        print(f"Boots UV Bounds: U=[{bu_min:.4f}, {bu_max:.4f}], V=[{bv_min:.4f}, {bv_max:.4f}]")
                        print(f"Boots Pixel bounds (512x512): X=[{int(bu_min*512)}, {int(bu_max*512)}], Y=[{int((1.0-bv_max)*512)}, {int((1.0-bv_min)*512)}]")

if __name__ == "__main__":
    main()
