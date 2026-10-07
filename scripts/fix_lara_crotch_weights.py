"""Anchor the crotch to the pelvis and remove asymmetric inner-thigh pulls."""
from pathlib import Path
import importlib.util
import sys
sys.dont_write_bytecode = True
import bpy

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'public/characters/lara'
MARKER = 'lara_crotch_clothed_weights_v2'
PREVIOUS_MARKER = 'lara_crotch_skin_weights_v1'


def smoothstep(value):
    value = max(0.,min(1.,value))
    return value*value*(3.-2.*value)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
    if not bpy.context.scene.get(MARKER):
        bones = next(o for o in bpy.data.objects if o.type=='ARMATURE').data.bones
        left,right = (bones['leg_'+side+'_thigh'].head_local for side in ('left','right'))
        center = (left.x+right.x)/2
        radius = (left.x-right.x)/2
        hip_z = (left.z+right.z)/2
        crease_z = hip_z-(bones['pelvis'].head_local.z-hip_z)
        crotch_z = bones['pelvis'].tail_local.z
        targets = ('body_legs',) if bpy.context.scene.get(PREVIOUS_MARKER) else ('body_nude_legs','body_nude_panties','shorts','body_legs')
        for name in targets:
            obj = bpy.data.objects[name]
            group_names = {g.index:g.name for g in obj.vertex_groups}
            changed = 0
            for vertex in obj.data.vertices:
                central = 1.-smoothstep(abs(vertex.co.x-center)/radius)
                height = smoothstep((vertex.co.z-crease_z)/(crotch_z-crease_z))
                blend = central*height
                if blend==0:
                    continue
                weights = {group_names[g.group]:g.weight for g in vertex.groups if g.weight>0}
                thigh_names = ('leg_left_thigh','leg_right_thigh')
                total_thigh = sum(weights.get(n,0.) for n in thigh_names)
                if total_thigh==0:
                    continue
                transferred = total_thigh*blend
                retained = total_thigh-transferred
                fraction = smoothstep((vertex.co.x-right.x)/(left.x-right.x))
                old_fraction = weights.get(thigh_names[0],0.)/total_thigh
                fraction = old_fraction*(1.-blend)+fraction*blend
                weights[thigh_names[0]] = retained*fraction
                weights[thigh_names[1]] = retained*(1.-fraction)
                weights['pelvis'] = weights.get('pelvis',0.)+transferred
                for side in ('left','right'):
                    knee = 'leg_'+side+'_knee'
                    extra = weights.get(knee,0.)*blend
                    if extra:
                        weights[knee] -= extra
                        weights['pelvis'] += extra
                total = sum(weights.values())
                assert total>0
                for group in obj.vertex_groups:
                    group.remove([vertex.index])
                for bone,weight in weights.items():
                    if weight>0:
                        if bone not in obj.vertex_groups:
                            obj.vertex_groups.new(name=bone)
                        obj.vertex_groups[bone].add([vertex.index],weight/total,'REPLACE')
                changed += 1
            print('Corrected crotch weights',name,changed,'vertices',flush=True)
        bpy.context.scene[PREVIOUS_MARKER] = True
        bpy.context.scene[MARKER] = True
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
    spec = importlib.util.spec_from_file_location('limbs',ROOT/'scripts/separate_lara_limb_uvs.py')
    limbs = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(limbs)
    limbs.export()


if __name__=='__main__':
    main()
