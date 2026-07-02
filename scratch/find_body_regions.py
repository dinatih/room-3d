from PIL import Image
import os

def split_grid():
    img_path = "/home/dinatih/Projects/room-3d/sources_backup/lara-croft-2026-rigged/textures/8001.png"
    img = Image.open(img_path).convert('RGB')
    w, h = img.size
    
    # Save a 4x4 grid of crops to identify where the shoulders/armpits are
    grid_size = 4
    cw = w // grid_size
    ch = h // grid_size
    
    out_dir = "/home/dinatih/.gemini/antigravity-cli/brain/da5a4563-0aae-47c2-ba9a-4b30ddb38d3d/grid_crops"
    os.makedirs(out_dir, exist_ok=True)
    
    for row in range(grid_size):
        for col in range(grid_size):
            left = col * cw
            top = row * ch
            right = left + cw
            bottom = top + ch
            
            crop = img.crop((left, top, right, bottom))
            crop.save(os.path.join(out_dir, f"crop_r{row}_c{col}.png"))
            
    print("Saved 4x4 grid of crops to grid_crops/ folder.")

split_grid()
