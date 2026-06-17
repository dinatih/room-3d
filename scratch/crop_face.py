from PIL import Image

def main():
    screenshot_path = "/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/red_lara_screenshot.png"
    img = Image.open(screenshot_path)
    
    # Découpage complet de Cha de la tête aux pieds
    # Largeur : x de 880 à 1000 (120px)
    # Hauteur : y de 300 à 720 (420px)
    cha_box = img.crop((880, 300, 1000, 720))
    cha_box.save("/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/cha_superman.png")
    print("Cha Superman découpée en entier.")

if __name__ == "__main__":
    main()
