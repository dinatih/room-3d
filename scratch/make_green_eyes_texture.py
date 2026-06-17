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
    img_path = "sources_backup/lara-croft-2026-rigged/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    h, w, _ = data.shape
    
    new_data = data.copy()
    
    cx, cy = 117, 125
    R = 54 # Rayon de l'iris
    
    replaced_count = 0
    for y in range(max(0, cy - R), min(h, cy + R)):
        for x in range(max(0, cx - R), min(w, cx + R)):
            # Distance au centre
            if (x - cx)**2 + (y - cy)**2 <= R**2:
                r_val, g_val, b_val, a_val = data[y, x]
                
                # Exclure le blanc de l'œil
                is_white = (r_val > 200) & (g_val > 200) & (b_val > 200)
                
                if not is_white:
                    h_val, s_val, v_val = rgb_to_hsv(r_val, g_val, b_val)
                    
                    # Teintes chaudes (marron, orange, rouge)
                    if (0 <= h_val <= 65 or h_val >= 330) and s_val > 0.15:
                        # Vert émeraude/olive très joli : 115 degrés
                        h_new = 115.0
                        # Saturation bien présente pour le vert
                        s_new = min(1.0, s_val * 1.5)
                        r_new, g_new, b_new = hsv_to_rgb(h_new, s_new, v_val)
                        new_data[y, x] = [r_new, g_new, b_new, a_val]
                        replaced_count += 1
                        
    print(f"Nombre de pixels d'iris modifiés en vert : {replaced_count}")
    
    out_path = "public/media/textures/8003_green.png"
    Image.fromarray(new_data).save(out_path)
    print(f"Nouvelle texture d'yeux verts sauvegardée dans {out_path}")

if __name__ == "__main__":
    main()
