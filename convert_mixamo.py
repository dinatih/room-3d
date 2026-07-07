import bpy

bpy.ops.wm.open_mainfile(filepath="sources_backup/lara_croft_perfect_rigify_final.blend")

# 1. Append Armature from base
filepath = "sources_backup/lara_croft_perfect_rigify_base_on_maximo.blend"
inner_path = "Object"
object_name = "Armature"

try:
    bpy.ops.wm.append(
        filepath=f"{filepath}/{inner_path}/{object_name}",
        directory=f"{filepath}/{inner_path}/",
        filename=object_name
    )
except Exception as e:
    print(f"Error appending: {e}")

armature = bpy.data.objects.get("Armature")
if not armature:
    print("ARMATURE NOT FOUND")
    import sys
    sys.exit(1)
    
lara = bpy.data.objects.get("Lara")

# 2. Mapping
mapping = {
    'Hips': 'pelvis', 
    'Spine': 'spine',
    'Spine1': 'spine.001',
    'Spine2': 'spine.002',
    'Neck': 'spine.004',
    'Head': 'spine.005',
    'LeftShoulder': 'shoulder.L',
    'LeftArm': 'upper_arm.L',
    'LeftForeArm': 'forearm.L',
    'LeftHand': 'hand.L',
    'RightShoulder': 'shoulder.R',
    'RightArm': 'upper_arm.R',
    'RightForeArm': 'forearm.R',
    'RightHand': 'hand.R',
    'LeftUpLeg': 'thigh.L',
    'LeftLeg': 'shin.L',
    'LeftFoot': 'foot.L',
    'LeftToeBase': 'toe.L',
    'RightUpLeg': 'thigh.R',
    'RightLeg': 'shin.R',
    'RightFoot': 'foot.R',
    'RightToeBase': 'toe.R'
}
reverse_mapping = {}
for mixamo, rigify in mapping.items():
    reverse_mapping[f"DEF-{rigify}"] = f"mixamorig:{mixamo}"
    
fingers = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']
for side, lr in [('Left', '.L'), ('Right', '.R')]:
    for f in fingers:
        reverse_mapping[f"DEF-f_{f.lower()}.01{lr}"] = f"mixamorig:{side}Hand{f}1"
        reverse_mapping[f"DEF-f_{f.lower()}.02{lr}"] = f"mixamorig:{side}Hand{f}2"
        reverse_mapping[f"DEF-f_{f.lower()}.03{lr}"] = f"mixamorig:{side}Hand{f}3"

for vg in lara.vertex_groups:
    if vg.name in reverse_mapping:
        vg.name = reverse_mapping[vg.name]

hips_vg = lara.vertex_groups.get("mixamorig:Hips")
if not hips_vg:
    hips_vg = lara.vertex_groups.new(name="mixamorig:Hips")

for p in ["DEF-pelvis.L", "DEF-pelvis.R"]:
    p_vg = lara.vertex_groups.get(p)
    if p_vg:
        p_vg.name = p + "_old"

print("Groups renamed to Mixamo!")

for mod in lara.modifiers:
    if mod.type == 'ARMATURE':
        lara.modifiers.remove(mod)

bpy.ops.object.select_all(action='DESELECT')
lara.select_set(True)
armature.select_set(True)
bpy.context.view_layer.objects.active = armature
bpy.ops.object.parent_set(type='ARMATURE')

for obj in bpy.data.objects:
    if obj.parent == bpy.data.objects.get("rig"):
        obj.parent = armature
        if obj.parent_type == 'BONE':
            bone_name = obj.parent_bone
            if bone_name == "head":
                obj.parent_bone = "mixamorig:Head"
            elif bone_name == "spine.005":
                obj.parent_bone = "mixamorig:Spine2"
            elif "hand.R" in bone_name:
                obj.parent_bone = "mixamorig:RightHand"
            elif "hand.L" in bone_name:
                obj.parent_bone = "mixamorig:LeftHand"
            elif "spine" in bone_name:
                obj.parent_bone = "mixamorig:Spine"
            elif "pelvis" in bone_name:
                obj.parent_bone = "mixamorig:Hips"

rig = bpy.data.objects.get("rig")
if rig:
    bpy.data.objects.remove(rig)

bpy.ops.export_scene.gltf(
    filepath="public/models/lara_perfect.glb",
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
    export_yup=True,
    export_animations=True
)
print("Export complete!")

bpy.ops.wm.save_as_mainfile(filepath="sources_backup/lara_croft_mixamo_perfect.blend")
