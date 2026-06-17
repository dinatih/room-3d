import json
import struct

GLB_PATH = "public/media/sandbox/lara_native.glb"

def main():
    with open(GLB_PATH, 'rb') as f:
        data = f.read()
    json_len = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+json_len])
    
    for i, tex in enumerate(js.get('textures', [])):
        if tex.get('source') == 7:
            print(f"Texture {i}: source={tex.get('source')}, extensions={tex.get('extensions')}")

if __name__ == "__main__":
    main()
