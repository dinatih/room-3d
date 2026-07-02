from PIL import Image
import numpy as np

img = Image.open("/home/dinatih/Projects/room-3d/sources_backup/lara-croft-2026-rigged/textures/8001.png").convert('RGB')
data = np.array(img)
h, w, _ = data.shape

print("Scanning for dark strap pixels in 8001.png...")
# Let's find rows where there's a concentration of very dark pixels on the legs.
# Legs are located in the main torso/skin area.
# Let's print regions of dark pixels
for y in range(0, h, 8):
    dark_in_row = []
    for x in range(w):
        r, g, b = data[y, x]
        if r < 75 and g < 55 and b < 45:
            dark_in_row.append(x)
    if len(dark_in_row) > 15:
        print(f"Row {y:03d}: {len(dark_in_row)} dark pixels, from x={min(dark_in_row)} to {max(dark_in_row)}")
