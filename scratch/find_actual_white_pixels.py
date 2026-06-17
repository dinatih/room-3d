from PIL import Image
import numpy as np

def main():
    img_path = "sources_backup/lara-croft-2026-rigged/textures/8016.png"
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img)
    h, w, _ = arr.shape
    
    # Check pixels where R, G, B are all > 100 and very close to each other (grey/white)
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    
    # Grey/white pattern
    mask = (r > 100) & (g > 100) & (b > 100) & (np.abs(r - g) < 8) & (np.abs(g - b) < 8)
    coords = np.argwhere(mask)
    
    print(f"Total grey/white pixels found in 8016.png: {len(coords)}")
    if len(coords) > 0:
        # Group them into contiguous vertical/horizontal boxes or display coordinates
        # Let's print the bounding box of these pixels
        y_min, x_min = coords.min(axis=0)
        y_max, x_max = coords.max(axis=0)
        print(f"Bounding box of all grey/white pixels: X=[{x_min}, {x_max}], Y=[{y_min}, {y_max}]")
        
        # Let's see the distribution in 16x16 grid
        grid_counts = np.zeros((16, 16), dtype=int)
        for y, x in coords:
            row = y // 32
            col = x // 32
            grid_counts[row, col] += 1
            
        print("\nGrid counts of grey/white pixels:")
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
