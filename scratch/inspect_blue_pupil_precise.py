from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    
    # Boîte restreinte pour l'iris bleu : x dans [260, 360], y dans [60, 160]
    box = data[60:160, 260:360, :3]
    luma = np.sum(box, axis=2)
    
    min_luma = np.min(luma)
    coords = np.argwhere(luma == min_luma)
    print(f"Luma minimale: {min_luma}")
    
    # Trouvons le centre de gravité des pixels de l'iris bleu les plus sombres (pupille)
    # Pour être robuste, prenons tous les pixels noirs (luma < min_luma + 20)
    dark_pixels = np.argwhere(luma < min_luma + 20)
    cy, cx = dark_pixels.mean(axis=0)
    global_cx = 260 + cx
    global_cy = 60 + cy
    
    print(f"Pupille bleue détectée à global x={global_cx:.2f}, y={global_cy:.2f}")

if __name__ == "__main__":
    main()
