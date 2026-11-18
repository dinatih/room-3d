"""Remplace le QR code de l'affiche « Hug Life VI » par un QR code valide.

Usage : python3 scripts/replace_poster_qr.py affiche.jpg qr.png sortie.jpg [TLx TLy TRx TRy BLx BLy]
Le QR est recalé en affine sur l'autocollant (coins mesurés sur l'affiche 1493x2000).
"""
import sys
import numpy as np
from PIL import Image

poster_path, qr_path, out_path = sys.argv[1:4]
poster = Image.open(poster_path).convert("RGB")
qr = Image.open(qr_path).convert("RGB")

# Zone des modules dans le QR source (pixels non blancs).
arr = np.asarray(qr).astype(int)
dark = (arr.sum(axis=2) < 600)
ys, xs = np.where(dark)
sx0, sx1, sy0, sy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1

# Coins des modules sur l'affiche : haut-gauche, haut-droite, bas-gauche (mesurés).
corners = [float(x) for x in sys.argv[4:10]] or [87.5, 1715.0, 285.0, 1692.5, 110.0, 1904.0]
TL, TR, BL = (np.array(corners[i:i + 2]) for i in (0, 2, 4))
u = (TR - TL) / (sx1 - sx0)  # déplacement affiche par pixel source en x
v = (BL - TL) / (sy1 - sy0)  # idem en y

# Matrice affine inverse : point affiche -> point source.
M = np.array([[u[0], v[0]], [u[1], v[1]]])
Minv = np.linalg.inv(M)
origin = np.array([sx0, sy0], dtype=float)
a, b, d, e = Minv[0, 0], Minv[0, 1], Minv[1, 0], Minv[1, 1]
c = origin[0] - (a * TL[0] + b * TL[1])
f = origin[1] - (d * TL[0] + e * TL[1])

# Source étendue d'une marge blanche (quiet zone) qui masque l'ancien QR.
pad = 5
canvas = qr.crop((sx0 - pad, sy0 - pad, sx1 + pad, sy1 + pad))
# Le recadrage décale l'origine source de (sx0 - pad, sy0 - pad).
c -= sx0 - pad
f -= sy0 - pad
warped = canvas.transform(poster.size, Image.AFFINE, (a, b, c, d, e, f), Image.BICUBIC, fillcolor=(0, 0, 0))
mask = Image.new("L", canvas.size, 255).transform(poster.size, Image.AFFINE, (a, b, c, d, e, f), Image.BILINEAR, fillcolor=0)
# Ne recouvre que la zone modules + marge (pas le texte dinatih.org en dessous).
poster.paste(warped, (0, 0), mask)
poster.save(out_path, quality=95)
print("ok", out_path)
