from PIL import Image, ImageDraw
import colorsys

def main():
    width, height = 512, 512
    img = Image.new('RGB', (width, height), color='black')
    draw = ImageDraw.Draw(img)
    
    grid_size = 16
    cell_w = width // grid_size
    cell_h = height // grid_size
    
    for row in range(grid_size):
        for col in range(grid_size):
            # Compute a unique HSV color for each cell
            hue = (row * grid_size + col) / (grid_size * grid_size)
            r, g, b = colorsys.hsv_to_rgb(hue, 0.8, 0.9)
            r, g, b = int(r * 255), int(g * 255), int(b * 255)
            
            # Draw cell background
            x0 = col * cell_w
            y0 = row * cell_h
            x1 = (col + 1) * cell_w
            y1 = (row + 1) * cell_h
            draw.rectangle([x0, y0, x1, y1], fill=(r, g, b))
            
            # Draw cell border
            draw.rectangle([x0, y0, x1, y1], outline='black')
            
            # Draw text row/col
            text = f"{row},{col}"
            # Draw a small label in the center of the cell
            draw.text((x0 + 2, y0 + 10), text, fill='white')
            
    img.save("public/media/textures/8016_cha.png")
    print("Calibration grid written to public/media/textures/8016_cha.png")

if __name__ == "__main__":
    main()
