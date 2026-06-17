import bpy
bpy.ops.import_scene.fbx(filepath="/home/dinatih/Projects/room-3d/sources_backup/animations/Walking.fbx")
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
action = arm.animation_data.action
print(f"ACTION: {action.name}")
print(f"LAYERS: {len(action.layers)}")
if len(action.layers) > 0:
    layer = action.layers[0]
    print(f"LAYER 0 DIR: {dir(layer)}")
    if hasattr(layer, 'channels'):
        print(f"  CHANNELS: {len(layer.channels)}")
        if len(layer.channels) > 0:
             chan = layer.channels[0]
             print(f"  CHANNEL 0 DIR: {dir(chan)}")
