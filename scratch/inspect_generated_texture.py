from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8016_cha.png"
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img)
    h, w, _ = arr.shape
    
    # Let's count how many pixels are red vs golden
    # Golden pixels have high R, high G, low B (e.g. G > 100, B < 80, R > 150)
    # Red pixels have high R, low G, low B (e.g. R > 150, G < 60, B < 60)
    red_mask = (arr[:, :, 0] > 120) & (arr[:, :, 1] < 70) & (arr[:, :, 2] < 70)
    gold_mask = (arr[:, :, 0] > 120) & (arr[:, :, 1] > 100) & (arr[:, :, 2] < 80)
    
    print(f"Texture image size: {w}x{h}")
    print(f"Red pixels found: {np.sum(red_mask)}")
    print(f"Golden pixels found: {np.sum(gold_mask)}")
    
    # Print a 16x16 grid of what color dominates each cell: 'R' for red, 'G' for gold, '.' for background/other
    print("\nDominant color grid (16x16):")
    for r in range(16):
        row_str = []
        for c in range(16):
            cell_red = np.sum(red_mask[r*32:(r+1)*32, c*32:(c+1)*32])
            cell_gold = np.sum(gold_mask[r*32:(r+1)*32, c*32:(c+1)*32])
            
            if cell_red > 100 and cell_red > cell_gold:
                row_str.append(" R ")
            elif cell_gold > 100 and cell_gold > cell_red:
                row_str.append(" G ")
            else:
                row_str.append(" . ")
        print("".join(row_str))

if __name__ == "__main__":
    main()
