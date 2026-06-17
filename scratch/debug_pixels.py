from PIL import Image
import numpy as np

def main():
    crop_path = "/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/cha_superman.png"
    img = Image.open(crop_path)
    print("Cropped Image Size:", img.size)
    arr = np.array(img.convert('RGB'))
    
    # Find bounding box of non-dark pixels (R+G+B > 60)
    brightness = np.sum(arr, axis=2)
    non_dark = np.argwhere(brightness > 60)
    
    if len(non_dark) > 0:
        y_min, x_min = non_dark.min(axis=0)
        y_max, x_max = non_dark.max(axis=0)
        print(f"Non-dark bounding box: X=[{x_min}, {x_max}], Y=[{y_min}, {y_max}]")
        
        # Let's print the average colors at different heights
        # From y_min to y_max, every 20 pixels
        for y in range(y_min, y_max + 1, 20):
            row_slice = arr[y, x_min:x_max+1]
            non_bg = row_slice[np.sum(row_slice, axis=1) > 60]
            if len(non_bg) > 0:
                avg_col = np.mean(non_bg, axis=0)
                print(f"Y={y} | Avg Color={avg_col.astype(int)}")
    else:
        print("No non-dark pixels found!")

if __name__ == "__main__":
    main()
