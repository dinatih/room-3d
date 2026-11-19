"""Compose the offline review and plot measured 3D interior joint angles."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/ushiro/rebuild'
font=ImageFont.load_default(size=18)
for clip in ['idle','walk','run']:
    sheet=Image.new('RGB',(480*4,390*6),'#d6dce3');draw=ImageDraw.Draw(sheet)
    for model,label in enumerate(['Pitbull','Ushiro avant','Ushiro reconstruit']):
        for i in range(8):
            image=Image.open(OUT/f'{clip}-{model}-{i}.png').convert('RGB');x=(i%4)*480;y=(model*2+i//4)*390
            sheet.paste(image,(x,y+30));draw.text((x+10,y+5),f'{label} · {clip} · phase {i}/8',fill='black',font=font)
    sheet.save(OUT/f'{clip}-comparison.jpg',quality=92)
    phases=[0] if clip=='idle' else [0,2,4,6]
    details=Image.new('RGB',(480*len(phases),390*3),'#d6dce3');draw=ImageDraw.Draw(details)
    for row,(view,label) in enumerate([('front','Face'),('three-quarter','Trois quarts'),('forelimb','Patte avant')]):
        for col,i in enumerate(phases):
            image=Image.open(OUT/f'{clip}-{view}-{i}.png').convert('RGB');x=col*480;y=row*390
            details.paste(image,(x,y+30));draw.text((x+10,y+5),f'{label} · {clip} · phase {i}/8',fill='black',font=font)
    details.save(OUT/f'{clip}-details.jpg',quality=92)

data=json.loads((OUT/'validation.json').read_text())
figure,axes=plt.subplots(4,2,figsize=(12,12),sharex=True,sharey=True)
for col,(clip,title) in enumerate([('walk_fwd 29','Marche'),('run_fwd 13','Course')]):
    for row,(joint,label) in enumerate([('LeftElbow','Coude gauche'),('RightElbow','Coude droit'),('LeftKnee','Genou gauche'),('RightKnee','Genou droit')]):
        ax=axes[row,col]
        for model,color,name,style in [('before','#999999','Ushiro avant','--'),('donor','#2869ae','Pitbull','-'),('after','#d34836','Ushiro reconstruit','-')]:
            samples=data[model]['measurements'][clip]['samples']
            ax.plot([s['phase']*100 for s in samples],[s['angles'][joint] for s in samples],color=color,label=name,linestyle=style,linewidth=1.6)
        ax.set_title(f'{title} · {label}',fontsize=11);ax.set_ylim(0,185);ax.set_xlim(0,100);ax.grid(alpha=.22)
        if col==0:ax.set_ylabel('Angle intérieur 3D (°)')
        if row==3:ax.set_xlabel('Phase du cycle (%)')
figure.suptitle('Ushiro — comparaison des angles sur les modèles exportés',fontsize=15)
handles,labels=axes[0,0].get_legend_handles_labels();figure.legend(handles,labels,loc='lower center',ncol=3,frameon=False)
figure.tight_layout(rect=(0,.035,1,.96));figure.savefig(OUT/'joint-angles.png',dpi=160);plt.close(figure)
print('Composed comparison sheets, front/three-quarter/forelimb details and measured angle curves.')
