from PIL import Image, ImageDraw
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

def hsv_to_rgb(h, s, v):
    c = v * s
    x = c * (1 - abs((h / 60.0) % 2 - 1))
    m = v - c
    if 0 <= h < 60:
        r, g, b = c, x, 0
    elif 60 <= h < 120:
        r, g, b = x, c, 0
    elif 120 <= h < 180:
        r, g, b = 0, c, x
    elif 180 <= h < 240:
        r, g, b = 0, x, c
    elif 240 <= h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    return int((r+m)*255), int((g+m)*255), int((b+m)*255)

def main():
    img_path = "sources_backup/lara-croft-2026-rigged/textures/8019.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    h, w, _ = data.shape
    
    new_data = data.copy()
    
    # 1. Colorer le t-shirt en bleu Superman
    # Devant du t-shirt : x >= 180, y >= 220
    # Dos du t-shirt : x < 240, y < 350
    # Modifions ces deux régions pour les passer en bleu
    for y in range(h):
        for x in range(w):
            is_shirt_front = (x >= 180 and y >= 220)
            is_shirt_back = (x < 240 and y < 350)
            
            if is_shirt_front or is_shirt_back:
                r_val, g_val, b_val, a_val = data[y, x]
                # Les gants noirs en bas à gauche sont dans x < 240 et y >= 350 (exclus par nos conditions)
                # Mais pour être sûr de ne pas colorer d'autres éléments noirs comme les gants,
                # on vérifie la couleur (le t-shirt d'origine est gris-vert d'eau, r > 60, g > 80, b > 80)
                if r_val > 50 and g_val > 70:
                    h_val, s_val, v_val = rgb_to_hsv(r_val, g_val, b_val)
                    # Teinte bleu Superman : 220 degrés
                    h_new = 220.0
                    # Saturation éclatante
                    s_new = 0.90
                    r_new, g_new, b_new = hsv_to_rgb(h_new, s_new, v_val)
                    new_data[y, x] = [r_new, g_new, b_new, a_val]
                    
    # Reconvertir en image PIL pour dessiner le logo
    shirt_img = Image.fromarray(new_data)
    draw = ImageDraw.Draw(shirt_img)
    
    # 2. Dessiner le logo Superman sur le devant du débardeur
    # Centre de la poitrine : cx = 351, cy = 380
    cx, cy = 351, 380
    size = 76 # Taille du diamant
    
    # Points du diamant de Superman (pentagone pointant vers le bas)
    # Les coordonnées relatives au centre (cx, cy)
    half = size // 2
    # Pentagone Superman classique :
    # Haut gauche, Haut droite, Milieu droite, Bas milieu, Milieu gauche
    pts = [
        (cx - half + 12, cy - half),          # Haut gauche
        (cx + half - 12, cy - half),          # Haut droite
        (cx + half, cy - half + 20),          # Milieu droite
        (cx, cy + half + 10),                 # Bas
        (cx - half, cy - half + 20)           # Milieu gauche
    ]
    
    # Remplissage jaune doré, bordure rouge épaisse
    draw.polygon(pts, fill=(255, 215, 0, 255), outline=(230, 0, 0, 255))
    
    # Dessiner la bordure rouge de façon plus épaisse en redessinant des polygones rétrécis
    for offset in range(1, 6):
        pts_shrink = [
            (cx - half + 12 + offset//2, cy - half + offset),
            (cx + half - 12 - offset//2, cy - half + offset),
            (cx + half - offset, cy - half + 20),
            (cx, cy + half + 10 - offset),
            (cx - half + offset, cy - half + 20)
        ]
        draw.polygon(pts_shrink, outline=(230, 0, 0, 255))
        
    # Dessiner le "S" de Superman stylisé en rouge à l'intérieur
    # Nous le traçons avec un tracé de lignes épaisses (jointure ronde)
    # Le "S" doit tenir dans la zone jaune
    # Utilisons draw.line pour tracer un "S" géométrique rouge épais
    s_color = (230, 0, 0, 255)
    w_line = 10
    
    # Partie supérieure du S
    draw.line([(cx - 18, cy - 20), (cx + 15, cy - 20)], fill=s_color, width=w_line, joint="round")
    draw.line([(cx - 18, cy - 20), (cx - 18, cy - 2)], fill=s_color, width=w_line, joint="round")
    # Diagonale / milieu
    draw.line([(cx - 18, cy - 2), (cx + 15, cy - 2)], fill=s_color, width=w_line, joint="round")
    draw.line([(cx + 15, cy - 2), (cx + 15, cy + 18)], fill=s_color, width=w_line, joint="round")
    # Partie inférieure du S
    draw.line([(cx - 18, cy + 18), (cx + 15, cy + 18)], fill=s_color, width=w_line, joint="round")
    
    # Ajoutons un empâtement supérieur et inférieur caractéristique du S de Superman
    # Empâtement en haut à droite du S
    draw.line([(cx + 15, cy - 20), (cx + 15, cy - 10)], fill=s_color, width=w_line, joint="round")
    # Empâtement en bas à gauche du S
    draw.line([(cx - 18, cy + 18), (cx - 18, cy + 8)], fill=s_color, width=w_line, joint="round")
    
    out_path = "public/media/textures/8019_cha.png"
    shirt_img.save(out_path)
    print(f"Nouvelle texture de t-shirt avec logo sauvegardée dans {out_path}")

if __name__ == "__main__":
    main()
