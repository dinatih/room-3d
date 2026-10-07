import json, struct
from pathlib import Path
b=Path('public/characters/jikin-goldfish/jikin-goldfish.glb').read_bytes()
n=struct.unpack_from('<I',b,12)[0]; d=json.loads(b[20:20+n]); data=b[28+n:]
def values(i):
 a=d['accessors'][i]; v=d['bufferViews'][a['bufferView']]; count={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']]; off=v.get('byteOffset',0)+a.get('byteOffset',0); return [struct.unpack_from('<'+'f'*count,data,off+j*count*4) for j in range(a['count'])]
print('CLIPS', [(a['name'],len(a['channels'])) for a in d['animations']]); print('ROOTS',[(d['nodes'][i].get('name'),d['nodes'][i].get('rotation')) for i in d['scenes'][0]['nodes']])
for a in d['animations']:
 for c in a['channels']:
  name=d['nodes'][c['target']['node']].get('name','')
  if name in ['B_MCH_Root','B_DEF_Head','B_DEF_Jaw','RIG_Jikin']:
   s=a['samplers'][c['sampler']]; ts=values(s['input']); vs=values(s['output']); print(name,c['target']['path'], 'range',ts[0],ts[-1]); print([(round(ts[i][0],2),tuple(round(x,3) for x in vs[i])) for i in range(0,len(ts),12)])
import math
for c in d['animations'][0]['channels']:
 name=d['nodes'][c['target']['node']].get('name','')
 if name not in ['B_DEF_Head','B_DEF_Jaw','B_DEF_Spine3','B_DEF_Spine5','B_DEF_MouthT'] or c['target']['path']!='rotation': continue
 s=d['animations'][0]['samplers'][c['sampler']]; ts=values(s['input']); vs=values(s['output'])
 print('SEGMENTS', name)
 for start in [2,52,102,152,202]:
  samples=[v for t,v in zip(ts,vs) if start/24-1e-5<=t[0]<=(start+49)/24+1e-5]
  if not samples: continue
  print(start,start+49,[(round(min(v[i] for v in samples),3),round(max(v[i] for v in samples),3)) for i in range(3)])
print('SIZE_BYTES',len(b))
