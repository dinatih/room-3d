import json
import struct
import numpy as np

SRC = '/tmp/lara_source/lara_norm.glb'
DST = '/tmp/lara_source/lara_no_interior.glb'
TARGET_NODE = '5_+Head|Glasses_1.0_0_0'

INTERIOR_BONES_FACE = {
    'head tongue', 'head_tongue',
    'head nostril right', 'head_nostril_right',
    'head nostril left', 'head_nostril_left',
    'head lip upper left 2', 'head_lip_upper_left_2',
    'head lip upper right 2', 'head_lip_upper_right_2',
    'head lip upper middle', 'head_lip_upper_middle',
    'head lip lower left 2', 'head_lip_lower_left_2',
    'head lip lower right 2', 'head_lip_lower_right_2',
    'head lip lower middle', 'head_lip_lower_middle',
}

INTERIOR_BONES_EYES = {
    'head jaw', 'head tongue', 'head_tongue'
}

WEIGHT_THRESH = 0.05
MIN_INTERIOR_VERTS = 1 # Be more aggressive

COMPONENT_TYPE_BYTES  = {5120:1, 5121:1, 5122:2, 5123:2, 5125:4, 5126:4}
COMPONENT_TYPE_STRUCT = {5120:'b', 5121:'B', 5122:'h', 5123:'H', 5125:'I', 5126:'f'}
TYPE_COUNT = {'SCALAR':1, 'VEC2':2, 'VEC3':3, 'VEC4':4, 'MAT4':16}

def load_glb(path):
    with open(path, 'rb') as f:
        data = f.read()
    json_len = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+json_len])
    bin_offset = 20 + json_len
    while bin_offset < len(data):
        chunk_len  = struct.unpack('<I', data[bin_offset:bin_offset+4])[0]
        chunk_type = data[bin_offset+4:bin_offset+8]
        if chunk_type == b'BIN\x00':
            return js, bytearray(data[bin_offset+8:bin_offset+8+chunk_len])
        bin_offset += 8 + chunk_len
    raise RuntimeError('No BIN chunk')

def save_glb(path, js, bin_data):
    js_bytes = json.dumps(js, separators=(',',':')).encode('utf-8')
    while len(js_bytes) % 4: js_bytes += b' '
    while len(bin_data) % 4: bin_data.append(0)
    total = 12 + 8 + len(js_bytes) + 8 + len(bin_data)
    with open(path, 'wb') as f:
        f.write(b'glTF')
        f.write(struct.pack('<I', 2))
        f.write(struct.pack('<I', total))
        f.write(struct.pack('<I', len(js_bytes)))
        f.write(b'JSON')
        f.write(js_bytes)
        f.write(struct.pack('<I', len(bin_data)))
        f.write(b'BIN\x00')
        f.write(bin_data)

def read_accessor(js, bin_data, acc_idx):
    a  = js['accessors'][acc_idx]
    bv = js['bufferViews'][a['bufferView']]
    offset = (bv.get('byteOffset',0) or 0) + (a.get('byteOffset',0) or 0)
    ct = a['componentType']
    tc = TYPE_COUNT[a['type']]
    count = a['count']
    fmt = COMPONENT_TYPE_STRUCT[ct]
    bytes_per_elem = COMPONENT_TYPE_BYTES[ct]
    stride = bv.get('byteStride', bytes_per_elem * tc)
    flat = []
    for i in range(count):
        chunk = bytes(bin_data[offset+i*stride:offset+i*stride+bytes_per_elem*tc])
        flat.extend(struct.unpack('<' + fmt*tc, chunk))
    return np.array(flat).reshape(count, tc)

def write_back_accessor(js, bin_data, acc_idx, new_array):
    a  = js['accessors'][acc_idx]
    bv = js['bufferViews'][a['bufferView']]
    offset = (bv.get('byteOffset',0) or 0) + (a.get('byteOffset',0) or 0)
    ct = a['componentType']
    tc = TYPE_COUNT[a['type']]
    flat = new_array.reshape(-1).tolist()
    fmt = COMPONENT_TYPE_STRUCT[ct] * len(flat)
    packed = struct.pack('<' + fmt, *flat)
    bin_data[offset:offset+len(packed)] = packed

def main():
    js, bin_data = load_glb(SRC)
    mesh_idx = next(n['mesh'] for n in js['nodes'] if n.get('name') == TARGET_NODE)
    skin_idx = next(n['skin'] for n in js['nodes'] if n.get('mesh') == mesh_idx)
    skin = js['skins'][skin_idx]
    bone_names = [js['nodes'][j].get('name', '') for j in skin['joints']]
    
    int_face = {i for i, n in enumerate(bone_names) if n in INTERIOR_BONES_FACE}
    int_eyes = {i for i, n in enumerate(bone_names) if n in INTERIOR_BONES_EYES}

    mesh = js['meshes'][mesh_idx]
    for prim_idx, prim in enumerate(mesh['primitives']):
        if 'JOINTS_0' not in prim['attributes'] or 'indices' not in prim: continue
        
        # Aggressive Alpha Mode Fix for Face and Eyes
        if prim_idx in {11, 12}:
            mat_idx = prim.get('material')
            if mat_idx is not None:
                mat = js['materials'][mat_idx]
                print(f"Forcing OPAQUE for material: {mat.get('name')}")
                mat['alphaMode'] = 'OPAQUE'
                if 'alphaCutoff' in mat: del mat['alphaCutoff']

        idx_acc = prim['indices']
        joints = read_accessor(js, bin_data, prim['attributes']['JOINTS_0']).astype(int)
        weights = read_accessor(js, bin_data, prim['attributes']['WEIGHTS_0'])
        indices = read_accessor(js, bin_data, idx_acc).reshape(-1).astype(int)
        
        n_vert = joints.shape[0]
        n_tri = len(indices) // 3
        
        if prim_idx == 11: int_set = int_eyes
        elif prim_idx == 12: int_set = int_face
        else: continue

        v_int = np.zeros(n_vert, dtype=bool)
        for i in range(n_vert):
            w_sum = 0
            for k in range(4):
                if joints[i,k] in int_set:
                    w_sum += weights[i,k]
            if w_sum > WEIGHT_THRESH:
                v_int[i] = True
        
        tri = indices.reshape(-1, 3)
        drop = np.any(v_int[tri], axis=1)
        keep = ~drop
        n_keep = int(keep.sum())
        
        if n_keep < n_tri:
            print(f"Prim {prim_idx}: dropping {n_tri - n_keep} triangles")
            new_idx = np.zeros(len(indices), dtype=indices.dtype)
            new_idx[:n_keep*3] = tri[keep].reshape(-1)
            write_back_accessor(js, bin_data, idx_acc, new_idx)
            js['accessors'][idx_acc]['count'] = n_keep * 3

    save_glb(DST, js, bin_data)

if __name__ == '__main__':
    main()
