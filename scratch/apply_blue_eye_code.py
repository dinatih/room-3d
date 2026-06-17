def main():
    # 1. Modifier LaraVariants.ts
    path_ts = "src/features/scene/LaraVariants.ts"
    with open(path_ts, 'r', encoding='utf-8') as f:
        content_ts = f.read()
        
    # Remplaçons la double ligne vide avant CLOTHING COLOR-IFICATION par le code des yeux bleus
    target_ts = """        }\n\n\n        // CLOTHING COLOR-IFICATION"""
    replacement_ts = """        }

        // EYE COLORING
        const isEyesMaterial = matName.includes('eyes') && !matName.includes('lash');
        if (isEyesMaterial && isDelphina) {
           const loader = new THREE.TextureLoader();
           const blueTex = loader.load('media/textures/8003_blue.png');
           blueTex.flipY = false;
           blueTex.colorSpace = THREE.SRGBColorSpace;
           mat.map = blueTex;
           mat.needsUpdate = true;
        }

        // CLOTHING COLOR-IFICATION"""
        
    if target_ts in content_ts:
        content_ts = content_ts.replace(target_ts, replacement_ts)
        print("LaraVariants.ts modifié (format LF)")
    elif target_ts.replace('\n', '\r\n') in content_ts:
        content_ts = content_ts.replace(target_ts.replace('\n', '\r\n'), replacement_ts.replace('\n', '\r\n'))
        print("LaraVariants.ts modifié (format CRLF)")
    else:
        # Fallback de remplacement
        fallback_target = "// CLOTHING COLOR-IFICATION"
        if fallback_target in content_ts:
            eye_code = """// EYE COLORING
        const isEyesMaterial = matName.includes('eyes') && !matName.includes('lash');
        if (isEyesMaterial && isDelphina) {
           const loader = new THREE.TextureLoader();
           const blueTex = loader.load('media/textures/8003_blue.png');
           blueTex.flipY = false;
           blueTex.colorSpace = THREE.SRGBColorSpace;
           mat.map = blueTex;
           mat.needsUpdate = true;
        }

        // CLOTHING COLOR-IFICATION"""
            content_ts = content_ts.replace(fallback_target, eye_code)
            print("LaraVariants.ts modifié via fallback")
        else:
            print("ERREUR : Impossible de trouver la cible dans LaraVariants.ts")
            
    with open(path_ts, 'w', encoding='utf-8') as f:
        f.write(content_ts)
        
    # 2. Modifier red-lara.html
    path_html = "red-lara.html"
    with open(path_html, 'r', encoding='utf-8') as f:
        content_html = f.read()
        
    # Remplaçons la double ligne vide avant CLOTHING COLOR-IFICATION
    target_html = """          }\n\n\n          // CLOTHING COLOR-IFICATION"""
    replacement_html = """          }

          // EYE COLORING
          const isEyesMaterial = matName.includes('eyes') && !matName.includes('lash');
          if (isEyesMaterial && isDelphina) {
             const loader = new THREE.TextureLoader();
             const blueTex = loader.load('media/textures/8003_blue.png');
             blueTex.flipY = false;
             blueTex.colorSpace = THREE.SRGBColorSpace;
             mat.map = blueTex;
             mat.needsUpdate = true;
          }

          // CLOTHING COLOR-IFICATION"""
          
    if target_html in content_html:
        content_html = content_html.replace(target_html, replacement_html)
        print("red-lara.html modifié (format LF)")
    elif target_html.replace('\n', '\r\n') in content_html:
        content_html = content_html.replace(target_html.replace('\n', '\r\n'), replacement_html.replace('\n', '\r\n'))
        print("red-lara.html modifié (format CRLF)")
    else:
        fallback_html = "// CLOTHING COLOR-IFICATION"
        if fallback_html in content_html:
            eye_code_html = """// EYE COLORING
          const isEyesMaterial = matName.includes('eyes') && !matName.includes('lash');
          if (isEyesMaterial && isDelphina) {
             const loader = new THREE.TextureLoader();
             const blueTex = loader.load('media/textures/8003_blue.png');
             blueTex.flipY = false;
             blueTex.colorSpace = THREE.SRGBColorSpace;
             mat.map = blueTex;
             mat.needsUpdate = true;
          }

          // CLOTHING COLOR-IFICATION"""
            content_html = content_html.replace(fallback_html, eye_code_html)
            print("red-lara.html modifié via fallback")
        else:
            print("ERREUR : Impossible de trouver la cible dans red-lara.html")
            
    with open(path_html, 'w', encoding='utf-8') as f:
        f.write(content_html)

if __name__ == "__main__":
    main()
