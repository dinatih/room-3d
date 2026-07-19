import * as THREE from 'three';

export type LaraVariant = 'native' | 'rosanna' | 'marissa' | 'delphina' | 'sara' | 'cha' | 'vivid' | 'sabira' | 'safa' | 'rajaa';

const textureCache: Record<string, THREE.Texture> = {};

function getTexture(url: string): THREE.Texture {
  if (!textureCache[url]) {
    const tex = new THREE.TextureLoader().load(url);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[url] = tex;
  }
  return textureCache[url];
}

export function applyLaraVariantStyles(model: THREE.Object3D, style?: LaraVariant) {
  if (!style) return;
  const isVivid = style === 'vivid';
  const isNative = style === 'native';
  const isRosanna = style === 'rosanna';
  const isMarissa = style === 'marissa';
  const isDelphina = style === 'delphina';
  const isSara = style === 'sara';
  const isCha = style === 'cha';
  const isSabira = style === 'sabira';
  const isSafa = style === 'safa';
  const isRajaa = style === 'rajaa';

  model.traverse(node => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      const originalMat = mesh.material as THREE.Material | THREE.Material[];
      const matArray = Array.isArray(originalMat) ? originalMat : [originalMat];
      const meshName = mesh.name.toLowerCase();

      // Show all eye meshes to see if it fixes the black sockets

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

        const isGlasses = matName.includes('lens') || matName.includes('glass') || matName.includes('frame');
        const isMouth = matName.includes('mouth') || matName.includes('teeth') || matName.includes('tongue');

        // HIDE GLASSES for Delphina, Marissa and Cha
        if ((isDelphina || isMarissa || isCha) && isGlasses) {
           mat.visible = false;
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
          } else if (isVivid) {
             mat.color.setHex(0xff0000);
             mat.emissive.setHex(0xff0000);
             mat.emissiveIntensity = 0.1;
          } else if (isSara) {
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
          } else if (isCha) {
             mat.map = null; // Kill dark texture to see blonde-chatain
             mat.color.setHex(0xbc9c74); // Blonde-chatain
             mat.emissive.setHex(0xbc9c74);
             mat.emissiveIntensity = 0.05;
          }
        }

        // EYE COLORING
        // Both 'eyes' and 'eye2' might be transparent decals over a base eyeball.
        if (isEye) {
           mat.visible = true; // Ensure both are visible in case one is the sclera and one is the pupil
           mat.color.setHex(0xffffff); // Ensure base color is white so texture shows
           mat.emissive.setHex(0x000000);
           mat.metalness = 0;
           mat.roughness = 0.5;
           mat.transparent = true;
           mat.alphaTest = 0.5; // Crucial for decal materials to not render black backgrounds!
           if ('transmission' in mat) (mat as any).transmission = 0;
           
           if (isDelphina) {
              mat.map = getTexture('media/textures/8003_blue.png');
           } else if (isCha) {
              mat.map = getTexture('media/textures/8003_green.png');
           } else {
              // Default brown texture for all other Laras
              mat.map = getTexture('media/textures/8003.png');
           }
           mat.needsUpdate = true;
        }

        // TEXTURE REPLACEMENTS FOR CHA (SUPERMAN TOP, RED BOOTS, GOLDEN SOCKS) & RAJAA (CAMOUFLAGE)
        const isShirt = matName.toLowerCase().includes('shirt');
        const isBoot = matName.toLowerCase().includes('boot');
        const isShorts = matName.toLowerCase().includes('short') || matName.toLowerCase().includes('pant') || meshName.toLowerCase().includes('short');
        if (isCha) {
           if (isShirt) {
              mat.map = getTexture('media/textures/8019_cha.png');
              mat.needsUpdate = true;
           }
           if (isBoot) {
              mat.map = getTexture('media/textures/8016_cha.png');
              mat.needsUpdate = true;
           }
        }
        if (isRajaa) {
           if (isShirt) {
              mat.map = getTexture('media/textures/8019_rajaa.png');
              mat.needsUpdate = true;
           }
           if (isShorts) {
              mat.map = getTexture('media/textures/8031_rajaa.png');
              mat.needsUpdate = true;
           }
        }

        // CLOTHING COLOR-IFICATION
        if (!isNative) {
          const isTop = matName.toLowerCase().includes('top') || matName.toLowerCase().includes('shirt') || matName.toLowerCase().includes('tank') || meshName.toLowerCase().includes('shirt');
          const isBackpack = matName.toLowerCase().includes('backpack') || matName.toLowerCase().includes('bag') || matName.toLowerCase().includes('pack');

          const isBuckle = matName.toLowerCase().includes('buckle');
          const shouldColor = !isSkin && !isEye && !isLash && !isMouth && !isHair && !isBuckle && 
                              !(isCha && (isShirt || isBoot)) && 
                              !(isSabira && !isTop) && 
                              !isRajaa;

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
            } else if (isCha) {
               if (isShorts) {
                 color = 0xff0000; // Vivid red
                 forceProcedural = true;
               } else if (isTop) {
                 color = 0x0044cc; // Superman blue
                 forceProcedural = true;
               } else {
                 color = 0x151515; // Black boots / gear
                 forceProcedural = true;
               }
            } else if (isSabira) {
               if (isTop) {
                 color = 0xffd700; // Yellow top
                 forceProcedural = true;
               }
            } else if (isSafa) {
               color = 0xe2d6bd; // Beige
               forceProcedural = true;
            } else {
              // Vivid Red
              const redColor = 0xff0000;
              const gearColor = 0x990000;
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
                  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                  if (ctx && mat.map && mat.map.image) {
                    ctx.drawImage(mat.map.image as any, 0, 0, 1024, 1024);
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
              // Procedural material for jeans, white, black, beige, yellow
              const newMat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: (isVivid || (isRosanna && isTop)) ? new THREE.Color(color === 0x050505 ? 0 : color) : new THREE.Color(0,0,0),
                emissiveIntensity: isVivid ? 0.5 : ((isRosanna && isTop) ? 0.05 : 0),
                roughness: (isRosanna || isMarissa || isDelphina || isSara || isSafa || isSabira) ? 0.9 : (isVivid ? 0.1 : 0.25),
                metalness: (isRosanna || isMarissa || isDelphina || isSara || isSafa || isSabira) ? 0.0 : (isVivid ? 0.3 : 0.1),
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
