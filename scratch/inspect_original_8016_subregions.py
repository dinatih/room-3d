from PIL import Image
import numpy as np

def main():
    img_path = "sources_backup/lara-croft-2026-rigged/textures/8016.png"
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img)
    
    # Grid cell helper (cell is 32x32)
    def print_cell_info(name, row, col):
        y0, y1 = row * 32, (row + 1) * 32
        x0, x1 = col * 32, (col + 1) * 32
        cell_pixels = arr[y0:y1, x0:x1]
        avg = np.mean(cell_pixels, axis=(0,1))
        min_val = np.min(cell_pixels, axis=(0,1))
        max_val = np.max(cell_pixels, axis=(0,1))
        print(f"{name} (Row={row}, Col={col} | Y=[{y0},{y1}], X=[{x0},{x1}]):")
        print(f"  Avg: R={avg[0]:.1f}, G={avg[1]:.1f}, B={avg[2]:.1f}")
        print(f"  Min: R={min_val[0]}, G={min_val[1]}, B={min_val[2]}")
        print(f"  Max: R={max_val[0]}, G={max_val[1]}, B={max_val[2]}")

    print("--- Candidate Region A: Top-left ---")
    for r in range(3):
        for c in range(4):
            print_cell_info(f"Top-Left R{r}C{c}", r, c)
            
    print("\n--- Candidate Region B: Bottom-right-ish ---")
    for r in range(13, 16):
        for c in range(7, 15):
            print_cell_info(f"Bottom-Right R{r}C{c}", r, c)

    print("\n--- Candidate Region C: Far-right / Column 15 ---")
    for r in range(16):
        print_cell_info(f"Col 15 R{r}", r, 15)

if __name__ == "__main__":
    main()
