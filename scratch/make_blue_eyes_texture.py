from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    h, w, _ = data.shape
    
    new_data = data.copy()
    
    # Centre et rayon de l'iris marron d'origine :
    cx, cy = 117, 125
    R = 54 # Rayon optimal pour couvrir l'iris complet
    
    # Décalage exact de la pupille marron vers la pupille bleue :
    dx = 200
    dy = 1
    
    replaced_count = 0
    for y in range(max(0, cy - R), min(h, cy + R)):
        for x in range(max(0, cx - R), min(w, cx + R)):
            # Distance au centre
            if (x - cx)**2 + (y - cy)**2 <= R**2:
                bx = x + dx
                by = y + dy
                
                if 0 <= bx < w and 0 <= by < h:
                    r_val, g_val, b_val, a_val = data[y, x]
                    
                    # On évite de toucher la sclérotique qui est blanche
                    is_white = (r_val > 215) & (g_val > 215) & (b_val > 215)
                    
                    if not is_white:
                        new_data[y, x] = data[by, bx]
                        replaced_count += 1
                        
    print(f"Nombre de pixels d'iris remplacés : {replaced_count}")
    
    out_path = "public/media/textures/8003_blue.png"
    Image.fromarray(new_data).save(out_path)
    print(f"Nouvelle texture d'yeux sauvegardée dans {out_path}")

if __name__ == "__main__":
    main()
