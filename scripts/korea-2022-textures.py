"""Build UV artwork for the personalized 2022 Korea home jersey."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/items/korea-2022-inyeong'
FONT='/usr/share/fonts/liberation/LiberationSans-Regular.ttf'
S=2048
# Coordinates in the flat sewing pattern, metres.
def uv(x,z):return (round((x/.84+.5)*S),round((1-z/.72)*S))
ref=Image.open(OUT/'product-front.jpg').convert('RGB')
for side in ['front','back']:
 im=Image.new('RGB',(S,S),(224,14,35));d=ImageDraw.Draw(im)
 # Use the photographed tiger graphic rather than clean artificial stripes.
 sleeve=ref.crop((225,160,298,445)).copy()
 pixels=sleeve.load()
 for py in range(sleeve.height):
  for px in range(sleeve.width):
   r,g,b=pixels[px,py]
   if r>190 and g>160 and b>160:pixels[px,py]=(224,14,35)
 sleeve=sleeve.resize((round(.32/.84*S),round(.32/.72*S)),Image.Resampling.LANCZOS)
 im.paste(sleeve,uv(-.42,.72))
 im.paste(sleeve.transpose(Image.Transpose.FLIP_LEFT_RIGHT),uv(.10,.72))
 # Plain central raglan panel; the tiger motif belongs to sleeves/shoulders.
 d.polygon([uv(-.12,.72),uv(.12,.72),uv(.27,.43),uv(.27,0),uv(-.27,0),uv(-.27,.43)],fill=(224,14,35))
 # Black triangular side panels.
 for sign in (-1,1):d.polygon([uv(sign*.27,0),uv(sign*.27,.15),uv(sign*.245,0)],fill=(17,17,19))
 def text(value,z,size):
  font=ImageFont.truetype(FONT,size);d.text(uv(0,z),value,font=font,anchor='mt',fill=(15,15,17),stroke_width=1)
 if side=='back':text('INYEONG',.59,115);text('24',.48,590)
 else:
  # Copy only the black manufacturer/crest marks from the product photo,
  # keeping the rest of the artwork clean and independent of photo lighting.
  for bounds,x,z,w,h in [((490,267,563,385),.135,.56,.064,.102),((299,292,369,336),-.135,.565,.075,.039)]:
   crop=ref.crop(bounds);mask=crop.convert('L').point(lambda v:255 if v<65 else 0)
   dims=(round(w/.84*S),round(h/.72*S));mask=mask.resize(dims,Image.Resampling.LANCZOS)
   p=uv(x-w/2,z+h/2);im.paste((12,12,14),p,mask)
  text('24',.48,180)
 im.save(OUT/f'{side}-artwork.png')
