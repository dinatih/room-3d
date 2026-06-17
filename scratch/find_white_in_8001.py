from PIL import Image
import numpy as np

def main():
    img_path = "sources_backup/lara-croft-2026-rigged/textures/8001.png"
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img)
    
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    
    # Check for grey/white pixels (r > 100, g > 100, b > 100, and low saturation)
    mask = (r > 100) & (g > 100) & (b > 100) & (np.abs(r - g) < 8) & (np.abs(g - b) < 8)
    coords = np.argwhere(mask)
    
    print(f"Total grey/white pixels in 8001.png: {len(coords)}")
    if len(coords) > 0:
        # Print bounding box
        y_min, x_min = coords.min(axis=0)
        y_max, x_max = coords.max(axis=0)
        print(f"Bounding box: X=[{x_min}, {x_max}], Y=[{y_min}, {y_max}]")
        
        # Grid counts
        grid_counts = np.zeros((16, 16), dtype=int)
        for y, x in coords:
            grid_counts[y // 32, x // 32] += 1
            
        print("\nGrid counts:")
        for r_idx in range(16):
            row_str = []
            for c_idx in range(16):
                count = grid_counts[r_idx, c_idx]
                if count == 0:
                    row_str.append("  . ")
                else:
                    row_str.append(f"{count:3d} ")
            print("".join(row_str))

if __name__ == "__main__":
    main()
