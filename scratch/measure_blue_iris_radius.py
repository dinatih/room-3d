from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    
    cx, cy = 317, 126
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Pixels appartenant à l'iris bleu : opaque (a > 100) et non blanc (r < 200, g < 200, b < 200)
    # dans le quadrant supérieur droit
    y_indices, x_indices = np.where((a > 100) & (r < 200) & (g < 200) & (x_indices >= 256 if 'x_indices' in locals() else np.arange(data.shape[1])[None, :] >= 256))
    
    # Distance maximale au centre (317, 126) pour ces pixels
    distances = []
    for y in range(50, 200):
        for x in range(250, 380):
            if data[y, x, 3] > 100 and not (data[y, x, 0] > 220 and data[y, x, 1] > 220 and data[y, x, 2] > 220):
                dist = np.sqrt((x - cx)**2 + (y - cy)**2)
                distances.append(dist)
                
    if len(distances) > 0:
        print(f"Rayon maximum de l'iris bleu : {np.max(distances):.1f} pixels")
        print(f"Rayon moyen de l'iris bleu : {np.mean(distances):.1f} pixels")
    else:
        print("Aucun pixel d'iris bleu trouvé")

if __name__ == "__main__":
    main()
