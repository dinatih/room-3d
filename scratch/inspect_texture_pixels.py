from PIL import Image

img_path = "/home/dinatih/Projects/room-3d/sources_backup/lara-croft-2026-rigged/textures/8019.png"
try:
    img = Image.open(img_path)
    w, h = img.size
    print(f"Loaded image size: {w}x{h}")
    
    # Let's inspect around UV (0.796, 0.262)
    u = 0.796
    v = 0.262
    px = int(u * w)
    py = int((1 - v) * h)
    
    print(f"Pixel at UV ({u}, {v}) -> ({px}, {py}):")
    for y in range(max(0, py-5), min(h, py+5)):
        row = []
        for x in range(max(0, px-5), min(w, px+5)):
            r, g, b, *a = img.getpixel((x, y))
            row.append(f"({r},{g},{b})")
        print("  " + " ".join(row))
except Exception as e:
    print("Error:", e)
