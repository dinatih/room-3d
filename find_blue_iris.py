from PIL import Image
import numpy as np

IMG_PATH = "public/media/textures/8003.png"

def main():
    img = Image.open(IMG_PATH).convert('RGBA')
    data = np.array(img)
    h, w, _ = data.shape
    
    # Find pixels where blue is dominant
    # Threshold: blue > 120 and blue > red + 20 and blue > green + 20
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    mask = (b > 100) & (b > r + 10) & (b > g + 10) & (a > 50)
    
    coords = np.argwhere(mask)
    if coords.size == 0:
        print("No blue pixels found.")
        return
        
    y_min, x_min = coords.min(axis=0)
    y_max, x_max = coords.max(axis=0)
    
    center_y, center_x = coords.mean(axis=0)
    
    print(f"Image size: {w}x{h}")
    print(f"Blue area: x=[{x_min}, {x_max}], y=[{y_min}, {y_max}]")
    print(f"Center: x={center_x:.1f}, y={center_y:.1f}")
    print(f"Relative Center: u={center_x/w:.3f}, v={1.0 - center_y/h:.3f}")

    # Now find brown iris (for comparison)
    # brown: r > 80, r > b, g > b
    mask_brown = (r > 80) & (r > b + 20) & (g > b - 20) & (a > 50)
    coords_brown = np.argwhere(mask_brown)
    if coords_brown.size > 0:
        by_min, bx_min = coords_brown.min(axis=0)
        by_max, bx_max = coords_brown.max(axis=0)
        bc_y, bc_x = coords_brown.mean(axis=0)
        print(f"Brown area: x=[{bx_min}, {bx_max}], y=[{by_min}, {by_max}]")
        print(f"Brown Center: u={bc_x/w:.3f}, v={1.0 - bc_y/h:.3f}")
        print(f"Offset needed: du={ (center_x - bc_x)/w :.3f}, dv={ (bc_y - center_y)/h :.3f}")

if __name__ == "__main__":
    main()
