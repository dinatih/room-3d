"""Synchronized donor/before/after skin sheets, four phases per page."""
from pathlib import Path
import argparse,json,math
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts/ushiro/priority-review'
p=argparse.ArgumentParser();p.add_argument('--after',default='final');args=p.parse_args()
manifest=json.loads((OUT/args.after/'manifest.json').read_text());font=ImageFont.load_default(size=15)
for clip in dict.fromkeys(e['clip'] for e in manifest):
 entries=[e for e in manifest if e['clip']==clip];phases=list(dict.fromkeys(e['phase'] for e in entries))
 for page in range(math.ceil(len(phases)/4)):
  selected=phases[page*4:page*4+4]
  sheet=Image.new('RGB',(440*len(selected),30+360*6),'#d3d7db');draw=ImageDraw.Draw(sheet)
  draw.text((8,5),f'{clip} - Page {page+1}/{math.ceil(len(phases)/4)}',fill='black',font=font)
  for row,(model,view,label) in enumerate([(model,view,label+' - '+{'profile':'Profil','three-quarter':'Trois quarts'}[view]) for view in ['profile','three-quarter'] for model,label in [('donor','Pitbull'),('before','Ushiro avant'),(args.after,'Ushiro apres')]]):
   for col,phase in enumerate(selected):
    entry=next(e for e in entries if e['phase']==phase and e['view']==view)
    sheet.paste(Image.open(OUT/model/entry['file']).convert('RGB'),(col*440,row*360+60));draw.text((col*440+8,row*360+35),f'{label} - {phase:.1%}',fill='black',font=font)
  slug=clip.replace(' ','-').replace('.','').replace('/','-');sheet.save(OUT/f'{slug}-{page+1}.jpg',quality=91)
 print(clip)
