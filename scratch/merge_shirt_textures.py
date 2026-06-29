from PIL import Image
import numpy as np

def merge():
    # Load first clean shirt (has perfect front, but still has back shadow)
    img_v1 = Image.open("/home/dinatih/.gemini/antigravity-cli/brain/da5a4563-0aae-47c2-ba9a-4b30ddb38d3d/clean_shirt_1782750965752.jpg").convert('RGBA')
    # Load second clean shirt (has clean back, but smudged front straps)
    img_v2 = Image.open("/home/dinatih/.gemini/antigravity-cli/brain/da5a4563-0aae-47c2-ba9a-4b30ddb38d3d/clean_shirt_v2_1782751294807.jpg").convert('RGBA')
    
    data_v1 = np.array(img_v1)
    data_v2 = np.array(img_v2)
    h, w, _ = data_v1.shape
    
    merged_data = data_v2.copy()
    
    # We want to restore the front shirt and shoulder straps area from v1.
    # The front shirt is in x >= 180 and y >= 220.
    # The gloves/hands at the bottom are also in that region, but they are unchanged in both.
    # Let's copy v1 to merged_data for x >= 180 and y >= 160 (to include the shoulder straps at the top-right front area).
    for y in range(h):
        for x in range(w):
            # Front shirt region
            if x >= 180 and y >= 150:
                merged_data[y, x] = data_v1[y, x]
                
    merged_img = Image.fromarray(merged_data)
    merged_img.save("/home/dinatih/.gemini/antigravity-cli/brain/da5a4563-0aae-47c2-ba9a-4b30ddb38d3d/clean_shirt_merged.png")
    print("Merged shirt texture saved.")

merge()
