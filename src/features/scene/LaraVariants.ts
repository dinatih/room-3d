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
             mat.map = null; // Kill dark texture to see blonde-chatain
             mat.color.setHex(0xbc9c74); // Blonde-chatain
             mat.emissive.setHex(0xbc9c74);
             mat.emissiveIntensity = 0.05;
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
                              !(isSabira && !isTop) &&
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
                if (isTop || isShorts) {
                  color = 0xffd700; // Yellow top / shorts
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
                  const idx = matArray.indexOf(originalMat as any);
                  if (idx !== -1) clonedMats[idx] = newMat;
                  mesh.material = clonedMats;
              }
            }
          }
        }

        // MARISSA TATTOOS ON SKIN (Lion head on forearm, Skull on thigh)
        // Ne pas appliquer sur body_nude qui possède son propre UV mapping XPS complet
        if (isMarissa && isSkin && (matName.includes('arm') || matName.includes('body') || meshName.includes('arm') || meshName.includes('body')) && !meshName.includes('nude')) {
          applyMarissaTattoos(mat);
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

  // ── 2. TATOUAGE TEXTE "BEAUTY IS AS BEAUTY DOES" (Face avant, mi-cuisse gauche, horizontal) ──
  ctx.save();
  ctx.translate(186, 398);
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
