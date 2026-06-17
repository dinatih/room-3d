from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    
    # Centre de l'iris marron : x=123, y=253 (environ)
    # Faisons des essais sur le rayon pour cibler uniquement l'iris.
    # On peut changer la couleur des pixels marrons dans cette zone en bleu.
    # Pour savoir comment changer le marron en bleu :
    # On convertit les couleurs RGB en HSV, on change le Hue du marron (environ 20-30 degrés) 
    # pour le mettre dans les bleus (environ 200-240 degrés), puis on reconvertit en RGB.
    
    # Écrivons une fonction pour convertir RGB en HSV
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
        h = float(h)
        s = float(s)
        v = float(v)
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

    h, w, _ = data.shape
    new_data = data.copy()
    
    # Centre de l'iris marron (œil gauche et œil droit ?)
    # Attends, y a-t-il un œil ou deux yeux marrons ?
    # Généralement, une texture d'yeux contient les deux yeux (gauche et droit).
    # S'ils sont côte à côte ou s'il n'y en a qu'un seul partagé.
    # Analysons où se trouvent les pixels marrons dans la moitié gauche.
    # Affichons tous les pixels marrons significatifs dans la moitié gauche.
    r_chan, g_chan, b_chan = data[:,:,0], data[:,:,1], data[:,:,2]
    # Filtre marron : rouge dominant, bleu faible
    mask_brown = (r_chan > 50) & (r_chan > b_chan + 20) & (data[:,:,3] > 100) & (np.arange(w) < w//2)[None, :]
    
    coords = np.argwhere(mask_brown)
    print(f"Nombre de pixels marrons trouvés dans la moitié gauche: {len(coords)}")
    
    # Modifions les pixels marrons de la moitié gauche
    for y, x in coords:
        r, g, b, a = data[y, x]
        h_val, s_val, v_val = rgb_to_hsv(r, g, b)
        
        # Si la teinte est bien dans les tons chauds (rouge/orange/jaune/marron : 0 à 50)
        if 0 <= h_val <= 60 or h_val >= 330:
            # Changeons la teinte pour du bleu (par exemple 210 pour un beau bleu ciel / cyan, ou 225)
            h_new = 210.0
            # On peut aussi augmenter un peu la saturation pour que le bleu soit éclatant
            s_new = min(1.0, s_val * 1.5)
            # Gardons la luminosité intacte
            r_new, g_new, b_new = hsv_to_rgb(h_new, s_new, v_val)
            new_data[y, x] = [r_new, g_new, b_new, a]
            
    modified_img = Image.fromarray(new_data)
    modified_img.save("scratch/test_blue_eyes.png")
    print("Image modifiée sauvegardée dans scratch/test_blue_eyes.png")

if __name__ == "__main__":
    main()
