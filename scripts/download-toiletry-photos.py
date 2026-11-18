"""Download the product galleries extracted from the user's Chrome tabs."""
from pathlib import Path
import json
import urllib.request
import io
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
for item in json.loads((ROOT / 'scripts/toiletry-products.json').read_text()):
    for url, path in zip(item['images'], item['photos']):
        target = ROOT / 'public' / path
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            continue
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=45) as response:
            image = Image.open(io.BytesIO(response.read())).convert('RGBA')
        background = Image.new('RGB', image.size, 'white')
        background.paste(image, mask=image.getchannel('A'))
        background.save(target, quality=94)
        print(target, flush=True)
