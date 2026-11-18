"""Compare real abdominal skin weights; no rig or model is modified.
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/analyze-dog-skinning.py
"""
from pathlib import Path
import bpy, json, os
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/dog-comparison';OUT.mkdir(parents=True,exist_ok=True)
report={}
for dog,path in [('pitbull',ROOT/'public/characters/animated-pitbull-dog/dog.glb'),('ushiro',ROOT/'public/characters/ushiro/ushiro.glb'),('ulotte-hd',ROOT/'public/characters/dachshund-sculpt/dog.glb')]:
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(path))
    rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
    body=max((o for o in bpy.data.objects if o.type=='MESH' and o.vertex_groups),key=lambda o:len(o.data.vertices))
    hips=rig.matrix_world@rig.data.bones['Hips'].head_local
    chest=rig.matrix_world@rig.data.bones['Spine4'].head_local
    axis=chest-hips
    floor=min((body.matrix_world@v.co).z for v in body.data.vertices)
    back_height=min(hips.z,chest.z)-floor
    # Central half of the pelvis-to-chest span, below 80% of the back height
    # and above 25%. This anatomical ROI excludes paws, head and back surface.
    selected=[];totals={};leg_weights=[]
    leg_prefixes=tuple(side+part for side in ['Left','Right'] for part in ['Arm','ForeArm','Hand','UpLeg','Leg','Foot','Toe'])
    for vertex in body.data.vertices:
        point=body.matrix_world@vertex.co
        along=(point-hips).dot(axis)/axis.length_squared
        vertical=(point.z-floor)/back_height
        if not (.25<=along<=.75 and .25<=vertical<=.8):continue
        selected.append(vertex.index);leg=0
        for group in vertex.groups:
            name=body.vertex_groups[group.group].name
            totals[name]=totals.get(name,0)+group.weight
            if name.startswith(leg_prefixes):leg+=group.weight
        leg_weights.append(leg)
    if not selected:raise RuntimeError('Empty abdominal ROI: '+dog)
    lateral={b.name:list(rig.matrix_world@b.head_local) for b in rig.data.bones if 'breathe' in b.name.lower()}
    report[dog]={
        'input':str(path),'coordinateSystem':'Blender Z-up, unscaled GLB model coordinates','bones':len(rig.data.bones),'abdominalVertices':len(selected),
        'meanLegWeight':sum(leg_weights)/len(leg_weights),'maxLegWeight':max(leg_weights),
        'majorityLegVertices':sum(w>.5 for w in leg_weights),
        'meanWeights':dict(sorted(((n,w/len(selected)) for n,w in totals.items()),key=lambda item:-item[1])),
        'lateralControlBones':lateral,
    }
(OUT/'skinning-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2),flush=True);os._exit(0)
