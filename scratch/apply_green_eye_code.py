def main():
    # 1. Modifier LaraVariants.ts
    path_ts = "src/features/scene/LaraVariants.ts"
    with open(path_ts, 'r', encoding='utf-8') as f:
        content_ts = f.read()
        
    # Modifier la visibilité des lunettes (ajouter isCha)
    target_glasses_ts = """        // HIDE GLASSES for Delphina and Marissa
        if ((isDelphina || isMarissa) && isGlasses) {
           mat.visible = false;
        }"""
    replacement_glasses_ts = """        // HIDE GLASSES for Delphina, Marissa and Cha
        if ((isDelphina || isMarissa || isCha) && isGlasses) {
           mat.visible = false;
        }"""
        
    if target_glasses_ts in content_ts:
        content_ts = content_ts.replace(target_glasses_ts, replacement_glasses_ts)
        print("LaraVariants.ts (lunettes) modifié (LF)")
    elif target_glasses_ts.replace('\n', '\r\n') in content_ts:
        content_ts = content_ts.replace(target_glasses_ts.replace('\n', '\r\n'), replacement_glasses_ts.replace('\n', '\r\n'))
        print("LaraVariants.ts (lunettes) modifié (CRLF)")
    else:
        print("Avertissement : Cible lunettes non trouvée dans LaraVariants.ts, tentative avec fallback...")
        fallback = "(isDelphina || isMarissa)"
        if fallback in content_ts:
            content_ts = content_ts.replace(fallback, "(isDelphina || isMarissa || isCha)")
            print("LaraVariants.ts (lunettes) modifié via fallback")
            
    # Modifier le code de couleur des yeux
    target_eyes_ts = """        // EYE COLORING
        const isEyesMaterial = matName.includes('eyes') && !matName.includes('lash');
        if (isEyesMaterial && isDelphina) {
           const loader = new THREE.TextureLoader();
           const blueTex = loader.load('media/textures/8003_blue.png');
           blueTex.flipY = false;
           blueTex.colorSpace = THREE.SRGBColorSpace;
           mat.map = blueTex;
           mat.needsUpdate = true;
        }"""
        
    replacement_eyes_ts = """        // EYE COLORING
        const isEyesMaterial = matName.includes('eyes') && !matName.includes('lash');
        if (isEyesMaterial) {
           if (isDelphina) {
              const loader = new THREE.TextureLoader();
              const blueTex = loader.load('media/textures/8003_blue.png');
              blueTex.flipY = false;
              blueTex.colorSpace = THREE.SRGBColorSpace;
              mat.map = blueTex;
              mat.needsUpdate = true;
           } else if (isCha) {
              const loader = new THREE.TextureLoader();
              const greenTex = loader.load('media/textures/8003_green.png');
              greenTex.flipY = false;
              greenTex.colorSpace = THREE.SRGBColorSpace;
              mat.map = greenTex;
              mat.needsUpdate = true;
           }
        }"""
        
    if target_eyes_ts in content_ts:
        content_ts = content_ts.replace(target_eyes_ts, replacement_eyes_ts)
        print("LaraVariants.ts (yeux) modifié (LF)")
    elif target_eyes_ts.replace('\n', '\r\n') in content_ts:
        content_ts = content_ts.replace(target_eyes_ts.replace('\n', '\r\n'), replacement_eyes_ts.replace('\n', '\r\n'))
        print("LaraVariants.ts (yeux) modifié (CRLF)")
    else:
        print("ERREUR : Impossible de trouver le bloc yeux dans LaraVariants.ts")
        
    with open(path_ts, 'w', encoding='utf-8') as f:
        f.write(content_ts)
        
    # 2. Modifier red-lara.html
    path_html = "red-lara.html"
    with open(path_html, 'r', encoding='utf-8') as f:
        content_html = f.read()
        
    # Lunettes dans HTML
    target_glasses_html = """          // HIDE GLASSES for Delphina and Marissa
          if ((isDelphina || isMarissa) && isGlasses) {
             mat.visible = false;
          }"""
    replacement_glasses_html = """          // HIDE GLASSES for Delphina, Marissa and Cha
          if ((isDelphina || isMarissa || isCha) && isGlasses) {
             mat.visible = false;
          }"""
          
    if target_glasses_html in content_html:
        content_html = content_html.replace(target_glasses_html, replacement_glasses_html)
        print("red-lara.html (lunettes) modifié (LF)")
    elif target_glasses_html.replace('\n', '\r\n') in content_html:
        content_html = content_html.replace(target_glasses_html.replace('\n', '\r\n'), replacement_glasses_html.replace('\n', '\r\n'))
        print("red-lara.html (lunettes) modifié (CRLF)")
    else:
        print("Avertissement : Cible lunettes non trouvée dans red-lara.html, tentative avec fallback...")
        fallback_html = "(isDelphina || isMarissa)"
        if fallback_html in content_html:
            content_html = content_html.replace(fallback_html, "(isDelphina || isMarissa || isCha)")
            print("red-lara.html (lunettes) modifié via fallback")
            
    # Yeux dans HTML
    target_eyes_html = """          // EYE COLORING
          const isEyesMaterial = matName.includes('eyes') && !matName.includes('lash');
          if (isEyesMaterial && isDelphina) {
             const loader = new THREE.TextureLoader();
             const blueTex = loader.load('media/textures/8003_blue.png');
             blueTex.flipY = false;
             blueTex.colorSpace = THREE.SRGBColorSpace;
             mat.map = blueTex;
             mat.needsUpdate = true;
          }"""
          
    replacement_eyes_html = """          // EYE COLORING
          const isEyesMaterial = matName.includes('eyes') && !matName.includes('lash');
          if (isEyesMaterial) {
             if (isDelphina) {
                const loader = new THREE.TextureLoader();
                const blueTex = loader.load('media/textures/8003_blue.png');
                blueTex.flipY = false;
                blueTex.colorSpace = THREE.SRGBColorSpace;
                mat.map = blueTex;
                mat.needsUpdate = true;
             } else if (isCha) {
                const loader = new THREE.TextureLoader();
                const greenTex = loader.load('media/textures/8003_green.png');
                greenTex.flipY = false;
                greenTex.colorSpace = THREE.SRGBColorSpace;
                mat.map = greenTex;
                mat.needsUpdate = true;
             }
          }"""
          
    if target_eyes_html in content_html:
        content_html = content_html.replace(target_eyes_html, replacement_eyes_html)
        print("red-lara.html (yeux) modifié (LF)")
    elif target_eyes_html.replace('\n', '\r\n') in content_html:
        content_html = content_html.replace(target_eyes_html.replace('\n', '\r\n'), replacement_eyes_html.replace('\n', '\r\n'))
        print("red-lara.html (yeux) modifié (CRLF)")
    else:
        print("ERREUR : Impossible de trouver le bloc yeux dans red-lara.html")
        
    with open(path_html, 'w', encoding='utf-8') as f:
        f.write(content_html)

if __name__ == "__main__":
    main()
