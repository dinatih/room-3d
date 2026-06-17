from PIL import Image
import numpy as np

def main():
    screenshot_path = "/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/red_lara_screenshot.png"
    img = Image.open(screenshot_path)
    
    # Native model is at offset -3 (left-most, around X=150 to 270 on screen)
    # Let's crop from X=150 to X=270, Y=450 to Y=720 (legs and feet)
    native_box = img.crop((150, 450, 270, 720))
    native_box.save("/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/native_legs.png")
    print("Native legs cropped and saved to native_legs.png")
    
    # Print the average colors by row in this crop to see what colors are present in the leg region
    arr = np.array(native_box.convert('RGB'))
    bg_color = np.array([26, 26, 31])
    diff = np.max(np.abs(arr - bg_color), axis=2)
    foreground = np.argwhere(diff > 15)
    
    if len(foreground) > 0:
        y_min, x_min = foreground.min(axis=0)
        y_max, x_max = foreground.max(axis=0)
        
        # Profile the rows in the bottom half of the crop (legs/boots area)
        for y in range(y_min + 100, y_max + 1, 5):
            row_foreground_indices = foreground[foreground[:, 0] == y]
            if len(row_foreground_indices) > 3:
                row_pixels = arr[y, row_foreground_indices[:, 1]]
                avg_col = np.mean(row_pixels, axis=0)
                print(f"Row Y={y} (original Y={y+450}) | Avg RGB={avg_col.astype(int)}")

if __name__ == "__main__":
    main()
