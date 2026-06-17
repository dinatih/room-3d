import json
import struct

def main():
    glb_path = "public/media/sandbox/lara_native.glb"
    with open(glb_path, 'rb') as f:
        data = f.read()
    json_len = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+json_len])
    
    print("Liste de tous les matériaux du GLB :")
    for i, mat in enumerate(js.get('materials', [])):
        print(f"- {i}: {mat.get('name')}")

if __name__ == "__main__":
    main()
