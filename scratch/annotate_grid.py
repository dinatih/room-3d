from PIL import Image, ImageDraw

def main():
    img_path = "public/media/textures/8003.png"
    img = Image.open(img_path).convert('RGBA')
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    # Dessiner une grille jaune tous les 32 pixels
    for x in range(0, width, 32):
        draw.line([(x, 0), (x, height)], fill="yellow", width=1)
        if x % 64 == 0:
            draw.text((x + 2, 10), str(x), fill="red")
            
    for y in range(0, height, 32):
        draw.line([(0, y), (width, y)], fill="yellow", width=1)
        if y % 64 == 0:
            draw.text((10, y + 2), str(y), fill="red")
            
    img.save("scratch/annotated_grid.png")
    print("Grille dessinée et sauvegardée dans scratch/annotated_grid.png")

if __name__ == "__main__":
    main()
