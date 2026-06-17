from PIL import Image
import numpy as np

def main():
    img = Image.open("public/media/textures/8016_cha.png").convert('RGB')
    arr = np.array(img)
    
    # We want to check Row 12..15, Col 0..1
    # Y from 12*32 = 384 to 16*32 = 512
    # X from 0 to 2*32 = 64
    print("Sample pixels from Row 12..15, Col 0..1 in 8016_cha.png:")
    for row in range(12, 16):
        for col in range(2):
            y = row * 32 + 16
            x = col * 32 + 16
            rgb = arr[y, x]
            print(f"  Row={row}, Col={col} (Pixel X={x}, Y={y}): RGB={list(rgb)}")

if __name__ == "__main__":
    main()
