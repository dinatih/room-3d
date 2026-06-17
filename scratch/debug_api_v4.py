import bpy
bpy.ops.import_scene.fbx(filepath="/home/dinatih/Projects/room-3d/sources_backup/animations/Walking.fbx")
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
action = arm.animation_data.action
print(f"ACTION: {action.name}")
# Traverse EVERYTHING
def dump(obj, depth=0):
    if depth > 3: return
    prefix = "  " * depth
    for attr in dir(obj):
        if attr.startswith("_"): continue
        try:
            val = getattr(obj, attr)
            print(f"{prefix}{attr}: {type(val)}")
            if "fcurve" in attr.lower() or "curve" in attr.lower():
                print(f"{prefix}!!! FOUND CURVE ATTR: {attr}")
        except: pass

dump(action)
