from PIL import Image
import numpy as np

def main():
    img_path = "sources_backup/lara-croft-2026-rigged/textures/8016.png"
    img = Image.open(img_path).convert('RGBA')
    data = np.array(img)
    
    # Let's inspect the candidate regions:
    # We want to find white/grey plissé fabric.
    # Region 1: Row 0-2, Col 0-3 (Top-left)
    # Row 0-2 -> Y=[0, 96], Col 0-3 -> X=[0, 128]
    # Region 2: Row 13-15, Col 6-14 (Bottom-right-ish)
    # Row 13-15 -> Y=[416, 512], Col 6-14 -> X=[192, 480]
    # Region 3: Row 5-8, Col 13-15 (Middle-right)
    # Row 5-8 -> Y=[160, 288], Col 13-15 -> X=[416, 512]
    
    regions = [
        ("Top-left (Y=[0, 96], X=[0, 128])", 0, 96, 0, 128),
        ("Bottom-right-ish (Y=[416, 512], X=[192, 480])", 416, 512, 192, 480),
        ("Middle-right (Y=[160, 288], X=[416, 512])", 160, 288, 416, 512)
    ]
    
    for name, y_min, y_max, x_min, x_max in regions:
        region_data = data[y_min:y_max, x_min:x_max]
        r = region_data[:, :, 0]
        g = region_data[:, :, 1]
        b = region_data[:, :, 2]
        a = region_data[:, :, 3]
        
        # White/grey pixels check: r > 180, g > 180, b > 180, and low saturation (difference < 15)
        white_mask = (a > 200) & (r > 180) & (g > 180) & (b > 180) & (np.abs(r - g) < 15) & (np.abs(g - b) < 15)
        num_whites = np.sum(white_mask)
        avg_color = [np.mean(r), np.mean(g), np.mean(b)]
        
        print(f"Region {name}:")
        print(f"  Average color: R={avg_color[0]:.1f}, G={avg_color[1]:.1f}, B={avg_color[2]:.1f}")
        print(f"  Number of white/grey pixels (r/g/b > 180): {num_whites} out of {region_data.size // 4}")

if __name__ == "__main__":
    main()
