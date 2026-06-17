from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    
    # 1. Rechercher le centre de la pupille marron (haut-gauche)
    # Zone : x dans [50, 170], y dans [50, 170]
    sub_marron = data[50:170, 50:170, :3]
    luma_marron = np.sum(sub_marron, axis=2) # r + g + b
    # Les pixels de la pupille sont extrêmement sombres (proches de 0)
    min_luma_marron = np.min(luma_marron)
    # Prenons tous les pixels très sombres de la pupille
    dark_marron = np.argwhere(luma_marron < min_luma_marron + 30)
    marron_cy, marron_cx = dark_marron.mean(axis=0)
    global_marron_cx = 50 + marron_cx
    global_marron_cy = 50 + marron_cy
    
    # 2. Rechercher le centre de la pupille bleue (haut-droite)
    # Zone : x dans [240, 340], y dans [80, 180]
    sub_bleu = data[80:180, 240:340, :3]
    luma_bleu = np.sum(sub_bleu, axis=2)
    min_luma_bleu = np.min(luma_bleu)
    dark_bleu = np.argwhere(luma_bleu < min_luma_bleu + 30)
    bleu_cy, bleu_cx = dark_bleu.mean(axis=0)
    global_bleu_cx = 240 + bleu_cx
    global_bleu_cy = 80 + bleu_cy
    
    print(f"Pupille marron (centre exact) : x={global_marron_cx:.2f}, y={global_marron_cy:.2f}")
    print(f"Pupille bleue  (centre exact) : x={global_bleu_cx:.2f}, y={global_bleu_cy:.2f}")
    
    dx = global_bleu_cx - global_marron_cx
    dy = global_bleu_cy - global_marron_cy
    print(f"Décalage nécessaire : dx={dx:.2f}, dy={dy:.2f}")

if __name__ == "__main__":
    main()
