import json
import struct

def get_hierarchy(path):
    with open(path, 'rb') as f:
        data = f.read()
    jlen = struct.unpack('<I', data[12:16])[0]
    js = json.loads(data[20:20+jlen])
    
    nodes = js.get('nodes', [])
    skins = js.get('skins', [])
    if not skins:
        print(f"No skins found in {path}")
        return []
    
    joints = skins[0].get('joints', [])
    joint_set = set(joints)
    
    # Let's find nodes that have children
    child_to_parent = {}
    for idx, node in enumerate(nodes):
        for child_idx in node.get('children', []):
            child_to_parent[child_idx] = idx
            
    # Find root joints (joints that have no parent in the joint set)
    roots = []
    for idx in joints:
        parent_idx = child_to_parent.get(idx)
        if parent_idx is None or parent_idx not in joint_set:
            roots.append(idx)
            
    ordered_joints = []
    def traverse(idx, depth=0):
        name = nodes[idx].get('name')
        ordered_joints.append((idx, name, depth))
        for child_idx in nodes[idx].get('children', []):
            if child_idx in joint_set:
                traverse(child_idx, depth + 1)
                
    for r in roots:
        traverse(r)
        
    return ordered_joints

xbot = get_hierarchy('public/media/sandbox/Xbot_official.glb')
lara = get_hierarchy('public/media/sandbox/lara_native.glb')

print("\n--- XBOT HIERARCHY ---")
for idx, name, depth in xbot:
    print(f"{'  ' * depth}{name}")

print("\n--- LARA HIERARCHY ---")
for idx, name, depth in lara:
    print(f"{'  ' * depth}{name}")
