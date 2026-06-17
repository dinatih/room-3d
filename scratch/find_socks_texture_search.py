import os
from PIL import Image
import numpy as np

def rgb_to_hsv(r, g, b):
    r, g, b = r/255.0, g/255.0, b/255.0
    mx = max(r, g, b)
    mn = min(r, g, b)
    df = mx-mn
    if mx == mn:
        h = 0
    elif mx == r:
        h = (60 * ((g-b)/df) + 360) % 360
    elif mx == g:
        h = (60 * ((b-r)/df) + 120) % 360
    elif mx == b:
        h = (60 * ((r-g)/df) + 240) % 360
    if mx == 0:
        s = 0
    else:
        s = df/mx
    v = mx
    return h, s, v

def main():
    tex_dir = "sources_backup/lara-croft-2026-rigged/textures"
    files = [f for f in os.listdir(tex_dir) if f.endswith('.png')]
    
    print("Recherche de textures contenant du blanc plissé (chaussettes) :")
    for f_name in sorted(files):
        img_path = os.path.join(tex_dir, f_name)
        img = Image.open(img_path).convert('RGBA')
        data = np.array(img)
        h, w, _ = data.shape
        
        # Cherchons les pixels blancs/gris clairs très peu saturés (s < 0.08, v > 0.6)
        r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
        
        # Filtre chaussette blanche
        mask = (a > 200) & (r > 150) & (g > 150) & (b > 150) & (abs(r - g) < 10) & (abs(g - b) < 10)
        coords = np.argwhere(mask)
        
        if len(coords) > 500:
            print(f"- {f_name} (taille {w}x{h}) : {len(coords)} pixels blancs/gris clairs détectés")
            # Sauvons un crop ou affichons des détails
            y_min, x_min = coords.min(axis=0)
            y_max, x_max = coords.max(axis=0)
            print(f"  -> Coordonnées : x=[{x_min}, {x_max}], y=[{y_min}, {y_max}]")

if __name__ == "__main__":
    main()
