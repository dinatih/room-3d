import bpy
import os

SOURCE_FBX = "/tmp/lara_source/fbx_extracted/C1S1UIP9N1UQPLO2U787FMDUD.fbx"

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=SOURCE_FBX)
    m = max([o for o in bpy.data.objects if o.type == 'MESH'], key=lambda o: len(o.data.vertices))
    print(f"MESH: {m.name}")
    print(f"Slots: {len(m.material_slots)}")
    for i, s in enumerate(m.material_slots):
        print(f"  Slot {i}: {s.name}")

if __name__ == "__main__":
    main()
