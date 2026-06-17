import json
import struct

GLB_PATH = "public/media/sandbox/lara_native.glb"

def main():
    with open(GLB_PATH, 'rb') as f:
        data = f.read()
    json_len = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+json_len])
    
    for i, mat in enumerate(js.get('materials', [])):
        if 'Eye' in mat.get('name', ''):
            print(f"Material {i} ({mat.get('name')}):")
            print(json.dumps(mat, indent=2))

if __name__ == "__main__":
    main()
