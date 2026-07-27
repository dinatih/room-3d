import * as THREE from 'three';

export type LaraVariant = 'native' | 'rosanna' | 'marissa' | 'delphina' | 'sara' | 'cha' | 'vivid' | 'sabira' | 'safa' | 'sandra';

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
  const isSandra = style === 'sandra';

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
          } else if (isMarissa) {
             mat.map = null;
             mat.color.setHex(0x3a2312); // Châtain foncé
             mat.emissive.setHex(0x221308);
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
           
           if (isDelphina) {
              mat.color.setHex(0xffffff);
              mat.map = getTexture('media/textures/8003_blue.png');
           } else if (isCha) {
              mat.color.setHex(0xffffff);
              mat.map = getTexture('media/textures/8003_green.png');
           } else if (isMarissa) {
              mat.color.setHex(0xffffff);
              mat.map = getTexture('media/textures/8003_black.png');
           } else {
              mat.color.setHex(0xffffff);
              // Default brown texture for all other Laras
              mat.map = getTexture('media/textures/8003.png');
           }
           mat.needsUpdate = true;
        }

        // TEXTURE REPLACEMENTS FOR CHA (SUPERMAN TOP, RED BOOTS, GOLDEN SOCKS)
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

        // CLOTHING COLOR-IFICATION
        if (!isNative) {
          const isTop = matName.toLowerCase().includes('top') || matName.toLowerCase().includes('shirt') || matName.toLowerCase().includes('tank') || meshName.toLowerCase().includes('shirt');
          const isBackpack = matName.toLowerCase().includes('backpack') || matName.toLowerCase().includes('bag') || matName.toLowerCase().includes('pack');

          const isBuckle = matName.toLowerCase().includes('buckle');
          const isGear = matName.toLowerCase().includes('gear') || matName.toLowerCase().includes('holster');
          
          const shouldColor = !isSkin && !isEye && !isLash && !isMouth && !isHair && !isBuckle && 
                              !(isCha && (isShirt || isBoot)) && 
                              !(isSabira && !isTop);

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
               } else if (isTop || isBackpack || isGear) {
                 color = 0x151515; // Noir mat
                 forceProcedural = true;
               } else if (isBoot) {
                 color = 0xffffff; // Boots stay pure white
                 forceProcedural = true;
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
            } else if (isSandra) {
               if (isTop) {
                 color = 0x050505; // Black shirt
                 forceProcedural = true;
               } else if (isShorts) {
                 color = 0xff0000; // Red shorts
                 forceProcedural = true;
               } else {
                 color = 0x050505; // Black boots
                 forceProcedural = true;
               }
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
        if (isMarissa && isSkin && (matName.includes('arm') || matName.includes('body') || meshName.includes('arm') || meshName.includes('body'))) {
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
      const studGeo = new THREE.SphereGeometry(0.0038, 16, 16);
      const studMesh = new THREE.Mesh(studGeo, piercingMat);
      studMesh.name = 'MarissaCupidPiercing';
      studMesh.position.set(0.000, 0.106, 0.063);
      headBone.add(studMesh);

      // 2. Narine Gauche - Boucle / Anneau (Torus ring) sur l'aile de la narine gauche
      const ringGeo = new THREE.TorusGeometry(0.0038, 0.0011, 12, 24);
      const ringMesh = new THREE.Mesh(ringGeo, piercingMat);
      ringMesh.name = 'MarissaNostrilPiercing';
      ringMesh.position.set(0.014, 0.120, 0.046);
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
  img.src = 'media/textures/8001.png';
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

  // ── 2. TATOUAGE TEXTE "BEAUTY IS AS BEAUTY DOES" (Face avant, haut de cuisse gauche, près du holster) ──
  ctx.save();
  ctx.translate(186, 465);
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
