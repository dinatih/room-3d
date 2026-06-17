from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    
    # Analysons la zone x=[240, 360], y=[50, 200]
    # L'iris bleu a une pupille très sombre au centre.
    # Trouvons le pixel le plus sombre uniquement dans cette boîte
    box = data[50:200, 240:360, :3]
    luma = np.sum(box, axis=2)
    
    # Trouvons les pixels ayant la luma minimale (pupille)
    min_luma = np.min(luma)
    coords = np.argwhere(luma == min_luma)
    print(f"Luma minimale dans la zone bleue: {min_luma}")
    print(f"Nombre de pixels ayant cette luma: {len(coords)}")
    for cy, cx in coords:
        print(f"-> Local (y={cy}, x={cx}) => Global (y={50+cy}, x={240+cx})")
        
    # Faisons de même pour le grand œil marron (zone x=[50, 180], y=[50, 180])
    box_m = data[50:180, 50:180, :3]
    luma_m = np.sum(box_m, axis=2)
    min_luma_m = np.min(luma_m)
    coords_m = np.argwhere(luma_m == min_luma_m)
    print(f"\nLuma minimale dans la zone marron: {min_luma_m}")
    print(f"Nombre de pixels ayant cette luma: {len(coords_m)}")
    for cy, cx in coords_m:
        print(f"-> Local (y={cy}, x={cx}) => Global (y={50+cy}, x={50+cx})")

if __name__ == "__main__":
    main()
