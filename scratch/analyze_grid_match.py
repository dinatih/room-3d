from PIL import Image
import numpy as np

def main():
    crop_path = "/home/dinatih/.gemini/antigravity-cli/brain/6cf40343-2557-4162-94fd-538f17d2073c/cha_superman.png"
    crop_img = Image.open(crop_path).convert('RGB')
    crop_arr = np.array(crop_img)
    
    grid_img = Image.open("public/media/textures/8016_cha.png").convert('RGB')
    grid_arr = np.array(grid_img)
    
    # 16x16 grid color mapping
    grid_colors = {}
    for r in range(16):
        for c in range(16):
            cy = r * 32 + 16
            cx = c * 32 + 16
            grid_colors[(r, c)] = grid_arr[cy, cx]
            
    # Function to get matches in a region
    def get_matches(y_start, y_end):
        matches = {}
        for y in range(y_start, y_end + 1):
            for x in range(30, 90):
                pixel_rgb = crop_arr[y, x]
                
                # Check distance from bg
                if np.sum(np.abs(pixel_rgb - [26, 26, 31])) < 15:
                    continue
                    
                # Find closest grid cell
                best_cell = None
                min_dist = float('inf')
                for cell, cell_rgb in grid_colors.items():
                    dist = np.linalg.norm(pixel_rgb - cell_rgb)
                    if dist < min_dist:
                        min_dist = dist
                        best_cell = cell
                
                if min_dist < 80:
                    matches[best_cell] = matches.get(best_cell, 0) + 1
        return matches

    socks_matches = get_matches(164, 168)
    boots_matches = get_matches(169, 196)
    
    print("SOCKS MATCHES (Y=[164, 168]):")
    sorted_socks = sorted(socks_matches.items(), key=lambda x: x[1], reverse=True)
    for cell, count in sorted_socks[:15]:
        print(f"  Cell Row={cell[0]}, Col={cell[1]} | Count={count} | U_range=[{cell[1]/16.0:.3f}, {(cell[1]+1)/16.0:.3f}], V_range=[{1-(cell[0]+1)/16.0:.3f}, {1-cell[0]/16.0:.3f}]")
        
    print("\nBOOTS MATCHES (Y=[169, 196]):")
    sorted_boots = sorted(boots_matches.items(), key=lambda x: x[1], reverse=True)
    for cell, count in sorted_boots[:25]:
        print(f"  Cell Row={cell[0]}, Col={cell[1]} | Count={count} | U_range=[{cell[1]/16.0:.3f}, {(cell[1]+1)/16.0:.3f}], V_range=[{1-(cell[0]+1)/16.0:.3f}, {1-cell[0]/16.0:.3f}]")

if __name__ == "__main__":
    main()
