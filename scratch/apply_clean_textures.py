from PIL import Image
import os
import zipfile
import tempfile
import shutil

def main():
    clean_skin_jpg = "/home/dinatih/.gemini/antigravity-cli/brain/da5a4563-0aae-47c2-ba9a-4b30ddb38d3d/clean_skin_shoulders_1782751716726.jpg"
    clean_shirt_jpg = "/home/dinatih/.gemini/antigravity-cli/brain/da5a4563-0aae-47c2-ba9a-4b30ddb38d3d/clean_shirt_merged.png"
    clean_shorts_jpg = "/home/dinatih/.gemini/antigravity-cli/brain/da5a4563-0aae-47c2-ba9a-4b30ddb38d3d/clean_shorts_1782751307454.jpg"
    
    # 1. Resize and save as 512x512 PNGs
    print("Resizing clean textures...")
    img_skin = Image.open(clean_skin_jpg).resize((512, 512), Image.Resampling.LANCZOS)
    img_shirt = Image.open(clean_shirt_jpg).resize((512, 512), Image.Resampling.LANCZOS)
    img_shorts = Image.open(clean_shorts_jpg).resize((512, 512), Image.Resampling.LANCZOS)
    
    tmp_skin_png = "/tmp/clean_8001.png"
    tmp_shirt_png = "/tmp/clean_8019.png"
    tmp_shorts_png = "/tmp/clean_8031.png"
    
    img_skin.save(tmp_skin_png)
    img_shirt.save(tmp_shirt_png)
    img_shorts.save(tmp_shorts_png)
    
    # 2. Overwrite in lara-croft-2026-rigged textures
    rigged_dir = "/home/dinatih/Projects/room-3d/sources_backup/lara-croft-2026-rigged/textures"
    shutil.copyfile(tmp_skin_png, os.path.join(rigged_dir, "8001.png"))
    shutil.copyfile(tmp_shirt_png, os.path.join(rigged_dir, "8019.png"))
    shutil.copyfile(tmp_shorts_png, os.path.join(rigged_dir, "8031.png"))
    print("Updated textures in lara-croft-2026-rigged/textures/.")
    
    # 3. Update textures inside 07 Scoop bodysuit - Shorts.zip
    zip_path = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/07 Scoop bodysuit - Shorts.zip"
    print(f"Updating textures inside ZIP: {zip_path}...")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract existing files
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)
            
        # Overwrite textures with clean ones
        shutil.copyfile(tmp_skin_png, os.path.join(tmpdir, "8001.png"))
        shutil.copyfile(tmp_shirt_png, os.path.join(tmpdir, "8019.png"))
        shutil.copyfile(tmp_shorts_png, os.path.join(tmpdir, "8031.png"))
        
        # Zip everything back
        new_zip_path = zip_path + ".tmp"
        with zipfile.ZipFile(new_zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_ref:
            for root, dirs, files in os.walk(tmpdir):
                for file in files:
                    file_path = os.path.join(root, file)
                    zip_ref.write(file_path, file)
                    
        # Replace the original zip
        os.replace(new_zip_path, zip_path)
    
    print("ZIP file updated successfully.")

if __name__ == "__main__":
    main()
