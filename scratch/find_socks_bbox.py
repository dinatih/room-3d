from PIL import Image
import numpy as np

def main():
    crop_path = "/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/cha_superman.png"
    img = Image.open(crop_path).convert('RGB')
    arr = np.array(img)
    h, w, _ = arr.shape
    
    # Background color is around [26, 26, 31]
    bg_color = np.array([26, 26, 31])
    
    # Find pixels that differ from background by at least 15 in any channel
    diff = np.max(np.abs(arr - bg_color), axis=2)
    foreground = np.argwhere(diff > 15)
    
    if len(foreground) > 0:
        y_min, x_min = foreground.min(axis=0)
        y_max, x_max = foreground.max(axis=0)
        print(f"Foreground bounding box: X=[{x_min}, {x_max}], Y=[{y_min}, {y_max}]")
        
        # Print average color of foreground pixels for each row where foreground is present
        for y in range(y_min, y_max + 1):
            row_foreground_indices = foreground[foreground[:, 0] == y]
            if len(row_foreground_indices) > 5:
                row_pixels = arr[y, row_foreground_indices[:, 1]]
                avg_col = np.mean(row_pixels, axis=0)
                print(f"Row Y={y} (original Y={y+300}) | Width={len(row_pixels)} | Avg RGB={avg_col.astype(int)}")
    else:
        print("No foreground found!")

if __name__ == "__main__":
    main()
