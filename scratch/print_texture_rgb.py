from PIL import Image
import numpy as np

def main():
    img_path = "public/media/textures/8016_cha.png"
    img = Image.open(img_path).convert('RGB')
    arr = np.array(img)
    
    # Socks area: Row 13..15, Col 7..13 (approx Y=[416, 512], X=[224, 448])
    # Let's inspect Row 13, Col 8 (Y=432, X=272)
    socks_pixel = arr[432, 272]
    print(f"Socks region center pixel (Y=432, X=272): RGB={socks_pixel}")
    
    # Boots area: Row 4..6, Col 1..3 (approx Y=[128, 224], X=[32, 128])
    # Let's inspect Row 4, Col 2 (Y=144, X=80)
    boots_pixel = arr[144, 80]
    print(f"Boots region center pixel (Y=144, X=80): RGB={boots_pixel}")
    
    # Let's print the average color of all pixels in the image that are golden (socks)
    # vs red (boots)
    # Socks pixels: R > 150, G > 120, B < 80
    # Boots pixels: R > 150, G < 60, B < 60
    socks_mask = (arr[:, :, 0] > 150) & (arr[:, :, 1] > 120) & (arr[:, :, 2] < 80)
    boots_mask = (arr[:, :, 0] > 150) & (arr[:, :, 1] < 60) & (arr[:, :, 2] < 60)
    
    print(f"Total golden/socks pixels in texture: {np.sum(socks_mask)}")
    if np.sum(socks_mask) > 0:
        print(f"  Avg Golden RGB: {np.mean(arr[socks_mask], axis=0).astype(int)}")
        
    print(f"Total red/boots pixels in texture: {np.sum(boots_mask)}")
    if np.sum(boots_mask) > 0:
        print(f"  Avg Red RGB: {np.mean(arr[boots_mask], axis=0).astype(int)}")

if __name__ == "__main__":
    main()
