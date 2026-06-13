import * as THREE from 'three';

export type LaraVariant = 'native' | 'rosanna' | 'marissa' | 'delphina' | 'sara' | 'standard' | 'vivid';

export function applyLaraVariantStyles(model: THREE.Object3D, style: LaraVariant) {
  const isVivid = style === 'vivid';
  const isNative = style === 'native';
  const isRosanna = style === 'rosanna';
  const isMarissa = style === 'marissa';
  const isDelphina = style === 'delphina';
  const isSara = style === 'sara';
  const isRed = style === 'standard';

  model.traverse(node => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      const originalMat = mesh.material as THREE.Material | THREE.Material[];
      const matArray = Array.isArray(originalMat) ? originalMat : [originalMat];
      const meshName = mesh.name.toLowerCase();

      // HIDE eye2 by default
      const isEye2 = meshName.includes('eye2');
      if (isEye2) {
        mesh.visible = false;
      }

      // Clone materials to avoid sharing
      const clonedMats = matArray.map(m => m.clone() as THREE.MeshStandardMaterial);
      mesh.material = clonedMats.length === 1 ? clonedMats[0] : clonedMats;

      clonedMats.forEach(mat => {
        const matName = mat.name ? mat.name.toLowerCase() : "";

        const isHand = matName.includes('hand') || matName.includes('finger') || meshName.includes('hand') || meshName.includes('finger');
        const isSkin = matName.includes('skin') || matName.includes('face') || matName.includes('head') || matName.includes('body') || matName.includes('arm') || matName.includes('leg') || isHand;
        const isHair = matName.includes('hair') || matName.includes('pony') || matName.includes('braid') || meshName.includes('hair') || meshName.includes('pony') || meshName.includes('braid');
        const isLash = matName.includes('lash');
        const isEye  = matName.includes('eye') && !isLash;
        const isClothing = matName.includes('top') || matName.includes('shirt') || matName.includes('short') || matName.includes('pant') || matName.includes('boot') || matName.includes('gear') || matName.includes('bag') || matName.includes('pack') || matName.includes('belt') || matName.includes('holster');
        const isGlasses = matName.includes('lens') || meshName.includes('lens') || matName.includes('glass') || meshName.includes('glass') || matName.includes('frame') || meshName.includes('frame');
        const isMouth = matName.includes('mouth') || matName.includes('teeth') || matName.includes('tongue');

        // HIDE GLASSES for Delphina
        if (isDelphina && isGlasses && !isClothing && !isSkin && !isHair && !isEye && !isLash) {
           mesh.visible = false;
        }

        // UNIVERSAL FIX: Force OPAQUE by default
        mat.transparent = false;
        mat.depthWrite = true;
        mat.alphaTest = 0;

        if (isHair || isLash || matName.includes('trans')) {
          mat.transparent = false; // Force opaque cutout to avoid glass sorting issues
          mat.alphaTest = 0.5;
          mat.side = THREE.DoubleSide;
        }

        // HAIR COLORING
        if (isHair) {
          if (isDelphina) {
             mat.map = null; // Kill dark texture to see blonde
             mat.color.setHex(0xffe08a); 
             mat.emissive.setHex(0xffe08a);
             mat.emissiveIntensity = 0.2;
          } else if (isSara || isVivid || isRed) {
             mat.color.setHex(0xaa0000); // Red
             mat.emissiveIntensity = 0;
          }
        }

        // CLOTHING COLOR-IFICATION
        if (!isNative) {
          const isTop = matName.includes('top') || matName.includes('shirt') || matName.includes('tank') || meshName.includes('shirt');
          const isShorts = matName.includes('short') || matName.includes('pant') || meshName.includes('short');
          const isBackpack = matName.includes('backpack') || matName.includes('bag') || matName.includes('pack');
          const isOtherClothing = matName.includes('boot') || 
                                  matName.includes('gear') || matName.includes('holster') || matName.includes('belt') ||
                                  matName.includes('vest') || matName.includes('glove') || isBackpack;

          const shouldColor = !isSkin && !isEye && !isLash && !isMouth && !isHair;

          if (shouldColor) {
            let color = 0xcc0000; // Brighter default red
            let forceProcedural = false;
            
            if (isRosanna) {
               if (isShorts) {
                 color = 0xa2c4d9; // Blue jean
                 forceProcedural = true;
               }
               else if (isTop || isBackpack) color = 0xff2222; // Red
            } else if (isMarissa) {
               if (isShorts) {
                 color = 0xa2c4d9; 
                 forceProcedural = true;
               } else {
                 color = 0xffffff; 
                 forceProcedural = true; // Force procedural white to ignore teal texture
               }
            } else if (isDelphina) {
               color = 0xffffff; 
               forceProcedural = true; // Force all-white
            } else if (isSara) {
               color = 0x050505; // Deep black
               forceProcedural = true; // Avoid texture details for pure black look
            } else {
              // Standard / Vivid Red
              const redColor = isVivid ? 0xff0000 : 0xaa0000;
              const gearColor = isVivid ? 0x990000 : 0x660000;
              const isGear = matName.includes('gear') || matName.includes('holster') || matName.includes('boot');
              color = isGear ? gearColor : redColor;
            }

            const useMap = mat.map && !forceProcedural;

            if (useMap) {
               mat.color.setHex(color);
               if (isVivid) {
                 mat.emissive = new THREE.Color(color);
                 mat.emissiveIntensity = 0.35;
               }
               if (isRosanna && isTop) {
                  mat.roughness = 0.5;
                  mat.metalness = 0.0;
                  mat.emissive = new THREE.Color(0xff0000);
                  mat.emissiveIntensity = 0.01;

                  // BULLS 66 Text
                  const canvas = document.createElement('canvas');
                  canvas.width = 1024; canvas.height = 1024;
                  const ctx = canvas.getContext('2d');
                  if (ctx && mat.map && mat.map.image) {
                    ctx.drawImage(mat.map.image, 0, 0, 1024, 1024);
                    ctx.fillStyle = 'black'; ctx.textAlign = 'center';
                    
                    // X=700 comme demandé
                    ctx.font = '900 80px Graduate';
                    ctx.fillText('BULLS', 700, 750);
                    ctx.font = '900 150px Graduate';
                    ctx.fillText('66', 700, 870);
                    
                    const newTex = new THREE.CanvasTexture(canvas);
                    newTex.flipY = false;
                    newTex.colorSpace = THREE.SRGBColorSpace;
                    mat.map = newTex;
                    mat.needsUpdate = true;
                  }
               }
            } else {
              // Procedural material for jeans, white, black
              const newMat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: (isVivid || (isRosanna && isTop)) ? new THREE.Color(color === 0x050505 ? 0 : color) : new THREE.Color(0,0,0),
                emissiveIntensity: isVivid ? 0.5 : ((isRosanna && isTop) ? 0.05 : 0),
                roughness: (isRosanna || isMarissa || isDelphina || isSara) ? 0.9 : (isVivid ? 0.1 : 0.25),
                metalness: (isRosanna || isMarissa || isDelphina || isSara) ? 0.0 : (isVivid ? 0.3 : 0.1),
                transparent: false,
                alphaTest: isHair ? 0.5 : 0,
                depthWrite: true,
                name: style + 'Material',
                side: THREE.FrontSide
              });
              
              // We need to replace the material on the mesh directly
              if (clonedMats.length === 1) {
                  mesh.material = newMat;
              } else {
                  const idx = matArray.indexOf(originalMat as any);
                  if (idx !== -1) clonedMats[idx] = newMat;
                  mesh.material = clonedMats;
              }
            }
          }
        }
      });
    }
  });
}
