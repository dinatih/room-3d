"""Import the six supplied dog archives, retaining source rigs and animations."""
import bpy,zipfile,tempfile,json,os,shutil,struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=Path.home()/'3D Resources/animals'
items=[('animated-pitbull-dog','Pitbull',55),('labrador-dog-from-cotw-game','Labrador COTW',60),('bloodhund-from-cotw-game-ears-has-animglitch','Bloodhound COTW',65),('rdr2-dog-poodle','Caniche RDR2',50),('rdr2-dog-border-collie','Border Collie RDR2',55),('rdr2-dog-labrador','Labrador RDR2',60)]
records=[]
for key,name,height in items:
 work=Path(tempfile.mkdtemp(prefix='room-dog-'))
 with zipfile.ZipFile(source/(key+'.zip')) as z:z.extractall(work)
 files=list((work/'source').iterdir());assert len(files)==1
 bpy.ops.wm.read_factory_settings(use_empty=True)
 if files[0].suffix=='.fbx':
  bpy.ops.import_scene.fbx(filepath=str(files[0]))
  textures=list((work/'textures').iterdir())
  for mat in bpy.data.materials:
   if mat.use_nodes:
    shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=bpy.data.images.load(str(textures[0]));mat.node_tree.links.new(node.outputs['Color'],shader.inputs['Base Color'])
 else: pass
 folder=root/'public/characters'/key;folder.mkdir(parents=True,exist_ok=True)
 if files[0].suffix=='.glb': shutil.copyfile(files[0],folder/'dog.glb')
 else: bpy.ops.export_scene.gltf(filepath=str(folder/'dog.glb'),export_format='GLB',export_animations=True)
 data=(folder/'dog.glb').read_bytes(); document=json.loads(data[20:20+struct.unpack_from('<I',data,12)[0]])
 clips=[a['name'] for a in document.get('animations',[])]
 idle=next((c for c in clips if 'idle' in c.lower() and ('pose' in c.lower() or c.lower().startswith('idle ') or '_idle_idle' in c.lower())),None)
 if idle is None: raise ValueError(f'No idle animation for {key}: {clips}')
 records.append({'id':key,'name':name,'brand':'','category':'animals','qty':1,'dims':{'w':height*.5,'d':height*1.5,'h':height},'glbPath':f'characters/{key}/dog.glb','idleClip':idle,'notes':'Modèle animé importé. Dimensions de présentation estimées.'+(' Défaut d’animation des oreilles signalé dans le modèle source.' if 'bloodhund' in key else '')})
 print('IMPORTED',key,flush=True)
(root/'src/features/inventory/extraDogs.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
os._exit(0)
