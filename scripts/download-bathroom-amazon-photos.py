"""Download the product images read from the user's Chrome Amazon tabs."""
import json
from pathlib import Path
from urllib.request import urlretrieve
ROOT=Path(__file__).resolve().parents[1]
for item in json.loads((ROOT/'scripts/bathroom-amazon-products.json').read_text()):
 folder=ROOT/'public/items'/item['id'];folder.mkdir(parents=True,exist_ok=True)
 for i,url in enumerate(item['images'],1):
  url='https://m.media-amazon.com/images/I/'+url.split('/I/')[1]
  urlretrieve(url,folder/f'product-{i}.jpg')
 print(item['id'],flush=True)
