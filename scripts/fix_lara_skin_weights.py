"""Repair Lara's assembled nude body skin weights without changing UVs or bones.

ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/fix_lara_skin_weights.py
npm run optimize:glb
"""
from pathlib import Path
import importlib.util
import sys
sys.dont_write_bytecode = True
import bpy

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'public/characters/lara'
MARKER = 'lara_anatomical_skin_weights_v2'
TARGETS = ('body_nude_torso','body_nude_legs','body_nude_panties')
CHAIN = ('pelvis','spine_lower','spine_upper')


def smoothstep(value):
    value = max(0.,min(1.,value))
    return value*value*(3.-2.*value)


def main():
    args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    source = Path(args[1]) if args and args[0]=='--reference' else FOLDER/'lara_perfect.blend'
    bpy.ops.wm.open_mainfile(filepath=str(source))
    if not bpy.context.scene.get(MARKER):
        arm = next(obj for obj in bpy.data.objects if obj.type=='ARMATURE')
        bones = arm.data.bones
        pelvis_z = bones['pelvis'].head_local.z
        lower_z = bones['spine_lower'].head_local.z
        upper_z = bones['spine_upper'].head_local.z
        thigh_z = bones['leg_left_thigh'].head_local.z
        # Reflect the pelvis/thigh spacing below the hip pivot to locate the
        # gluteal transition; dimensions come from this model's anatomy.
        crease_z = thigh_z-(pelvis_z-thigh_z)
        rear_y = max(v.co.y for v in bpy.data.objects['body_nude_legs'].data.vertices
                     if crease_z<=v.co.z<=pelvis_z)
        for name in TARGETS:
            obj = bpy.data.objects[name]
            names = {group.index:group.name for group in obj.vertex_groups}
            for bone in CHAIN:
                if bone not in obj.vertex_groups:
                    obj.vertex_groups.new(name=bone)
            changed = 0
            for vertex in obj.data.vertices:
                weights = {names[g.group]:g.weight for g in vertex.groups if g.weight>0}
                original = dict(weights)
                chain_weight = sum(weights.get(bone,0.) for bone in CHAIN)
                if chain_weight and vertex.co.z>lower_z:
                    # Preserve the existing waist attachment. Fade its pelvis
                    # influence out while introducing the upper spine gradually,
                    # instead of changing the lower seam's deformation pivot.
                    blend = smoothstep((vertex.co.z-lower_z)/(upper_z-lower_z))
                    pelvis_weight = weights.get('pelvis',0.)*(1.-blend)
                    weights['pelvis'] = pelvis_weight
                    weights['spine_lower'] = chain_weight*(1.-blend)-pelvis_weight
                    weights['spine_upper'] = chain_weight*blend
                for side in ('left','right'):
                    thigh = 'leg_'+side+'_thigh'
                    if thigh not in weights:
                        continue
                    posterior = smoothstep((vertex.co.y-bones[thigh].head_local.y)/
                                           (rear_y-bones[thigh].head_local.y))
                    height = smoothstep((vertex.co.z-crease_z)/(thigh_z-crease_z))
                    transfer = weights[thigh]*posterior*height
                    weights[thigh] -= transfer
                    weights['pelvis'] = weights.get('pelvis',0.)+transfer
                total = sum(weights.values())
                assert total>0, f'Unbound vertex: {name}:{vertex.index}'
                if weights==original:
                    continue
                for group in obj.vertex_groups:
                    group.remove([vertex.index])
                for bone,weight in weights.items():
                    if weight>0:
                        obj.vertex_groups[bone].add([vertex.index],weight/total,'REPLACE')
                changed += 1
            print('Reweighted',name,changed,'vertices',flush=True)
        bpy.context.scene[MARKER] = True
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
    spec = importlib.util.spec_from_file_location('limbs',ROOT/'scripts/separate_lara_limb_uvs.py')
    limbs = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(limbs)
    limbs.export()


if __name__=='__main__':
    main()
