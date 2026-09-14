import * as THREE from 'three';

export type LaraVariant = 'native' | 'rosanna' | 'marissa' | 'delphina' | 'sara' | 'cha' | 'vivida' | 'sabira' | 'safa' | 'sandra' | 'rajaa' | 'angelina' | 'romana' | 'lgbta';

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

function createGrayscaleTexture(
  originalTex: THREE.Texture,
  mode: 'vivida' | 'light' | 'white-boost' | 'standard' = 'standard'
): THREE.Texture | null {
  if (!originalTex || !originalTex.image) return null;
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
  if (delphinaTattooTextureCache['delphina_tattoos']) {
    return delphinaTattooTextureCache['delphina_tattoos'];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.flipY = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  delphinaTattooTextureCache['delphina_tattoos'] = tex;

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
  const inkDark = 'rgba(16, 18, 24, 0.95)';

  function drawFlower(
    cx: number,
    cy: number,
    radius: number,
    numPetals: number,
    angleOffset = 0,
    colorAccent = 'rgba(220, 80, 110, 0.75)'
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
      ctx.bezierCurveTo(-radius * 0.45, -radius * 0.5, -radius * 0.4, -radius, 0, -radius * 1.15);
      ctx.bezierCurveTo(radius * 0.4, -radius, radius * 0.45, -radius * 0.5, 0, 0);
      ctx.fillStyle = 'rgba(24, 26, 34, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(12, 14, 18, 0.95)';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      if (colorAccent) {
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.quadraticCurveTo(-radius * 0.2, -radius * 0.45, 0, -radius * 0.75);
        ctx.quadraticCurveTo(radius * 0.2, -radius * 0.45, 0, -2);
        ctx.fillStyle = colorAccent;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(0, -radius * 0.85);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(18, 18, 22, 0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(230, 190, 80, 0.85)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 230, 140, 0.9)';
    for (let j = 0; j < 6; j++) {
      const a = (j * Math.PI * 2) / 6;
      const r = radius * 0.16;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLeaf(bx: number, by: number, length: number, angle: number, width = length * 0.42) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-width, -length * 0.4, -width * 0.8, -length * 0.85, 0, -length);
    ctx.bezierCurveTo(width * 0.8, -length * 0.85, width, -length * 0.4, 0, 0);
    ctx.fillStyle = 'rgba(22, 32, 26, 0.82)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(14, 18, 16, 0.95)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length * 0.92);
    ctx.strokeStyle = 'rgba(80, 160, 100, 0.45)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
  }

  // ── 1. TATOUAGE FLORAL LE LONG DES BRAS (Épaule -> Poignet) ──
  ctx.save();
  ctx.strokeStyle = inkDark;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(75, 250);
  ctx.bezierCurveTo(105, 235, 135, 260, 168, 242);
  ctx.bezierCurveTo(200, 225, 230, 248, 260, 226);
  ctx.bezierCurveTo(280, 215, 298, 245, 318, 225);
  ctx.stroke();

  // Vrille secondaire entrelacée
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(25, 28, 38, 0.75)';
  ctx.beginPath();
  ctx.moveTo(85, 242);
  ctx.bezierCurveTo(115, 255, 145, 230, 180, 252);
  ctx.bezierCurveTo(210, 240, 240, 220, 275, 242);
  ctx.bezierCurveTo(295, 235, 305, 220, 315, 230);
  ctx.stroke();

  // Fleurs le long du bras
  drawFlower(85, 248, 10, 5, 0.2, 'rgba(235, 100, 130, 0.85)');
  drawFlower(125, 245, 12, 6, 0.8, 'rgba(220, 80, 120, 0.9)');
  drawFlower(168, 240, 9.5, 5, 0.5, 'rgba(240, 120, 145, 0.8)');
  drawFlower(208, 232, 13, 6, 1.2, 'rgba(215, 75, 115, 0.9)');
  drawFlower(252, 234, 11, 5, 0.4, 'rgba(230, 95, 130, 0.85)');
  drawFlower(290, 228, 9, 5, 0.9, 'rgba(245, 130, 155, 0.8)');
  drawFlower(314, 226, 6.5, 4, 0.3, 'rgba(250, 150, 170, 0.75)');

  // Feuilles botaniques
  const armLeaves: [number, number, number, number][] = [
    [80, 240, 11, -1.1], [102, 252, 12, 1.3], [115, 238, 10, -0.8],
    [142, 255, 13, 1.5], [155, 235, 11, -1.3], [185, 232, 12, -0.6],
    [195, 248, 13, 1.7], [225, 228, 14, -1.2], [238, 245, 12, 1.4],
    [270, 222, 11, -0.9], [282, 240, 12, 1.5], [305, 222, 8, -1.0]
  ];
  for (const [lx, ly, llen, lang] of armLeaves) {
    drawLeaf(lx, ly, llen, lang);
  }

  // Pétales flottants
  const armPetals: [number, number][] = [[95, 255], [135, 232], [178, 252], [220, 222], [265, 248], [300, 218]];
  ctx.fillStyle = 'rgba(235, 110, 140, 0.85)';
  for (const [px, py] of armPetals) {
    ctx.beginPath(); ctx.ellipse(px, py, 2.2, 1.2, 0.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // ── 2. TATOUAGE FLORAL LE LONG DES JAMBES (Cuisse -> Genou -> Mollet) ──
  ctx.save();
  ctx.strokeStyle = inkDark;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(48, 415);
  ctx.bezierCurveTo(75, 435, 100, 395, 130, 420);
  ctx.bezierCurveTo(160, 440, 185, 385, 215, 412);
  ctx.bezierCurveTo(240, 430, 255, 390, 275, 405);
  ctx.stroke();

  ctx.lineWidth = 0.9;
  ctx.strokeStyle = 'rgba(25, 28, 38, 0.75)';
  ctx.beginPath();
  ctx.moveTo(60, 405);
  ctx.bezierCurveTo(90, 390, 115, 430, 148, 408);
  ctx.bezierCurveTo(175, 390, 200, 435, 230, 400);
  ctx.bezierCurveTo(250, 385, 265, 420, 280, 398);
  ctx.stroke();

  // Fleurs le long de la jambe
  drawFlower(55, 418, 11, 6, 0.3, 'rgba(225, 85, 125, 0.85)');
  drawFlower(92, 405, 14, 6, 1.0, 'rgba(210, 70, 115, 0.9)');
  drawFlower(132, 416, 15, 7, 0.6, 'rgba(230, 90, 130, 0.88)');
  drawFlower(172, 410, 12, 5, 1.4, 'rgba(215, 75, 120, 0.85)');
  drawFlower(215, 412, 13.5, 6, 0.7, 'rgba(220, 80, 125, 0.88)');
  drawFlower(252, 402, 11, 5, 1.1, 'rgba(235, 105, 140, 0.8)');
  drawFlower(276, 404, 8, 5, 0.4, 'rgba(245, 125, 155, 0.75)');

  // Feuilles botaniques
  const legLeaves: [number, number, number, number][] = [
    [50, 425, 12, 1.1], [70, 410, 13, -1.2], [82, 430, 14, 1.6],
    [110, 395, 15, -0.9], [122, 435, 14, 1.7], [148, 425, 13, 0.8],
    [160, 392, 14, -1.3], [185, 430, 15, 1.5], [200, 395, 13, -1.0],
    [228, 425, 12, 1.4], [240, 392, 11, -1.2], [265, 415, 10, 1.2]
  ];
  for (const [lx, ly, llen, lang] of legLeaves) {
    drawLeaf(lx, ly, llen, lang, llen * 0.44);
  }

  // Pétales flottants le long de la jambe
  const legPetals: [number, number][] = [[68, 435], [105, 385], [145, 445], [188, 380], [225, 438], [260, 388]];
  ctx.fillStyle = 'rgba(235, 105, 135, 0.85)';
  for (const [px, py] of legPetals) {
    ctx.beginPath(); ctx.ellipse(px, py, 2.5, 1.4, 0.8, 0, Math.PI * 2); ctx.fill();
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
