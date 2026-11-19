"""Verify that a partial export preserves all unmodified animation tracks."""
from pathlib import Path
import json,struct,numpy as np
ROOT=Path(__file__).resolve().parents[1]
def read(path):
 data=path.read_bytes();size=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+size]);binary=28+size
 def accessor(index):
  a=doc['accessors'][index];v=doc['bufferViews'][a['bufferView']]
  if a['componentType']!=5126 or 'sparse' in a:raise RuntimeError('Unsupported animation accessor')
  width={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']];offset=binary+v.get('byteOffset',0)+a.get('byteOffset',0)
  return np.ndarray((a['count'],width),dtype='<f4',buffer=data,offset=offset,strides=(v.get('byteStride',width*4),4)).copy()
 result={}
 for animation in doc['animations']:
  channels={}
  for channel in animation['channels']:
   target=channel['target'];sampler=animation['samplers'][channel['sampler']];key=(doc['nodes'][target['node']]['name'],target['path'])
   if key in channels:raise RuntimeError('Duplicate animation channel')
   channels[key]=(sampler.get('interpolation','LINEAR'),accessor(sampler['input']),accessor(sampler['output']))
  result[animation['name']]=channels
 return result
before=read(Path('/tmp/ulotte-before-cycle-fix.glb'));after=read(ROOT/'public/characters/dachshund-sculpt/dog.glb')
if len(after)!=119 or set(before)!=set(after):raise RuntimeError('Catalog changed')
for clip,channels in before.items():
 if clip=='walk_fwd_sniff 46':continue
 if set(channels)!=set(after[clip]):raise RuntimeError('Channels changed: '+clip)
 for key,(interpolation,times,values) in channels.items():
  actual=after[clip][key]
  if interpolation!=actual[0] or times.shape!=actual[1].shape or values.shape!=actual[2].shape or not np.allclose(times,actual[1],atol=1e-6,rtol=0) or not np.allclose(values,actual[2],atol=1e-6,rtol=0):raise RuntimeError('Unreviewed animation changed: '+clip+' '+str(key))
report=dict(clips=119,unchangedClips=118,updated=['walk_fwd_sniff 46'],accessorTolerance=1e-6)
(ROOT/'artifacts/dachshund-sculpt/life-review/catalog-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print('PASS: 119 clips; all tracks of the other 118 unchanged.')
