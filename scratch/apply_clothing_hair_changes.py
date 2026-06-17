def main():
    path_ts = "src/features/scene/LaraVariants.ts"
    with open(path_ts, 'r', encoding='utf-8') as f:
        content_ts = f.read()
        
    target_hair_ts = """          } else if (isSara) {
             if (matName.includes('hair.classic')) {
                mat.map = null; // Kill dark texture to see red
                mat.color.setHex(0xff0000); // Red
                mat.emissive.setHex(0xff0000);
                mat.emissiveIntensity = 0.05;
             }
          } else if (isCha) {"""
           
    replacement_hair_ts = """          } else if (isSara) {
             if (matName.includes('hair.classic')) {
                mat.map = null; // Kill dark texture to see red
                mat.color.setHex(0xff0000); // Red
                mat.emissive.setHex(0xff0000);
                mat.emissiveIntensity = 0.05;
             } else {
                mat.map = null;
                mat.color.setHex(0x0a0a0a); // Deep black
                mat.emissive.setHex(0x000000);
                mat.emissiveIntensity = 0;
             }
          } else if (isCha) {"""
           
    if target_hair_ts in content_ts:
        content_ts = content_ts.replace(target_hair_ts, replacement_hair_ts)
        print("LaraVariants.ts (cheveux) modifié avec succès (LF)")
    elif target_hair_ts.replace('\n', '\r\n') in content_ts:
        content_ts = content_ts.replace(target_hair_ts.replace('\n', '\r\n'), replacement_hair_ts.replace('\n', '\r\n'))
        print("LaraVariants.ts (cheveux) modifié avec succès (CRLF)")
    else:
        print("ERREUR : Toujours impossible de trouver la cible.")
        
    with open(path_ts, 'w', encoding='utf-8') as f:
        f.write(content_ts)

if __name__ == "__main__":
    main()
