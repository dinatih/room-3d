from PIL import Image
import numpy as np

def inspect():
    img_8001 = Image.open("/home/dinatih/Projects/room-3d/sources_backup/lara-croft-2026-rigged/textures/8001.png")
    img_8019 = Image.open("/home/dinatih/Projects/room-3d/sources_backup/lara-croft-2026-rigged/textures/8019.png")
    print(f"8001.png shape: {img_8001.size}")
    print(f"8019.png shape: {img_8019.size}")
    
    # Save a temporary copy of these images in artifacts so we can check if needed, or analyze their color distributions
    # Let's count pixel colors to understand the dark strap colors.
    data_8001 = np.array(img_8001.convert('RGB'))
    data_8019 = np.array(img_8019.convert('RGB'))
    
    # Let's find dark pixels (holster strap) on the skin texture 8001.png
    # Skin is usually bright (R > 120, G > 80, B > 60).
    # A dark strap would have very low values, e.g., R < 60, G < 50, B < 40.
    dark_8001_count = 0
    for y in range(data_8001.shape[0]):
        for x in range(data_8001.shape[1]):
            r, g, b = data_8001[y, x]
            if r < 80 and g < 60 and b < 50:
                dark_8001_count += 1
    print(f"Dark pixels in 8001.png (potential holster strap): {dark_8001_count}")

inspect()
