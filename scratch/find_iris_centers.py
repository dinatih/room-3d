from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    h, w, _ = data.shape
    
    # L'iris est circulaire, sombre, et a des teintes marrons.
    # Dans la moitié gauche (x < 256), cherchons les pixels de l'iris.
    # L'iris a une couleur marron/noire distinctive.
    # Remplaçons les critères pour être plus sélectifs :
    # r, g, b : r doit être entre 20 et 120, g entre 10 et 90, b entre 5 et 60.
    # Et a > 200 (opaque).
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    
    # Iris marron : couleur marron sombre, typiquement 30 < r < 130, 20 < g < 100, b < 70, et r > b + 15
    mask_iris = (r > 30) & (r < 140) & (g > 20) & (g < 110) & (b < 70) & (r > b + 15) & (data[:,:,3] > 200) & (np.arange(w) < w//2)[None, :]
    
    coords = np.argwhere(mask_iris)
    print(f"Nombre de pixels d'iris marron potentiels: {len(coords)}")
    
    # Trouvons les clusters. Comme il y a deux yeux, il devrait y avoir deux groupes distincts en X.
    if len(coords) > 0:
        xs = coords[:, 1]
        ys = coords[:, 0]
        
        # Séparons en deux yeux (gauche et droit) selon x_center local
        x_min, x_max = xs.min(), xs.max()
        x_mid = (x_min + x_max) // 2
        print(f"Plage X des pixels marrons: [{x_min}, {x_max}], milieu = {x_mid}")
        
        left_eye_coords = coords[coords[:, 1] < x_mid]
        right_eye_coords = coords[coords[:, 1] >= x_mid]
        
        print(f"Pixels œil gauche: {len(left_eye_coords)}")
        print(f"Pixels œil droit: {len(right_eye_coords)}")
        
        if len(left_eye_coords) > 0:
            ly_min, lx_min = left_eye_coords.min(axis=0)
            ly_max, lx_max = left_eye_coords.max(axis=0)
            l_cy, l_cx = left_eye_coords.mean(axis=0)
            print(f"Œil gauche: x=[{lx_min}, {lx_max}], y=[{ly_min}, {ly_max}], centre=({l_cx:.1f}, {l_cy:.1f})")
            
        if len(right_eye_coords) > 0:
            ry_min, rx_min = right_eye_coords.min(axis=0)
            ry_max, rx_max = right_eye_coords.max(axis=0)
            r_cy, r_cx = right_eye_coords.mean(axis=0)
            print(f"Œil droit: x=[{rx_min}, {rx_max}], y=[{ry_min}, {ry_max}], centre=({r_cx:.1f}, {r_cy:.1f})")

if __name__ == "__main__":
    main()
