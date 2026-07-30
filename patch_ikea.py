import re

with open('src/features/scene/Placements.tsx', 'r') as f:
    code = f.read()

ikea_items = [
    'Kallax', 'CuisineGroup', 'BathroomCabinet', 'Toilet', 'Tradfri', 'Shower', 'Vasque', 'WaterHeater', 
    'GrassRug', 'Closet', 'Utaker', 'Bollsidan', 'Fniss', 'Lack', 'LampOla', 'Mackapar', 'Mulig', 
    'Smorkull', 'Grejig', 'Vihals', 'Drona', 'Lillhavet'
]

lines = code.split('\n')
for i in range(len(lines)):
    has_ikea = False
    for j in range(i, min(i+4, len(lines))):
        if any(item in lines[j] for item in ikea_items):
            has_ikea = True
            break
    
    if has_ikea and 'userData={{ animUnit: true' in lines[i] and 'isIkea: true' not in lines[i]:
        lines[i] = lines[i].replace('userData={{ animUnit: true', 'userData={{ animUnit: true, isIkea: true')

with open('src/features/scene/Placements.tsx', 'w') as f:
    f.write('\n'.join(lines))
