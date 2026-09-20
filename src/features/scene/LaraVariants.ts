import * as THREE from 'three';

export type LaraVariant = 'native' | 'rosanna' | 'marissa' | 'delphina' | 'sara' | 'cha' | 'vivida' | 'sabira' | 'safa' | 'sandra' | 'rajaa' | 'angelina' | 'romana' | 'lgbta';

const textureCache: Record<string, THREE.Texture> = {};
const grayscaleTextureCache = new Map<string, THREE.Texture>();
let rosannaBullsTextureCache: THREE.CanvasTexture | null = null;

function getTexture(url: string): THREE.Texture {
  if (!textureCache[url]) {
    const tex = new THREE.TextureLoader().load(url);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    textureCache[url] = tex;
  }
  return textureCache[url];
}

function createGrayscaleTexture(
  originalTex: THREE.Texture,
  mode: 'vivida' | 'light' | 'white-boost' | 'standard' = 'standard'
): THREE.Texture | null {
  if (!originalTex || !originalTex.image) return null;
  const cacheKey = (originalTex.uuid || originalTex.name || 'tex') + '_' + mode;
  const cached = grayscaleTextureCache.get(cacheKey);
  if (cached) return cached;

  const img = originalTex.image as HTMLImageElement | HTMLCanvasElement;
  const width = img.width || 1024;
  const height = img.height || 1024;
  if (!width || !height) return null;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  if (mode === 'vivida') {
    // Exaggerated high contrast for Vivida variant so fabric folds and shadow creases pop out strongly
    ctx.filter = 'grayscale(100%) brightness(140%) contrast(210%)';
  } else if (mode === 'white-boost') {
    // Tripled brightness with reduced contrast to keep subtle texture details while eliminating deep grey shadows
    ctx.filter = 'grayscale(100%) brightness(300%) contrast(70%)';
  } else if (mode === 'light') {
    // Boost brightness so white/light clothes appear clean with soft fold shadows
    ctx.filter = 'grayscale(100%) brightness(185%) contrast(110%)';
  } else {
    // Balanced contrast for dark/standard colored clothes
    ctx.filter = 'grayscale(100%) brightness(130%) contrast(140%)';
  }
  ctx.drawImage(img, 0, 0, width, height);
  ctx.filter = 'none';

  const newTex = new THREE.CanvasTexture(canvas);
  newTex.flipY = originalTex.flipY;
  newTex.colorSpace = THREE.SRGBColorSpace;
  newTex.needsUpdate = true;
  grayscaleTextureCache.set(cacheKey, newTex);
  return newTex;
}

export function applyLaraVariantStyles(model: THREE.Object3D, style?: LaraVariant) {
  if (!style) return;
  const isVivida = style === 'vivida';
  const isNative = style === 'native';
  const isRosanna = style === 'rosanna';
  const isMarissa = style === 'marissa';
  const isDelphina = style === 'delphina';
  const isSara = style === 'sara';
  const isCha = style === 'cha';
  const isSabira = style === 'sabira';
  const isSafa = style === 'safa';
  const isSandra = style === 'sandra';
  const isRajaa = style === 'rajaa';
  const isAngelina = style === 'angelina';
  const isRomana = style === 'romana';
  const isLgbta = style === 'lgbta';

  model.traverse(node => {
    if ((node as THREE.Mesh).isMesh) {
      if (node.userData && node.userData.isCustomHair) return; // Skip custom hair meshes
      const mesh = node as THREE.Mesh;
      const meshName = mesh.name.toLowerCase();
      if (meshName.includes('body_nude') || meshName.includes('panties') || meshName.includes('feet') || meshName.includes('hands')) return; // Preserve pristine nude textures

      // Variants need independent materials, but this function can run again
      // after a UI setting changes. Always clone from the immutable GLTF
      // materials and release the previous per-character clones first.
      const currentMat = mesh.material as THREE.Material | THREE.Material[];
      const baseMaterials = (mesh.userData.__baseVariantMaterials ??
        (Array.isArray(currentMat) ? currentMat : [currentMat])) as THREE.Material[];
      if (!mesh.userData.__baseVariantMaterials) {
        mesh.userData.__baseVariantMaterials = baseMaterials;
      }
      (Array.isArray(currentMat) ? currentMat : [currentMat]).forEach(material => {
        if (material?.userData.__ownedCharacterMaterial) material.dispose();
      });

      const matArray = baseMaterials;
      const clonedMats = matArray.map(m => m.clone() as THREE.MeshStandardMaterial);
      clonedMats.forEach(material => { material.userData.__ownedCharacterMaterial = true; });
      mesh.material = clonedMats.length === 1 ? clonedMats[0] : clonedMats;

      clonedMats.forEach(mat => {
        const matName = mat.name ? mat.name.toLowerCase() : "";

        const isHand = matName.includes('hand') || matName.includes('finger') || meshName.includes('hand') || meshName.includes('finger');
        const isSkin = matName.includes('skin') || matName.includes('face') || matName.includes('head') || matName.includes('body') || matName.includes('arm') || matName.includes('leg') || meshName.includes('body') || meshName.includes('arm') || isHand;
        const isHair = matName.includes('hair') || matName.includes('pony') || matName.includes('braid') || meshName.includes('hair') || meshName.includes('pony') || meshName.includes('braid');
        const isLash = matName.includes('lash');
        const isEye  = matName.includes('eye') && !isLash;

        const isGlasses = matName.includes('lens') || matName.includes('glass') || matName.includes('frame');
        const isMouth = matName.includes('mouth') || matName.includes('teeth') || matName.includes('tongue');

        // HIDE GLASSES for Delphina, Cha, and Romana
        if ((isDelphina || isCha || isRomana) && isGlasses) {
           mat.visible = false;
        }

        // HIDE BRAID for Angelina
        if (isAngelina && isHair && (matName.includes('braid') || matName.includes('pony') || meshName.includes('braid') || meshName.includes('pony'))) {
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
          } else if (isAngelina) {
             mat.map = null; // Cheveux bleus électriques pour Angelina
             mat.color.setHex(0x0088ff);
             mat.emissive.setHex(0x0044aa);
             mat.emissiveIntensity = 0.15;
          } else if (isLgbta) {
             mat.map = null; // Cheveux violet/rose néon Lgbta
             mat.color.setHex(0xff00cc);
             mat.emissive.setHex(0xaa00aa);
             mat.emissiveIntensity = 0.15;
          } else if (isVivida) {
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
             const isHairBase = meshName === 'hair_base' || matName.includes('hair2');
             mat.map = null; // Supprime la texture sombre GLTF
             if (isHairBase) {
               mat.color.setHex(0x5c3a21); // Châtain pour hair_base
               mat.emissive.setHex(0x2d1a0e);
               mat.emissiveIntensity = 0.05;
             } else {
               mat.color.setHex(0xbc9c74); // Châtain-blond plus clair pour les autres cheveux / tresse
               mat.emissive.setHex(0xbc9c74);
               mat.emissiveIntensity = 0.05;
             }
          } else if (isMarissa) {
              mat.map = null;
              mat.color.setHex(0x9e7344); // Châtain clair
              mat.emissive.setHex(0x4a321a);
              mat.emissiveIntensity = 0.05;
           }
        }

        // Both 'eyes' and 'eye2' might be transparent decals over a base eyeball.
        const isEyeMat = matName.includes('eye') && !matName.includes('lash');
        if (isEyeMat) {
           mat.visible = true; // Ensure both are visible in case one is the sclera and one is the pupil
           mat.emissive.setHex(0x000000);
           mat.metalness = 0;
           mat.roughness = 0.3;
           mat.transparent = false; // Force opaque to prevent depth sorting bugs
           mat.alphaTest = 0.5;
           if ('transmission' in mat) (mat as any).transmission = 0;

           if (isDelphina || isRomana) {
              mat.color.setHex(0xffffff);
              mat.map = getTexture('characters/lara/textures/8003_blue.png'); // Yeux bleus pour Delphina et Romana
           } else if (isCha) {
              mat.color.setHex(0xffffff);
              mat.map = getTexture('characters/lara/textures/8003_green.png');
           } else if (isMarissa) {
              mat.color.setHex(0xffffff);
              mat.map = getTexture('characters/lara/textures/8003_black.png');
           } else {
              mat.color.setHex(0xffffff);
              // Default brown texture for all other Laras
              mat.map = getTexture('characters/lara/textures/8003.png');
           }
           mat.needsUpdate = true;
        }

        // TEXTURE REPLACEMENTS FOR CHA (SUPERMAN TOP, RED BOOTS, GOLDEN SOCKS)
        const isShirt = matName.toLowerCase().includes('shirt');
        const isBoot = matName.toLowerCase().includes('boot');
        const isShorts = matName.toLowerCase().includes('short') || matName.toLowerCase().includes('pant') || meshName.toLowerCase().includes('short');
        if (isCha) {
           if (isShirt) {
              mat.map = getTexture('characters/lara/textures/8019_cha.png');
              mat.needsUpdate = true;
           }
           if (isBoot) {
              mat.map = getTexture('characters/lara/textures/8016_cha.png');
              mat.needsUpdate = true;
           }
        }

        if (isRajaa) {
           if (isShirt) {
              mat.map = getTexture('characters/lara/textures/8019_rajaa.png');
              mat.needsUpdate = true;
           }
           if (isShorts) {
              mat.map = getTexture('characters/lara/textures/8031_rajaa.png');
              mat.needsUpdate = true;
           }
        }

        // CLOTHING COLOR-IFICATION
        if (!isNative) {
          const isTop = matName.toLowerCase().includes('top') || matName.toLowerCase().includes('shirt') || matName.toLowerCase().includes('tank') || meshName.toLowerCase().includes('shirt');
          const isBackpack = matName.toLowerCase().includes('backpack') || matName.toLowerCase().includes('bag') || matName.toLowerCase().includes('pack');

          const isBuckle = matName.toLowerCase().includes('buckle');
          const isGear = matName.toLowerCase().includes('gear') || matName.toLowerCase().includes('holster');

          const shouldColor = !isSkin && !isEye && !isLash && !isMouth && !isHair && !isBuckle &&
                              !(!isDelphina && isGear) &&
                              !(isCha && (isShirt || isBoot)) &&
                              !isRajaa;

          if (shouldColor) {
            let color = 0xcc0000; // Brighter default red
            let forceProcedural = false;

             if (isRosanna) {
                if (isShorts) {
                  color = 0xa2c4d9; // Blue jean
                  forceProcedural = false;
                } else if (isTop || isBackpack) {
                  color = 0xff2222; // Red
                  forceProcedural = false;
                } else if (isGear || isBoot) {
                  color = 0x222222; // Dark leather
                  forceProcedural = false;
                }
             } else if (isMarissa) {
                if (isShorts) {
                  color = 0xa2c4d9; // Blue jean
                  forceProcedural = false;
                } else if (isTop) {
                  color = 0x555555; // Dark charcoal
                  forceProcedural = false;
                } else if (isBackpack || isGear) {
                  color = 0x222222; // Dark leather
                  forceProcedural = false;
                } else if (isBoot) {
                  color = 0xffffff; // Pure bright white boots with details
                  forceProcedural = false;
                }
             } else if (isDelphina) {
                color = 0xffffff; // Pure white for clothes, backpack, holsters, boots
                forceProcedural = false;
             } else if (isSara) {
                if (isTop || isShorts) {
                  color = 0x444444; // Dark grey
                  forceProcedural = false;
                } else {
                  color = 0x151515; // Black leather gear/boots/backpack
                  forceProcedural = false;
                }
             } else if (isCha) {
                if (isShorts) {
                  color = 0xff0000; // Vivida red shorts
                  forceProcedural = false;
                } else if (isTop) {
                  color = 0x0044cc; // Superman blue
                  forceProcedural = true;
                } else {
                  color = 0x151515; // Black boots / gear
                  forceProcedural = false;
                }
             } else if (isSabira) {
                if (isShorts) {
                  color = 0xa2c4d9; // Blue jean comme Rosanna
                  forceProcedural = false;
                } else if (isTop) {
                  color = 0xffd700; // Yellow top
                  forceProcedural = false;
                } else {
                  color = 0x151515; // Black boots / gear
                  forceProcedural = false;
                }
             } else if (isSafa) {
                color = 0xe2d6bd; // Beige
                forceProcedural = false;
             } else if (isSandra) {
                if (isTop) {
                  color = 0x444444; // Black/grey shirt
                  forceProcedural = false;
                } else if (isShorts) {
                  color = 0xff0000; // Red shorts
                  forceProcedural = false;
                } else {
                  color = 0x151515; // Black boots / gear
                  forceProcedural = false;
                }
             } else if (isRajaa) {
                if (isTop || isShorts) {
                  color = 0x4b5320; // Kaki militaire
                  forceProcedural = false;
                } else {
                  color = 0x2b2b2b; // Équipement militaire sombre
                  forceProcedural = false;
                }
             } else if (isAngelina) {
                if (isTop) {
                  color = 0x111111; // Haut noir cyber
                  forceProcedural = false;
                } else if (isShorts) {
                  color = 0x0066cc; // Shorts bleu nuit
                  forceProcedural = false;
                } else {
                  color = 0x222222; // Bottes et équipements noirs
                  forceProcedural = false;
                }
             } else if (isRomana) {
                if (isTop) {
                  color = 0x800020; // Bourgogne / Bordeaux élégant
                  forceProcedural = false;
                } else if (isShorts) {
                  color = 0x2b2b2b; // Short sombre
                  forceProcedural = false;
                } else {
                  color = 0x1a1a1a;
                  forceProcedural = false;
                }
             } else if (isLgbta) {
                if (isTop) {
                  color = 0xff0055; // Magenta arc-en-ciel
                  forceProcedural = false;
                } else if (isShorts) {
                  color = 0x00ccff; // Cyan vif
                  forceProcedural = false;
                } else if (isBackpack) {
                  color = 0xffcc00; // Jaune solaire
                  forceProcedural = false;
                } else {
                  color = 0x9900ff; // Violet vif
                  forceProcedural = false;
                }
             } else {
                // Vivida Red
                color = 0xff0000; // Pure vivid red matching top & shorts
                forceProcedural = false;
             }

             const useMap = mat.map && !forceProcedural;

             if (useMap) {
                const isClothingOrGear = isTop || isShorts || isBackpack || isGear || isBoot;
                if (isClothingOrGear && mat.map && !(isCha && (isShirt || isBoot))) {
                   let mode: 'vivida' | 'light' | 'white-boost' | 'standard' = 'standard';
                   if (isVivida) {
                     mode = 'vivida';
                   } else if (color === 0xffffff || (isBoot && (isMarissa || isDelphina))) {
                     mode = 'white-boost';
                   } else if (isDelphina || isSabira || isSafa || color === 0xffd700 || color === 0xe2d6bd || color === 0xa2c4d9) {
                     mode = 'light';
                   }
                   const bwMap = createGrayscaleTexture(mat.map, mode);
                   if (bwMap) mat.map = bwMap;
                   mat.roughness = 0.4;
                   mat.metalness = 0.0;
                }
                mat.color.setHex(color);
                if (color === 0xffffff || (isBoot && (isMarissa || isDelphina))) {
                  mat.emissive = new THREE.Color(0x222222);
                  mat.emissiveIntensity = 0.10;
                }
               if (isVivida) {
                 mat.emissive = new THREE.Color(color);
                 mat.emissiveIntensity = 0.18;
               }
               if (isRosanna && isTop) {
                  mat.roughness = 0.5;
                  mat.metalness = 0.0;
                  mat.emissive = new THREE.Color(0xff0000);
                  mat.emissiveIntensity = 0.01;

                  // BULLS 66 Text (mis en cache pour éviter toute réallocation mémoire)
                  if (!rosannaBullsTextureCache && mat.map && mat.map.image) {
                    const canvas = document.createElement('canvas');
                    canvas.width = 1024; canvas.height = 1024;
                    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
                    if (ctx) {
                      ctx.drawImage(mat.map.image as any, 0, 0, 1024, 1024);
                      ctx.fillStyle = 'black'; ctx.textAlign = 'center';
                      ctx.font = '900 80px Graduate';
                      ctx.fillText('BULLS', 700, 750);
                      ctx.font = '900 150px Graduate';
                      ctx.fillText('66', 700, 870);

                      const newTex = new THREE.CanvasTexture(canvas);
                      newTex.flipY = false;
                      newTex.colorSpace = THREE.SRGBColorSpace;
                      rosannaBullsTextureCache = newTex;
                    }
                  }
                  if (rosannaBullsTextureCache) {
                    mat.map = rosannaBullsTextureCache;
                    mat.needsUpdate = true;
                  }
               }
            } else {
              // Procedural material for jeans, white, black, beige, yellow
              const isWhite = color === 0xffffff;
              const newMat = new THREE.MeshStandardMaterial({
                color: color,
                emissive: isWhite ? new THREE.Color(0xffffff) : ((isVivida || (isRosanna && isTop)) ? new THREE.Color(color === 0x050505 ? 0 : color) : new THREE.Color(0,0,0)),
                emissiveIntensity: isWhite ? 0.35 : (isVivida ? 0.5 : ((isRosanna && isTop) ? 0.05 : 0)),
                roughness: isWhite ? 0.2 : ((isMarissa && isTop) ? 0.15 : ((isRosanna || isMarissa || isDelphina || isSara || isSafa || isSabira) ? 0.9 : (isVivida ? 0.1 : 0.25))),
                metalness: isWhite ? 0.0 : ((isMarissa && isTop) ? 0.35 : ((isRosanna || isMarissa || isDelphina || isSara || isSafa || isSabira) ? 0.0 : (isVivida ? 0.3 : 0.1))),
                transparent: false,
                alphaTest: 0.5, // Allow alpha test for cutouts
                depthWrite: true,
                visible: mat.visible,
                name: mat.name || (style + 'Material'),
                side: THREE.DoubleSide
              });

              // We need to replace the material on the mesh directly
              if (clonedMats.length === 1) {
                  mesh.material = newMat;
              } else {
                  const idx = clonedMats.indexOf(mat);
                  if (idx !== -1) clonedMats[idx] = newMat;
                  mesh.material = clonedMats;
              }
            }
          }
        }

        // MARISSA TATTOOS ON SKIN (Lion head on forearm & leg tattoo "BEAUTY IS AS BEAUTY DOES")
        // N'appliquer que sur les bras/jambes spécifiques (arms, fingers, body_legs)
        if (isMarissa && (meshName === 'arms' || meshName === 'fingers' || meshName === 'body_legs' || matName.includes('arm') || matName.includes('finger') || (matName.includes('body') && meshName.includes('leg')))) {
          applyMarissaTattoos(mat);
        }

        // DELPHINA FLORAL TATTOOS ON SKIN (Arabesques et fleurs le long des bras et des jambes)
        if (isDelphina && (meshName === 'arms' || meshName === 'fingers' || meshName === 'body_legs' || matName.includes('arm') || matName.includes('finger') || (matName.includes('body') && meshName.includes('leg')))) {
          applyDelphinaTattoos(mat);
        }

        // SARA FRONT NECK TATTOO (Tatouage en losange du menton au bas du cou)
        if (isSara && (meshName === 'body_torso' || (meshName.includes('body') && matName.includes('body') && !meshName.includes('leg')))) {
          applySaraTorsoNeckTattoo(mat);
        }
      });
    }
  });

  // MARISSA 3D PIERCINGS (Cupid's bow stud & Left nostril ring attached to main head bone)
  if (isMarissa && !model.userData.hasMarissaPiercings) {
    model.userData.hasMarissaPiercings = true;

    const piercingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.95,
      roughness: 0.05,
      name: 'MarissaPiercingMat',
    });

    const headBone = model.getObjectByName('head_neck_upper') || model.getObjectByName('head') || model.getObjectByName('Head');
    if (headBone) {
      headBone.children = headBone.children.filter(c => c.name !== 'MarissaCupidPiercing' && c.name !== 'MarissaNostrilPiercing');

      // 1. Coupe de Cupidon - Clou / Bille (Sphere stud) au centre au-dessus de la lèvre supérieure
      const studGeo = new THREE.SphereGeometry(0.0028, 5, 5);
      const studMesh = new THREE.Mesh(studGeo, piercingMat);
      studMesh.name = 'MarissaCupidPiercing';
      studMesh.position.set(-0.000, 0.106, 0.053);
      headBone.add(studMesh);

      // 2. Narine Gauche - Boucle / Anneau (Torus ring) sur l'aile de la narine gauche
      const ringGeo = new THREE.TorusGeometry(0.0038, 0.0011, 12, 24);
      const ringMesh = new THREE.Mesh(ringGeo, piercingMat);
      ringMesh.name = 'MarissaNostrilPiercing';
      ringMesh.position.set(0.012, 0.120, 0.040);
      ringMesh.rotation.y = Math.PI / 2.2;
      headBone.add(ringMesh);
    }
  }
}

/** Releases only materials created for a character variant, never GLTF-shared assets. */
export function disposeLaraVariantMaterials(model: THREE.Object3D) {
  model.traverse((node: any) => {
    if (!node.isMesh || !node.material) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material: THREE.Material) => {
      if (material.userData.__ownedCharacterMaterial) material.dispose();
    });
  });
}

// ── MARISSA TATTOO CANVAS GENERATOR ──────────────────────────────────────────

const marissaTattooTextureCache: Record<string, THREE.CanvasTexture> = {};

function applyMarissaTattoos(mat: THREE.MeshStandardMaterial) {
  mat.map = getMarissaTattooTexture();
  mat.needsUpdate = true;
}

function getMarissaTattooTexture(): THREE.CanvasTexture {
  if (marissaTattooTextureCache['marissa_tattoos']) {
    return marissaTattooTextureCache['marissa_tattoos'];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  marissaTattooTextureCache['marissa_tattoos'] = tex;

  const drawAll = (img?: HTMLImageElement) => {
    if (!ctx) return;
    if (img) {
      try {
        ctx.drawImage(img, 0, 0, 512, 512);
      } catch {
        ctx.fillStyle = '#dca888';
        ctx.fillRect(0, 0, 512, 512);
      }
    } else {
      ctx.fillStyle = '#dca888';
      ctx.fillRect(0, 0, 512, 512);
    }
    drawMarissaTattoosOnCanvas(ctx);
    tex.needsUpdate = true;
  };

  const img = new Image();
  img.src = 'characters/lara/textures/8001.png';
  img.onload = () => drawAll(img);
  img.onerror = () => drawAll();
  drawAll();

  return tex;
}

function drawMarissaTattoosOnCanvas(ctx: CanvasRenderingContext2D) {
  // ── 1. TATOUAGE TÊTE DE LION (Avant-bras gauche) ──
  ctx.save();
  ctx.translate(240, 205);
  ctx.fillStyle = 'rgba(18, 18, 22, 0.88)';
  ctx.strokeStyle = 'rgba(12, 12, 16, 0.95)';
  ctx.lineWidth = 2;

  // Lion Mane Spikes
  ctx.beginPath();
  const numSpikes = 18;
  for (let i = 0; i < numSpikes; i++) {
    const angle = (i / numSpikes) * Math.PI * 2;
    const r = (i % 2 === 0) ? 28 : 20;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Lion Head & Ears
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-11, -12, 5, 0, Math.PI * 2);
  ctx.arc(11, -12, 5, 0, Math.PI * 2);
  ctx.stroke();

  // Eyes, Nose & Muzzle
  ctx.beginPath();
  ctx.arc(-6, -4, 2.2, 0, Math.PI * 2);
  ctx.arc(6, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(-4, -3);
  ctx.lineTo(4, -3);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 1); ctx.lineTo(0, 7);
  ctx.moveTo(-6, 8); ctx.quadraticCurveTo(0, 11, 6, 8);
  ctx.moveTo(-6, 5); ctx.lineTo(-18, 2);
  ctx.moveTo(-6, 7); ctx.lineTo(-18, 8);
  ctx.moveTo(6, 5);  ctx.lineTo(18, 2);
  ctx.moveTo(6, 7);  ctx.lineTo(18, 8);
  ctx.stroke();

  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(12, 12, 16, 0.9)';
  ctx.fillText('🦁 LION', 0, 24);
  ctx.restore();

  // ── 2. TATOUAGE TEXTE "BEAUTY IS AS BEAUTY DOES" (Face avant, haut de cuisse gauche, sous la sangle du holster) ──
  ctx.save();
  ctx.translate(122, 408);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(15, 15, 20, 0.95)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 16px "Cinzel", "Times New Roman", serif';

  const lines = ['BEAUTY', 'IS AS', 'BEAUTY', 'DOES'];
  const lineHeight = 19;
  const startY = -((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, idx) => {
    ctx.fillText(line, 0, startY + idx * lineHeight);
  });

  ctx.restore();
}

// ── DELPHINA FLORAL TATTOO CANVAS GENERATOR ──────────────────────────────────

const delphinaTattooTextureCache: Record<string, THREE.CanvasTexture> = {};

function applyDelphinaTattoos(mat: THREE.MeshStandardMaterial) {
  mat.map = getDelphinaTattooTexture();
  mat.needsUpdate = true;
}

function getDelphinaTattooTexture(): THREE.CanvasTexture {
  if (delphinaTattooTextureCache['delphina_floral_v3']) {
    return delphinaTattooTextureCache['delphina_floral_v3'];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  delphinaTattooTextureCache['delphina_floral_v3'] = tex;

  const drawAll = (img?: HTMLImageElement) => {
    if (!ctx) return;
    if (img) {
      try {
        ctx.drawImage(img, 0, 0, 512, 512);
      } catch {
        ctx.fillStyle = '#dca888';
        ctx.fillRect(0, 0, 512, 512);
      }
    } else {
      ctx.fillStyle = '#dca888';
      ctx.fillRect(0, 0, 512, 512);
    }
    drawDelphinaFloralTattoosOnCanvas(ctx);
    tex.needsUpdate = true;
  };

  const img = new Image();
  img.src = 'characters/lara/textures/8001.png';
  img.onload = () => drawAll(img);
  img.onerror = () => drawAll();
  drawAll();

  return tex;
}

function drawDelphinaFloralTattoosOnCanvas(ctx: CanvasRenderingContext2D) {
  const inkDark = 'rgba(12, 14, 20, 0.98)';
  const inkSecondary = 'rgba(28, 32, 42, 0.85)';

  function drawFlower(
    cx: number,
    cy: number,
    radius: number,
    numPetals: number,
    angleOffset = 0,
    colorAccent = 'rgba(235, 75, 120, 0.92)'
  ) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angleOffset);
    for (let i = 0; i < numPetals; i++) {
      const angle = (i * Math.PI * 2) / numPetals;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-radius * 0.45, -radius * 0.45, -radius * 0.4, -radius, 0, -radius * 1.15);
      ctx.bezierCurveTo(radius * 0.4, -radius, radius * 0.45, -radius * 0.45, 0, 0);
      ctx.fillStyle = 'rgba(22, 24, 30, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(10, 12, 16, 0.98)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      if (colorAccent) {
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.quadraticCurveTo(-radius * 0.22, -radius * 0.45, 0, -radius * 0.78);
        ctx.quadraticCurveTo(radius * 0.22, -radius * 0.45, 0, -2);
        ctx.fillStyle = colorAccent;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(0, -radius * 0.85);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 16, 22, 0.96)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(240, 200, 80, 0.9)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 235, 140, 0.95)';
    for (let j = 0; j < 6; j++) {
      const a = (j * Math.PI * 2) / 6;
      const r = radius * 0.18;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLeaf(bx: number, by: number, length: number, angle: number, width = length * 0.45) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-width, -length * 0.4, -width * 0.8, -length * 0.85, 0, -length);
    ctx.bezierCurveTo(width * 0.8, -length * 0.85, width, -length * 0.4, 0, 0);
    ctx.fillStyle = 'rgba(20, 32, 24, 0.88)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(10, 16, 12, 0.98)';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length * 0.92);
    ctx.strokeStyle = 'rgba(90, 180, 110, 0.55)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.restore();
  }

  // ── 1. TATOUAGE FLORAL LE LONG DES BRAS (Épaule -> Avant-bras -> Poignet) ──
  // En pose idle, la face latérale externe (visible de face/3/4) est à py ≈ 185..215
  // La face avant/biceps est à py ≈ 215..250.
  // On trace deux lianes entrelacées couvrant les deux faces :
  ctx.save();

  // Liane 1 : Face latérale externe (pleinement visible en vue studio et 3/4)
  ctx.strokeStyle = inkDark;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(60, 202);
  ctx.bezierCurveTo(95, 188, 130, 212, 165, 195);
  ctx.bezierCurveTo(200, 182, 235, 210, 270, 192);
  ctx.bezierCurveTo(285, 185, 302, 208, 318, 196);
  ctx.stroke();

  // Liane 2 : Face avant / biceps et avant-bras
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = inkSecondary;
  ctx.beginPath();
  ctx.moveTo(70, 242);
  ctx.bezierCurveTo(105, 225, 140, 252, 175, 230);
  ctx.bezierCurveTo(210, 218, 245, 245, 280, 225);
  ctx.bezierCurveTo(295, 218, 308, 238, 320, 224);
  ctx.stroke();

  // Lianes spiralées de jonction entre face latérale et face avant
  ctx.lineWidth = 1.0;
  ctx.strokeStyle = 'rgba(18, 20, 26, 0.82)';
  const armSpirals: [number, number, number, number, number, number, number, number][] = [
    [85, 198, 98, 220, 115, 215, 125, 238],
    [148, 202, 160, 222, 178, 218, 190, 225],
    [215, 192, 230, 218, 245, 208, 255, 232],
    [275, 194, 288, 214, 298, 205, 308, 226]
  ];
  for (const [x1, y1, cx1, cy1, cx2, cy2, x2, y2] of armSpirals) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
    ctx.stroke();
  }

  // Grandes fleurs épanouies sur les deux faces du bras
  // Face externe (visible en caméra 3/4)
  drawFlower(78, 198, 11.5, 5, 0.2, 'rgba(245, 70, 110, 0.95)');
  drawFlower(120, 192, 13.0, 6, 0.7, 'rgba(235, 60, 100, 0.95)');
  drawFlower(168, 196, 11.0, 5, 0.4, 'rgba(250, 90, 130, 0.9)');
  drawFlower(218, 190, 13.5, 6, 1.1, 'rgba(230, 50, 95, 0.95)');
  drawFlower(265, 194, 11.5, 5, 0.5, 'rgba(240, 75, 115, 0.92)');
  drawFlower(305, 196, 8.5, 4, 0.8, 'rgba(255, 110, 145, 0.88)');

  // Face avant / intérieure
  drawFlower(95, 238, 12.0, 5, 0.3, 'rgba(230, 65, 105, 0.92)');
  drawFlower(142, 245, 10.5, 5, 0.9, 'rgba(245, 80, 120, 0.9)');
  drawFlower(192, 226, 13.0, 6, 0.6, 'rgba(235, 55, 100, 0.95)');
  drawFlower(242, 238, 11.0, 5, 1.2, 'rgba(240, 70, 110, 0.92)');
  drawFlower(288, 226, 9.0, 4, 0.4, 'rgba(250, 95, 135, 0.88)');

  // Feuilles botaniques le long des branches du bras
  const armLeaves: [number, number, number, number][] = [
    [70, 192, 12, -1.0], [90, 206, 11, 1.2], [108, 185, 13, -0.8],
    [132, 204, 12, 1.4], [152, 188, 13, -1.1], [180, 205, 14, 1.5],
    [202, 184, 12, -0.9], [232, 202, 13, 1.3], [250, 186, 12, -1.2],
    [280, 200, 11, 1.4], [80, 248, 12, 1.3], [112, 230, 11, -0.9],
    [160, 252, 12, 1.4], [178, 222, 13, -1.2], [225, 248, 12, 1.5],
    [260, 222, 11, -0.8], [298, 238, 10, 1.3]
  ];
  for (const [lx, ly, llen, lang] of armLeaves) {
    drawLeaf(lx, ly, llen, lang);
  }

  // Pétales flottants
  const armPetals: [number, number][] = [
    [86, 212], [130, 182], [156, 214], [210, 202], [252, 180], [292, 212],
    [105, 252], [172, 242], [235, 218], [275, 244]
  ];
  ctx.fillStyle = 'rgba(240, 85, 125, 0.92)';
  for (const [px, py] of armPetals) {
    ctx.beginPath();
    ctx.ellipse(px, py, 2.5, 1.4, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // ── 2. TATOUAGE FLORAL LE LONG DES JAMBES (Cuisse -> Genou -> Mollet) ──
  // La zone exposée entre le bas du short et le haut des bottes est à px ≈ 100..250.
  // La face latérale externe (visible en 3/4) est à py ≈ 350..385
  // La face avant (rotule, tibia) est à py ≈ 390..430
  ctx.save();

  // Liane 1 : Face latérale externe
  ctx.strokeStyle = inkDark;
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(85, 372);
  ctx.bezierCurveTo(115, 355, 145, 385, 175, 366);
  ctx.bezierCurveTo(205, 350, 235, 380, 265, 362);
  ctx.stroke();

  // Liane 2 : Face avant du genou et de la cuisse
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = inkSecondary;
  ctx.beginPath();
  ctx.moveTo(95, 418);
  ctx.bezierCurveTo(125, 395, 155, 428, 185, 404);
  ctx.bezierCurveTo(215, 385, 245, 422, 275, 398);
  ctx.stroke();

  // Lianes spiralées contournant le genou
  ctx.lineWidth = 1.1;
  ctx.strokeStyle = 'rgba(16, 18, 24, 0.85)';
  const legSpirals: [number, number, number, number, number, number, number, number][] = [
    [105, 368, 118, 392, 130, 385, 140, 416],
    [155, 375, 168, 398, 182, 388, 195, 412],
    [210, 360, 225, 388, 238, 378, 252, 408]
  ];
  for (const [x1, y1, cx1, cy1, cx2, cy2, x2, y2] of legSpirals) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
    ctx.stroke();
  }

  // Fleurs épanouies sur la cuisse et le genou
  // Face externe
  drawFlower(95, 368, 12.0, 5, 0.4, 'rgba(240, 65, 105, 0.95)');
  drawFlower(135, 365, 14.5, 6, 0.9, 'rgba(230, 50, 95, 0.95)');
  drawFlower(175, 368, 15.5, 7, 0.5, 'rgba(245, 75, 120, 0.95)'); // Plein centre du genou extérieur
  drawFlower(218, 360, 13.0, 6, 1.2, 'rgba(235, 60, 105, 0.92)');
  drawFlower(258, 366, 10.5, 5, 0.6, 'rgba(250, 90, 130, 0.88)');

  // Face avant (rotule et tibia)
  drawFlower(115, 412, 13.0, 6, 0.3, 'rgba(235, 55, 100, 0.95)');
  drawFlower(155, 420, 15.0, 7, 0.8, 'rgba(245, 70, 115, 0.95)'); // Face avant rotule
  drawFlower(195, 402, 13.5, 6, 0.6, 'rgba(230, 50, 95, 0.95)');
  drawFlower(238, 416, 11.5, 5, 1.0, 'rgba(240, 65, 110, 0.92)');
  drawFlower(272, 400, 9.0, 4, 0.5, 'rgba(255, 100, 140, 0.88)');

  // Feuilles botaniques le long de la jambe
  const legLeaves: [number, number, number, number][] = [
    [88, 360, 13, -1.1], [112, 380, 12, 1.4], [128, 354, 14, -0.9],
    [152, 382, 15, 1.5], [168, 355, 14, -1.2], [192, 378, 15, 1.6],
    [210, 350, 13, -1.0], [235, 375, 13, 1.3], [250, 352, 11, -1.1],
    [102, 425, 13, 1.3], [128, 402, 12, -1.0], [145, 432, 14, 1.5],
    [172, 410, 13, -1.2], [212, 428, 13, 1.4], [228, 394, 12, -0.9],
    [262, 420, 11, 1.2]
  ];
  for (const [lx, ly, llen, lang] of legLeaves) {
    drawLeaf(lx, ly, llen, lang, llen * 0.44);
  }

  // Pétales flottants
  const legPetals: [number, number][] = [
    [105, 355], [148, 392], [182, 356], [225, 388], [245, 350],
    [122, 428], [168, 395], [205, 432], [252, 385]
  ];
  ctx.fillStyle = 'rgba(240, 80, 120, 0.92)';
  for (const [px, py] of legPetals) {
    ctx.beginPath();
    ctx.ellipse(px, py, 2.6, 1.5, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ── SARA FRONT NECK TATTOO CANVAS GENERATOR ──────────────────────────────────

const saraNeckTattooTextureCache: Record<string, THREE.CanvasTexture> = {};

function applySaraTorsoNeckTattoo(mat: THREE.MeshStandardMaterial) {
  mat.map = getSaraTorsoNeckTattooTexture();
  mat.needsUpdate = true;
}

function getSaraTorsoNeckTattooTexture(): THREE.CanvasTexture {
  if (saraNeckTattooTextureCache['sara_torso_tattoo']) {
    return saraNeckTattooTextureCache['sara_torso_tattoo'];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  saraNeckTattooTextureCache['sara_torso_tattoo'] = tex;

  const drawAll = (img?: HTMLImageElement) => {
    if (!ctx) return;
    if (img) {
      try {
        ctx.drawImage(img, 0, 0, 512, 512);
      } catch {
        ctx.fillStyle = '#dca888';
        ctx.fillRect(0, 0, 512, 512);
      }
    } else {
      ctx.fillStyle = '#dca888';
      ctx.fillRect(0, 0, 512, 512);
    }
    drawSaraTorsoNeckTattooOnCanvas(ctx);
    tex.needsUpdate = true;
  };

  const img = new Image();
  img.src = 'characters/lara/textures/8001.png';
  img.onload = () => drawAll(img);
  img.onerror = () => drawAll();
  drawAll();

  return tex;
}

/**
 * Dessine un tatouage en losange parfaitement centré du menton au bas du cou sur 8001.png.
 * Le modèle 3D sépare le cou en 2 îlots UV symétriques le long de la ligne médiane :
 * - Îlot gauche (x < 0) : ligne médiane à Y = 259, s'étend vers Y = 288 (+Y)
 * - Îlot droit (x > 0) : ligne médiane à Y = 219, s'étend vers Y = 190 (-Y)
 * - Axe vertical (gorge) : X = 472 (bas du cou / clavicules) à X = 438 (sous le menton)
 */
function drawSaraTorsoNeckTattooOnCanvas(ctx: CanvasRenderingContext2D) {
  const inkDark = 'rgba(14, 16, 22, 0.96)';
  const inkMedium = 'rgba(22, 24, 32, 0.85)';
  const inkFine = 'rgba(28, 30, 40, 0.65)';
  const rubyRed = 'rgba(185, 20, 34, 0.92)';

  const midX = 456; // Centre vertical de la gorge

  // Rendu symétrique sur les deux moitiés du cou (side = 1: gauche, side = -1: droite)
  for (const side of [1, -1]) {
    ctx.save();
    const midY = side === 1 ? 259 : 219;

    // Conversion coordonnées relatives en coordonnées canvas :
    // u = largeur transversale depuis la ligne médiane (0 à +largeur)
    // v = hauteur le long de la gorge (-bas_clavicules à +haut_menton)
    const toCanvas = (u: number, v: number): [number, number] => {
      return [midX - v, midY + side * u];
    };

    const drawHalfDiamond = (top: number, bottom: number, width: number) => {
      ctx.beginPath();
      let p = toCanvas(0, top);
      ctx.moveTo(p[0], p[1]);
      p = toCanvas(width, 0);
      ctx.lineTo(p[0], p[1]);
      p = toCanvas(0, bottom);
      ctx.lineTo(p[0], p[1]);
    };

    // 1. Grand losange extérieur (du menton au creux de la gorge)
    ctx.strokeStyle = inkDark;
    ctx.lineWidth = 1.6;
    drawHalfDiamond(19, -19, 23);
    ctx.stroke();

    // Bordure fine extérieure doublée
    ctx.strokeStyle = inkMedium;
    ctx.lineWidth = 0.9;
    drawHalfDiamond(16.5, -16.5, 20.5);
    ctx.stroke();

    // 2. Losange intermédiaire
    ctx.strokeStyle = inkDark;
    ctx.lineWidth = 1.2;
    drawHalfDiamond(12, -12, 14.5);
    ctx.stroke();

    // 3. Losange intérieur
    ctx.strokeStyle = inkDark;
    ctx.lineWidth = 1.0;
    drawHalfDiamond(6.5, -6.5, 8);
    ctx.stroke();

    // 4. Rubis rouge central (signature de Sara)
    ctx.fillStyle = rubyRed;
    drawHalfDiamond(4.2, -4.2, 5);
    ctx.lineTo(midX, midY);
    ctx.closePath();
    ctx.fill();

    // Cœur noir au centre
    ctx.fillStyle = inkDark;
    drawHalfDiamond(2, -2, 2.2);
    ctx.lineTo(midX, midY);
    ctx.closePath();
    ctx.fill();

    // 5. Rayons géométriques sacrés
    ctx.strokeStyle = inkFine;
    ctx.lineWidth = 0.7;
    // Rayon transversal
    let p1 = toCanvas(0, 0);
    let p2 = toCanvas(20, 0);
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();

    // Rayons verticaux haut et bas
    p1 = toCanvas(0, 16.5); p2 = toCanvas(0, 4.2);
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();

    p1 = toCanvas(0, -16.5); p2 = toCanvas(0, -4.2);
    ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();

    // Chevrons gothiques dans les quadrants
    for (const dv of [-8, 8]) {
      const pA = toCanvas(0, dv);
      const pB = toCanvas(7, dv - Math.sign(dv) * 3.5);
      ctx.beginPath(); ctx.moveTo(pA[0], pA[1]); ctx.lineTo(pB[0], pB[1]); ctx.stroke();
    }

    // Pointillisme le long des arêtes
    ctx.fillStyle = inkDark;
    for (let i = 1; i <= 7; i++) {
      const t = i / 8;
      const pTop = toCanvas(t * 23, 19 - t * 19);
      const pBot = toCanvas((1 - t) * 23, -19 * t);
      ctx.beginPath(); ctx.arc(pTop[0], pTop[1], 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pBot[0], pBot[1], 0.8, 0, Math.PI * 2); ctx.fill();
    }

    // 6. Finitions aux pointes (dessinées une seule fois le long de la ligne médiane)
    if (side === 1) {
      // Pointe supérieure (vers le menton)
      const pTop1 = toCanvas(0, 21.5);
      const pTop2 = toCanvas(0, 24);
      const pTop3 = toCanvas(0, 26);
      ctx.beginPath(); ctx.arc(pTop1[0], pTop1[1], 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pTop2[0], pTop2[1], 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pTop3[0], pTop3[1], 0.6, 0, Math.PI * 2); ctx.fill();

      // Pointe inférieure (gouttelette vers le bas de la gorge / clavicules)
      const pBot1 = toCanvas(0, -21.5);
      const pBot2 = toCanvas(0, -24.5);
      const pBot3 = toCanvas(0, -27);
      ctx.beginPath(); ctx.arc(pBot1[0], pBot1[1], 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pBot2[0], pBot2[1], 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pBot3[0], pBot3[1], 0.6, 0, Math.PI * 2); ctx.fill();
    }

    // Pointes latérales
    const pSide1 = toCanvas(25, 0);
    const pSide2 = toCanvas(27.5, 0);
    ctx.beginPath(); ctx.arc(pSide1[0], pSide1[1], 1.0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(pSide2[0], pSide2[1], 0.7, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}

/**
 * Applique des textures de peau et de tissu réalistes (mates) sur les modèles de Lara
 * pour éliminer la brillance excessive (effet plastique / latex) sous les éclairages PBR.
 */
export function applyLaraRealisticTextures(model: THREE.Object3D, realistic: boolean) {
  model.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.userData?.isCustomHair || mesh.userData?.isWigRoot) return;

    const meshName = (mesh.name || '').toLowerCase();
    const mat = mesh.material;
    if (!mat) return;

    const mats = Array.isArray(mat) ? mat : [mat];
    mats.forEach(m => {
      if (!m) return;
      const matName = (m.name || '').toLowerCase();

      // Sauvegarde des propriétés d'origine si non déjà sauvegardées
      if (m.userData.__origRoughness === undefined && 'roughness' in m) {
        m.userData.__origRoughness = (m as any).roughness;
      }
      if (m.userData.__origMetalness === undefined && 'metalness' in m) {
        m.userData.__origMetalness = (m as any).metalness;
      }
      if (m.userData.__origSpecularIntensity === undefined && 'specularIntensity' in m) {
        m.userData.__origSpecularIntensity = (m as any).specularIntensity;
      }

      // Restauration du mode d'origine si désactivé
      if (!realistic) {
        if (m.userData.__origRoughness !== undefined && 'roughness' in m) {
          (m as any).roughness = m.userData.__origRoughness;
        } else if ('roughness' in m) {
          (m as any).roughness = 0.5;
        }
        if (m.userData.__origMetalness !== undefined && 'metalness' in m) {
          (m as any).metalness = m.userData.__origMetalness;
        } else if ('metalness' in m) {
          (m as any).metalness = 0.0;
        }
        if (m.userData.__origSpecularIntensity !== undefined && 'specularIntensity' in m) {
          (m as any).specularIntensity = m.userData.__origSpecularIntensity;
        }
        m.needsUpdate = true;
        return;
      }

      // ── MODE RÉALISTE (MAT) ──────────────────────────────────────────────

      // 1. Métal / Armes / Boucles / Piercings : conserver l'aspect métallique brillant
      const isMetal = matName.includes('buckle') || meshName.includes('buckle') ||
                      matName.includes('metal') || meshName.includes('metal') ||
                      matName.includes('handgun') || meshName.includes('handgun') ||
                      matName.includes('piercing') || meshName.includes('piercing');
      if (isMetal) {
        return;
      }

      // 2. Verres et visières (lunettes)
      const isGlasses = matName.includes('glass') || meshName.includes('glass') || matName.includes('lens');
      if (isGlasses) {
        return;
      }

      // 3. Yeux (cornée et sclère) : éclat et reflets humides naturels
      const isEye = (matName.includes('eye') || meshName.includes('eye')) &&
                    !matName.includes('lash') && !meshName.includes('lash');
      if (isEye) {
        if ('roughness' in m) (m as any).roughness = 0.25;
        if ('metalness' in m) (m as any).metalness = 0.0;
        m.needsUpdate = true;
        return;
      }

      // 4. Cheveux et cils : matériau kératinique mat
      const isHairOrLash = matName.includes('hair') || meshName.includes('hair') ||
                           matName.includes('braid') || meshName.includes('braid') ||
                           matName.includes('pony') || meshName.includes('pony') ||
                           matName.includes('lash') || meshName.includes('lash');
      if (isHairOrLash) {
        if ('roughness' in m) (m as any).roughness = 0.85;
        if ('metalness' in m) (m as any).metalness = 0.0;
        if ('specularIntensity' in m) (m as any).specularIntensity = 0.0;
        m.needsUpdate = true;
        return;
      }

      // 5. Peau humaine (visage, bras, mains, torse, jambes, pieds, corps nu) :
      // Diélectrique naturel sans reflets huileux / plastiques
      const isSkin = matName.includes('skin') || matName.includes('face') || matName.includes('head') ||
                     matName.includes('body') || matName.includes('arm') || matName.includes('leg') ||
                     matName.includes('finger') || matName.includes('hand') || matName.includes('feet') ||
                     meshName.includes('face') || meshName.includes('arms') || meshName.includes('fingers') ||
                     meshName.includes('body_torso') || meshName.includes('body_legs') ||
                     meshName.includes('body_nude');
      if (isSkin) {
        if ('roughness' in m) (m as any).roughness = 0.82;
        if ('metalness' in m) (m as any).metalness = 0.0;
        if ('metalnessMap' in m) (m as any).metalnessMap = null;
        if ('specularIntensity' in m) (m as any).specularIntensity = 0.0;
        if ('specularIntensityMap' in m) (m as any).specularIntensityMap = null;
        if ('specularColorMap' in m) (m as any).specularColorMap = null;
        m.needsUpdate = true;
        return;
      }

      // 6. Cuir & chaussures (bottes, holsters, ceinturons) : finition cuir souple satinée
      const isLeather = matName.includes('gear') || meshName.includes('gear') ||
                        matName.includes('holster') || meshName.includes('holster') ||
                        matName.includes('boot') || meshName.includes('boot');
      if (isLeather) {
        if ('roughness' in m) (m as any).roughness = 0.78;
        if ('metalness' in m) (m as any).metalness = 0.0;
        if ('metalnessMap' in m) (m as any).metalnessMap = null;
        if ('specularIntensity' in m) (m as any).specularIntensity = 0.05;
        if ('specularIntensityMap' in m) (m as any).specularIntensityMap = null;
        if ('specularColorMap' in m) (m as any).specularColorMap = null;
        m.needsUpdate = true;
        return;
      }

      // 7. Vêtements & tissus (t-shirt, débardeur, short, sac à dos, gants, sous-vêtements) :
      // Coton, denim, toile de sac = diélectriques parfaitement mats
      if ('roughness' in m) (m as any).roughness = 0.85;
      if ('metalness' in m) (m as any).metalness = 0.0;
      if ('metalnessMap' in m) (m as any).metalnessMap = null;
      if ('specularIntensity' in m) (m as any).specularIntensity = 0.0;
      if ('specularIntensityMap' in m) (m as any).specularIntensityMap = null;
      if ('specularColorMap' in m) (m as any).specularColorMap = null;
      m.needsUpdate = true;
    });
  });
}

