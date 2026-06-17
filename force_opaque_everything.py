import json
import struct
import os

GLB_PATH = "public/media/glb/lara_perfect_v2.glb"

def main():
    if not os.path.exists(GLB_PATH):
        print("File not found")
        return

    with open(GLB_PATH, 'rb') as f:
        data = f.read()
    
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    bin_chunk = data[20+jlen:]
    
    for mat in js.get('materials', []):
        if 'Lashes' in mat.get('name', ''):
            mat['alphaMode'] = 'MASK'
            mat['alphaCutoff'] = 0.5
        else:
            mat['alphaMode'] = 'OPAQUE'

    js_bytes = json.dumps(js, separators=(',', ':')).encode('utf-8')
    while len(js_bytes) % 4: js_bytes += b' '
    
    total_len = 12 + 8 + len(js_bytes) + len(bin_chunk)
    with open(GLB_PATH, 'wb') as f:
        f.write(b'glTF')
        f.write(struct.pack('<I', 2))
        f.write(struct.pack('<I', total_len))
        f.write(struct.pack('<I', len(js_bytes)))
        f.write(b'JSON')
        f.write(js_bytes)
        f.write(bin_chunk)
    print("Saved OPAQUE version to lara_perfect_v2.glb")

if __name__ == "__main__":
    main()
