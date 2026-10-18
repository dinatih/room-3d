"""Bake the supplied design onto the front and back of both torso necks.
Run node scripts/temp_sara_nape.mjs before this script to extract the GLB UVs.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'src/features/scene/assets'
reference = Image.open(ASSETS / 'sara-nape-reference.png').convert('RGB')
ink = 255 - np.asarray(reference).min(axis=2)
# Crop only the white margin of the supplied image.
y, x = np.nonzero(ink)
ink = ink[y.min():y.max()+1, x.min():x.max()+1]
# Eight centimetres across the nape; keep the reference's original proportions.
width = 0.08
height = width * ink.shape[0] / ink.shape[1]
center_x = 0.002
upper_y = 1.515
for mesh in json.loads(Path('/tmp/sara-nape-meshes.json').read_text()):
    positions = np.array(mesh['positions']).reshape(-1, 3)
    uv = np.array(mesh['uv']).reshape(-1, 2) * [4096, 2048]
    canvas = np.zeros((2048, 4096, 4), dtype=np.uint8)
    for ids in np.array(mesh['indices']).reshape(-1, 3):
        p = positions[ids]
        if p[:, 1].max() < upper_y-height or p[:, 1].min() > upper_y:
            continue
        t = uv[ids]
        matrix = (t[1:] - t[0]).T
        if abs(np.linalg.det(matrix)) < 1e-10:
            continue
        low = np.maximum(np.floor(t.min(axis=0)).astype(int), 0)
        high = np.minimum(np.ceil(t.max(axis=0)).astype(int), [4096,2048])
        for cy in range(low[1], high[1]):
            for cx in range(low[0], high[0]):
                b, c = np.linalg.solve(matrix, np.array([cx+.5,cy+.5])-t[0])
                if min(b,c,1-b-c) < 0:
                    continue
                point = p[0] + b*(p[1]-p[0]) + c*(p[2]-p[0])
                u = (point[0]-center_x)/width + .5
                v = (upper_y-point[1])/height
                if 0 <= u < 1 and 0 <= v < 1:
                    canvas[cy,cx,3] = ink[int(v*ink.shape[0]),int(u*ink.shape[1])]
    target = ASSETS / f"sara-nape-{mesh['name']}-{mesh['index']}.png"
    Image.fromarray(canvas).save(target)
    print(target.name, 'ink texels:', np.count_nonzero(canvas[:,:,3]))
