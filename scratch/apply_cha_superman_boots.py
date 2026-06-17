def main():
    # 1. Modifier LaraVariants.ts
    path_ts = "src/features/scene/LaraVariants.ts"
    with open(path_ts, 'r', encoding='utf-8') as f:
        content_ts = f.read()
        
    # Bloc EYE COLORING à cibler
    target_eyes_ts = """        // EYE COLORING
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
        
    replacement_eyes_ts = target_eyes_ts + """

        // TEXTURE REPLACEMENTS FOR CHA (SUPERMAN TOP, RED BOOTS, GOLDEN SOCKS)
        const isShirt = matName.includes('shirt');
        const isBoot = matName.includes('boot');
        if (isCha) {
           if (isShirt) {
              const loader = new THREE.TextureLoader();
              const shirtTex = loader.load('media/textures/8019_cha.png');
              shirtTex.flipY = false;
              shirtTex.colorSpace = THREE.SRGBColorSpace;
              mat.map = shirtTex;
              mat.needsUpdate = true;
           }
           if (isBoot) {
              const loader = new THREE.TextureLoader();
              const bootsTex = loader.load('media/textures/8016_cha.png');
              bootsTex.flipY = false;
              bootsTex.colorSpace = THREE.SRGBColorSpace;
              mat.map = bootsTex;
              mat.needsUpdate = true;
           }
        }"""
        
    if target_eyes_ts in content_ts:
        content_ts = content_ts.replace(target_eyes_ts, replacement_eyes_ts)
        print("LaraVariants.ts (yeux/textures) modifié (LF)")
    elif target_eyes_ts.replace('\n', '\r\n') in content_ts:
        content_ts = content_ts.replace(target_eyes_ts.replace('\n', '\r\n'), replacement_eyes_ts.replace('\n', '\r\n'))
        print("LaraVariants.ts (yeux/textures) modifié (CRLF)")
    else:
        print("ERREUR : Impossible d'ajouter le bloc textures dans LaraVariants.ts")
        
    # Modifier shouldColor
    target_should_color_ts = "const shouldColor = !isSkin && !isEye && !isLash && !isMouth && !isHair && !isBuckle;"
    replacement_should_color_ts = "const shouldColor = !isSkin && !isEye && !isLash && !isMouth && !isHair && !isBuckle && !(isCha && (isShirt || isBoot));"
    
    if target_should_color_ts in content_ts:
        content_ts = content_ts.replace(target_should_color_ts, replacement_should_color_ts)
        print("LaraVariants.ts (shouldColor) modifié")
    else:
        print("Avertissement : shouldColor target non trouvée dans LaraVariants.ts, recherche avec espaces...")
        # Fallback si l'indentation ou le contenu diffère
        content_ts = content_ts.replace("!isSkin && !isEye && !isLash && !isMouth && !isHair && !isBuckle", "!isSkin && !isEye && !isLash && !isMouth && !isHair && !isBuckle && !(isCha && (isShirt || isBoot))")
        print("LaraVariants.ts (shouldColor) modifié via fallback")
        
    with open(path_ts, 'w', encoding='utf-8') as f:
        f.write(content_ts)
        
    # 2. Modifier red-lara.html
    path_html = "red-lara.html"
    with open(path_html, 'r', encoding='utf-8') as f:
        content_html = f.read()
        
    # Bloc EYE COLORING dans HTML
    target_eyes_html = """          // EYE COLORING
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
          
    replacement_eyes_html = target_eyes_html + """

          // TEXTURE REPLACEMENTS FOR CHA (SUPERMAN TOP, RED BOOTS, GOLDEN SOCKS)
          const isShirt = matName.includes('shirt');
          const isBoot = matName.includes('boot');
          if (isCha) {
             if (isShirt) {
                const loader = new THREE.TextureLoader();
                const shirtTex = loader.load('media/textures/8019_cha.png');
                shirtTex.flipY = false;
                shirtTex.colorSpace = THREE.SRGBColorSpace;
                mat.map = shirtTex;
                mat.needsUpdate = true;
             }
             if (isBoot) {
                const loader = new THREE.TextureLoader();
                const bootsTex = loader.load('media/textures/8016_cha.png');
                bootsTex.flipY = false;
                bootsTex.colorSpace = THREE.SRGBColorSpace;
                mat.map = bootsTex;
                mat.needsUpdate = true;
             }
          }"""
          
    if target_eyes_html in content_html:
        content_html = content_html.replace(target_eyes_html, replacement_eyes_html)
        print("red-lara.html (yeux/textures) modifié (LF)")
    elif target_eyes_html.replace('\n', '\r\n') in content_html:
        content_html = content_html.replace(target_eyes_html.replace('\n', '\r\n'), replacement_eyes_html.replace('\n', '\r\n'))
        print("red-lara.html (yeux/textures) modifié (CRLF)")
    else:
        print("ERREUR : Impossible d'ajouter le bloc textures dans red-lara.html")
        
    # Modifier shouldColor dans HTML
    target_should_color_html = "const shouldColor = !isSkin && !isEye && !isLash && !isMouth && !isHair;"
    replacement_should_color_html = "const shouldColor = !isSkin && !isEye && !isLash && !isMouth && !isHair && !(isCha && (isShirt || isBoot));"
    
    if target_should_color_html in content_html:
        content_html = content_html.replace(target_should_color_html, replacement_should_color_html)
        print("red-lara.html (shouldColor) modifié")
    else:
        print("Avertissement : shouldColor target non trouvée dans red-lara.html, recherche avec espaces...")
        content_html = content_html.replace("!isSkin && !isEye && !isLash && !isMouth && !isHair", "!isSkin && !isEye && !isLash && !isMouth && !isHair && !(isCha && (isShirt || isBoot))")
        print("red-lara.html (shouldColor) modifié via fallback")
        
    with open(path_html, 'w', encoding='utf-8') as f:
        f.write(content_html)

if __name__ == "__main__":
    main()
