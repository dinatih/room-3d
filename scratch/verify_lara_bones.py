import json
import struct

with open('public/media/sandbox/lara_native.glb', 'rb') as f:
    data = f.read()
jlen = struct.unpack('<I', data[12:16])[0]
js = json.loads(data[20:20+jlen])

nodes = js.get('nodes', [])
skins = js.get('skins', [])
joints = skins[0].get('joints', [])

for idx in joints:
    node = nodes[idx]
    name = node.get('name')
    if name == 'mixamorig':
        print(f"Index {idx} is named 'mixamorig'. Children: {node.get('children')}")
    elif name.startswith('mixamorig_arm_right_finger_2'):
        print(f"Index {idx}: name='{name}', children={node.get('children')}")
