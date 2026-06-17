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

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    
    # Iris bleu : x dans [244, 414], y dans [65, 434]
    # Trouvons les pixels bleus dominants dans cette zone
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    mask = (b > 100) & (b > r + 10) & (b > g + 10) & (a > 50) & (np.arange(data.shape[1]) >= 244)[None, :]
    
    coords = np.argwhere(mask)
    print(f"Pixels bleus trouvés: {len(coords)}")
    
    if len(coords) > 0:
        h_vals = []
        s_vals = []
        v_vals = []
        for y, x in coords:
            cr, cg, cb, ca = data[y, x]
            h, s, v = rgb_to_hsv(cr, cg, cb)
            h_vals.append(h)
            s_vals.append(s)
            v_vals.append(v)
            
        print(f"Teinte moyenne: {np.mean(h_vals):.1f} (min={np.min(h_vals):.1f}, max={np.max(h_vals):.1f})")
        print(f"Saturation moyenne: {np.mean(s_vals):.2f} (min={np.min(s_vals):.2f}, max={np.max(s_vals):.2f})")
        print(f"Luminosité moyenne: {np.mean(v_vals):.2f} (min={np.min(v_vals):.2f}, max={np.max(v_vals):.2f})")

if __name__ == "__main__":
    main()
