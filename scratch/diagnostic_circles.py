from PIL import Image, ImageDraw

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    draw = ImageDraw.Draw(img)
    
    # Nos centres et notre rayon
    centers = [(78, 339), (178, 361)]
    R = 40
    
    # Dessinons les cercles en rouge pour validation visuelle
    for cx, cy in centers:
        draw.ellipse([cx - R, cy - R, cx + R, cy + R], outline="red", width=2)
        
    img.save("scratch/diagnostic_circles.png")
    print("Image de diagnostic sauvegardée dans scratch/diagnostic_circles.png")

if __name__ == "__main__":
    main()
