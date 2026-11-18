"""Build review sheets and GIFs from the eight Blender phases (requires Pillow)."""
from pathlib import Path
import json, struct, argparse
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--dog',choices=['dachshund-sculpt','ushiro'],required=True);parser.add_argument('--extended',action='store_true');args=parser.parse_args()
folder=ROOT/'artifacts'/args.dog/'review'
binary=(ROOT/'public/characters'/args.dog/('dog.glb' if args.dog=='dachshund-sculpt' else 'ushiro.glb')).read_bytes()
document=json.loads(binary[20:20+struct.unpack_from('<I',binary,12)[0]])
clips={a['name']:max(document['accessors'][s['input']]['max'][0] for s in a['samplers']) for a in document['animations']}
choices=[('idle','idle 50'),('walk','walk_fwd 29'),('run','run_fwd 13')]
if args.extended:choices += [('sit','idle_sit_pose 2'),('lay','idle_lay_pose 2'),('jump','jump 22'),('scratch','idle_sit_one_off_scratch 176')]
for name,clip in choices:
    frames=[Image.open(folder/f'{name}-{i}.png').convert('RGB') for i in range(8)]
    width,height=frames[0].size;label_height=25
    sheet=Image.new('RGB',(width*4,(height+label_height)*2),'#dddddd');draw=ImageDraw.Draw(sheet)
    for i,frame in enumerate(frames):
        x,y=(i%4)*width,(i//4)*(height+label_height)
        sheet.paste(frame,(x,y+label_height));draw.text((x+8,y+7),f'{name} : {i}/8',fill='black')
    sheet.save(folder/f'{name}-sheet.jpg',quality=90)
    frames[0].save(folder/f'{name}.gif',save_all=True,append_images=frames[1:],duration=round(clips[clip]*1000/8),loop=0)
