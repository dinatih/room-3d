from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    h, w, _ = data.shape
    
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    
    # Sclérotique (blanc de l'œil) : pixels très clairs et peu saturés
    # R > 150, G > 150, B > 150, et la différence entre R, G, B est faible (saturation faible)
    mask_white = (r > 140) & (g > 140) & (b > 140) & (abs(r - g) < 20) & (abs(g - b) < 20) & (np.arange(w) < w//2)[None, :]
    
    coords_white = np.argwhere(mask_white)
    print(f"Nombre de pixels blancs d'œil: {len(coords_white)}")
    
    # Si on trouve des pixels blancs, l'iris marron est juste à côté ou entouré par eux.
    # Trouvons les boîtes englobantes des pixels blancs pour localiser les globes oculaires.
    if len(coords_white) > 0:
        ys = coords_white[:, 0]
        xs = coords_white[:, 1]
        
        # Séparons en deux globes oculaires (gauche et droit)
        x_min, x_max = xs.min(), xs.max()
        x_mid = (x_min + x_max) // 2
        print(f"Plage X des pixels blancs: [{x_min}, {x_max}], milieu = {x_mid}")
        
        left_whites = coords_white[coords_white[:, 1] < x_mid]
        right_whites = coords_white[coords_white[:, 1] >= x_mid]
        
        # Pour chaque œil, l'iris est la zone sombre à l'intérieur du rectangle englobant du blanc de l'œil
        for name, eye_whites in [("Œil Gauche", left_whites), ("Œil Droit", right_whites)]:
            if len(eye_whites) > 0:
                ey_min, ex_min = eye_whites.min(axis=0)
                ey_max, ex_max = eye_whites.max(axis=0)
                print(f"{name} blanc: x=[{ex_min}, {ex_max}], y=[{ey_min}, {ey_max}]")
                
                # Cherchons maintenant la zone de l'iris à l'intérieur de cette boîte
                # L'iris est une région sombre (luminosité basse) de forme circulaire
                # Extrayons cette sous-région et cherchons le centre de gravité des pixels sombres
                sub_r = r[ey_min:ey_max, ex_min:ex_max]
                sub_g = g[ey_min:ey_max, ex_min:ex_max]
                sub_b = b[ey_min:ey_max, ex_min:ex_max]
                sub_luma = (sub_r.astype(float) + sub_g.astype(float) + sub_b.astype(float)) / 3.0
                
                # Les pixels sombres (iris/pupille) ont une luma < 100
                mask_dark = sub_luma < 100
                dark_coords = np.argwhere(mask_dark)
                if len(dark_coords) > 0:
                    dy, dx = dark_coords.mean(axis=0)
                    global_x = ex_min + dx
                    global_y = ey_min + dy
                    # Estimons le rayon comme la moitié de la largeur moyenne des pixels sombres
                    d_xs = dark_coords[:, 1]
                    d_ys = dark_coords[:, 0]
                    radius_x = (d_xs.max() - d_xs.min()) / 2.0
                    radius_y = (d_ys.max() - d_ys.min()) / 2.0
                    r_est = (radius_x + radius_y) / 2.0
                    print(f"-> Iris détecté à global x={global_x:.1f}, y={global_y:.1f}, rayon estimé={r_est:.1f}")

if __name__ == "__main__":
    main()
