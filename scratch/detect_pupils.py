from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    
    # Recherche du pixel le plus sombre dans les boîtes englobantes estimées des deux yeux
    # Œil gauche : x dans [40, 110], y dans [300, 380]
    # Œil droit : x dans [140, 210], y dans [320, 400]
    
    left_box = data[300:380, 40:110, :3] # shape (80, 70, 3)
    right_box = data[320:400, 140:210, :3] # shape (80, 70, 3)
    
    # Calcul de la luminosité (r + g + b) pour chaque pixel de la boîte
    left_luma = np.sum(left_box, axis=2)
    right_luma = np.sum(right_box, axis=2)
    
    # Trouver le minimum
    ly, lx = np.unravel_index(np.argmin(left_luma), left_luma.shape)
    ry, rx = np.unravel_index(np.argmin(right_luma), right_luma.shape)
    
    # Coordonnées globales dans l'image 512x512
    left_center = (40 + lx, 300 + ly)
    right_center = (140 + rx, 320 + ry)
    
    print(f"Pupille œil gauche trouvée à global x={left_center[0]}, y={left_center[1]} (valeur RGB={left_box[ly, lx]})")
    print(f"Pupille œil droit trouvée à global x={right_center[0]}, y={right_center[1]} (valeur RGB={right_box[ry, rx]})")

if __name__ == "__main__":
    main()
