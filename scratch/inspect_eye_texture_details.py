from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    print(f"Dimensions de l'image: {width}x{height}")
    
    # Sauvons des sous-images de différentes régions pour voir ce qu'elles contiennent
    # L'iris marron est probablement à gauche et le bleu à droite.
    # Divisons l'image en deux moitiés gauche et droite, et sauvons-les.
    left_half = img.crop((0, 0, width//2, height))
    left_half.save("scratch/left_half.png")
    
    right_half = img.crop((width//2, 0, width, height))
    right_half.save("scratch/right_half.png")
    
    print("Sous-images gauche et droite sauvegardées dans scratch/")

if __name__ == "__main__":
    main()
