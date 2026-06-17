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
    img_path = "sources_backup/lara-croft-2026-rigged/textures/8016.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    h, w, _ = data.shape
    
    new_data = data.copy()
    
    # 1. Chaussettes dorées : boîte chaussette plissée 1 (x=[330,512], y=[60,200]) + boîte chaussette 2 (x=[475,512], y=[200,512])
    # 2. Bottes rouges : zones marrons d'origine (marron -> rouge)
    
    sock_pixels = 0
    boot_pixels = 0
    
    for y in range(h):
        for x in range(w):
            r_val, g_val, b_val, a_val = data[y, x]
            h_val, s_val, v_val = rgb_to_hsv(r_val, g_val, b_val)
            
            # Détection par boîtes absolues pour les chaussettes plissées
            is_sock_box1 = (330 <= x <= 512) and (60 <= y <= 200)
            is_sock_box2 = (475 <= x <= 512) and (200 <= y <= 512)
            is_sock = (is_sock_box1 or is_sock_box2) and (v_val > 0.15)
            
            if is_sock:
                # Colorer en doré (44 degrés)
                h_new = 44.0
                s_new = 0.75 # Plus saturé pour un doré brillant
                r_new, g_new, b_new = hsv_to_rgb(h_new, s_new, v_val)
                new_data[y, x] = [r_new, g_new, b_new, a_val]
                sock_pixels += 1
            else:
                # Bottes en cuir (marron d'origine)
                if (10 <= h_val <= 45) and s_val > 0.12:
                    h_new = 0.0
                    s_new = min(1.0, s_val * 1.8)
                    r_new, g_new, b_new = hsv_to_rgb(h_new, s_new, v_val)
                    new_data[y, x] = [r_new, g_new, b_new, a_val]
                    boot_pixels += 1
                    
    print(f"Pixels chaussettes modifiés : {sock_pixels}")
    print(f"Pixels bottes modifiés : {boot_pixels}")
    
    out_path = "public/media/textures/8016_cha.png"
    Image.fromarray(new_data).save(out_path)
    print(f"Texture de bottes/chaussettes mise à jour sauvegardée dans {out_path}")

if __name__ == "__main__":
    main()
