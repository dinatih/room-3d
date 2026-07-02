import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/home/dinatih/Projects/room-3d/public/media/all_lara/07_scoop_bodysuit_shorts.glb")

mesh_obj = None
armature = None

for obj in bpy.data.objects:
    if obj.type == 'MESH':
        print(f"Mesh: {obj.name}, groups: {[vg.name for vg in obj.vertex_groups if 'breast' in vg.name.lower()]}")
        if len(obj.vertex_groups) > 5:
            mesh_obj = obj
    elif obj.type == 'ARMATURE':
        armature = obj

# Let's inspect the pose bone positions
for bone_name in ["breast_left_base", "breast_right_base"]:
    pose_bone = armature.pose.bones.get(bone_name)
    if pose_bone:
        head_world = armature.matrix_world @ pose_bone.head
        tail_world = armature.matrix_world @ pose_bone.tail
        print(f"Bone '{bone_name}': head Z={head_world.z:.4f}, tail Z={tail_world.z:.4f}")

# Let's inspect the weights in the vertex groups
for vg in mesh_obj.vertex_groups:
    if vg.name in ["breast_left_base", "breast_right_base"]:
        z_coords = []
        y_coords = [] # Y is forward in gltf / blender default import
        x_coords = []
        weights = []
        for v in mesh_obj.data.vertices:
            for g in v.groups:
                if g.group == vg.index and g.weight > 0.0:
                    # v.co is local coordinate, let's get world position
                    w_pos = mesh_obj.matrix_world @ v.co
                    z_coords.append(w_pos.z)
                    y_coords.append(w_pos.y)
                    x_coords.append(w_pos.x)
                    weights.append(g.weight)
        if weights:
            print(f"Group '{vg.name}': {len(weights)} vertices with weight > 0")
            print(f"  Z coordinates: min={min(z_coords):.4f}, max={max(z_coords):.4f}, avg={sum(z_coords)/len(z_coords):.4f}")
            print(f"  Y coordinates (forward): min={min(y_coords):.4f}, max={max(y_coords):.4f}, avg={sum(y_coords)/len(y_coords):.4f}")
            print(f"  X coordinates: min={min(x_coords):.4f}, max={max(x_coords):.4f}")
