import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
path = "/home/dinatih/Projects/room-3d/sources_backup/animations/Walking.fbx"
if os.path.exists(path):
    bpy.ops.import_scene.fbx(filepath=path)
    if bpy.data.actions:
        action = bpy.data.actions[0]
        print(f"Action: {action.name}")
        print(f"  is_action_legacy: {action.is_action_legacy}")
        print(f"  is_action_layered: {action.is_action_layered}")
        
        # If layered action:
        if action.is_action_layered:
            print(f"  Layers count: {len(action.layers)}")
            for idx, layer in enumerate(action.layers):
                print(f"    Layer {idx}: {layer.name} | channels: {len(layer.channels) if hasattr(layer, 'channels') else 'None'}")
                print(f"    Layer attributes: {dir(layer)}")
        
        # If legacy or to access curves:
        # In Blender 5.1, we can use slot/channel API or conversion:
        # Let's print first slot or other properties
        if hasattr(action, 'slots'):
            print(f"  Slots count: {len(action.slots)}")
            for idx, slot in enumerate(action.slots):
                print(f"    Slot {idx}: {slot.name}")
