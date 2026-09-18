import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

export interface GlobalSkeletonHelpersProps {
  show: boolean;
  enableInfluence?: boolean;
  selectedBoneName?: string | null;
  onSelectBoneName?: (name: string | null) => void;
}

// Convertit un poids [0.0, 1.0] en couleur de heatmap style Sketchfab / Blender Weight Paint
function weightToColor(w: number, out: THREE.Color) {
  if (w <= 0.0001) {
    out.setRGB(0.06, 0.10, 0.30); // Fond bleu foncé (poids zéro)
    return;
  }
  const clamped = Math.max(0, Math.min(1, w));
  if (clamped < 0.25) {
    const t = clamped / 0.25;
    out.setRGB(0.06 * (1 - t), 0.10 + 0.75 * t, 0.30 + 0.65 * t); // Bleu -> Cyan
  } else if (clamped < 0.5) {
    const t = (clamped - 0.25) / 0.25;
    out.setRGB(0.0, 0.85 + 0.12 * t, 0.95 * (1 - t)); // Cyan -> Vert
  } else if (clamped < 0.75) {
    const t = (clamped - 0.5) / 0.25;
    out.setRGB(0.95 * t, 0.97, 0.0); // Vert -> Jaune
  } else {
    const t = (clamped - 0.75) / 0.25;
    out.setRGB(0.95 + 0.05 * t, 0.97 * (1 - t), 0.0); // Jaune -> Rouge vif
  }
}

export function GlobalSkeletonHelpers({
  show,
  enableInfluence = true,
  selectedBoneName: externalSelectedName,
  onSelectBoneName
}: GlobalSkeletonHelpersProps) {
  const { scene, camera, gl } = useThree();
  const helpersRef = useRef<Map<THREE.Bone, THREE.SkeletonHelper>>(new Map());

  // État de survol et de sélection des os
  const [hoveredBoneInfo, setHoveredBoneInfo] = useState<{ bone: THREE.Bone; pos: THREE.Vector3 } | null>(null);
  const [internalSelectedBone, setInternalSelectedBone] = useState<THREE.Bone | null>(null);

  const activeSelectedBone = useRef<THREE.Bone | null>(null);
  const activeSelectedName = externalSelectedName !== undefined ? externalSelectedName : (internalSelectedBone?.name || null);

  // Sauvegarde des matériaux originaux et attributs color des SkinnedMeshes pour la heatmap
  const modifiedMeshesRef = useRef<Map<THREE.SkinnedMesh, THREE.Material | THREE.Material[]>>(new Map());
  const originalColorsRef = useRef<Map<THREE.SkinnedMesh, THREE.BufferAttribute | THREE.InterleavedBufferAttribute>>(new Map());

  // Vecteurs temporaires pour les calculs géométriques
  const bonePosRef = useRef(new THREE.Vector3());
  const childPosRef = useRef(new THREE.Vector3());
  const screenPosRef = useRef(new THREE.Vector3());
  const screenChildRef = useRef(new THREE.Vector3());
  const candidatePosRef = useRef(new THREE.Vector3());

  // Réinitialiser les matériaux modifiés pour la heatmap d'influence
  const restoreOriginalMaterials = useCallback(() => {
    modifiedMeshesRef.current.forEach((origMat, mesh) => {
      mesh.material = origMat;
      if (Array.isArray(origMat)) {
        origMat.forEach(m => { m.needsUpdate = true; });
      } else if (origMat) {
        origMat.needsUpdate = true;
      }
      const origColor = originalColorsRef.current.get(mesh);
      if (origColor && mesh.geometry) {
        mesh.geometry.setAttribute('color', origColor);
        mesh.geometry.attributes.color.needsUpdate = true;
      } else if (mesh.geometry && mesh.geometry.attributes.color) {
        mesh.geometry.deleteAttribute('color');
      }
    });
    modifiedMeshesRef.current.clear();
    originalColorsRef.current.clear();
  }, []);

  // Appliquer la heatmap d'influence style Sketchfab pour l'os sélectionné
  const applyBoneInfluenceHeatmap = useCallback((bone: THREE.Bone | null) => {
    restoreOriginalMaterials();
    if (!bone || !enableInfluence) return;

    const tmpColor = new THREE.Color();

    scene.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = child as THREE.SkinnedMesh;
        if (!mesh.skeleton || !mesh.geometry) return;

        const boneIdx = mesh.skeleton.bones.indexOf(bone);
        if (boneIdx < 0) return; // Cet os n'appartient pas à ce squelette

        const geom = mesh.geometry;
        const skinIndexAttr = geom.attributes.skinIndex;
        const skinWeightAttr = geom.attributes.skinWeight;
        if (!skinIndexAttr || !skinWeightAttr) return;

        const count = geom.attributes.position.count;
        const colors = new Float32Array(count * 3);
        let maxWeight = 0;

        for (let i = 0; i < count; i++) {
          let totalWeight = 0;
          for (let c = 0; c < 4; c++) {
            if (skinIndexAttr.getComponent(i, c) === boneIdx) {
              totalWeight += skinWeightAttr.getComponent(i, c);
            }
          }
          if (totalWeight > maxWeight) maxWeight = totalWeight;
          weightToColor(totalWeight, tmpColor);
          colors[i * 3] = tmpColor.r;
          colors[i * 3 + 1] = tmpColor.g;
          colors[i * 3 + 2] = tmpColor.b;
        }

        // Si cet os n'a aucune influence sur ce mesh spécifique, ne pas altérer son matériau
        if (maxWeight <= 0.0001) return;

        // Sauvegarder le matériau d'origine et l'attribut color
        if (!modifiedMeshesRef.current.has(mesh)) {
          modifiedMeshesRef.current.set(mesh, mesh.material);
          if (geom.attributes.color) {
            originalColorsRef.current.set(mesh, geom.attributes.color.clone());
          }
        }

        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geom.attributes.color.needsUpdate = true;

        // Matériau affichant les vertex colors
        const heatMat = new THREE.MeshBasicMaterial({
          vertexColors: true,
          wireframe: false,
          depthTest: true,
          depthWrite: true,
        });
        mesh.material = heatMat;
      }
    });
  }, [enableInfluence, restoreOriginalMaterials, scene]);

  // Synchronisation de l'os sélectionné avec la heatmap
  useEffect(() => {
    if (!show) {
      restoreOriginalMaterials();
      return;
    }

    let targetBone: THREE.Bone | null = null;
    if (activeSelectedName) {
      scene.traverse((o) => {
        if ((o as any).isBone && o.name === activeSelectedName) {
          targetBone = o as THREE.Bone;
        }
      });
    }

    activeSelectedBone.current = targetBone;
    applyBoneInfluenceHeatmap(targetBone);
  }, [show, activeSelectedName, applyBoneInfluenceHeatmap, restoreOriginalMaterials, scene]);

  // Détection du survol de l'os via useFrame
  useFrame(({ pointer }) => {
    if (!show) {
      if (hoveredBoneInfo) setHoveredBoneInfo(null);
      return;
    }

    const canvasW = gl.domElement.clientWidth;
    const canvasH = gl.domElement.clientHeight;
    if (canvasW <= 0 || canvasH <= 0) return;

    const mouseX = (pointer.x * 0.5 + 0.5) * canvasW;
    const mouseY = (-pointer.y * 0.5 + 0.5) * canvasH;

    let bestDist = 24.0; // Seuil de détection en pixels sur l'écran
    let candidateBone: THREE.Bone | null = null;

    helpersRef.current.forEach((_helper, topBone) => {
      topBone.traverse((obj) => {
        if (!(obj as any).isBone) return;
        const bone = obj as THREE.Bone;

        bone.getWorldPosition(bonePosRef.current);
        screenPosRef.current.copy(bonePosRef.current).project(camera);

        if (screenPosRef.current.z > 1.0) return; // Derrière la caméra

        const sx = (screenPosRef.current.x * 0.5 + 0.5) * canvasW;
        const sy = (-screenPosRef.current.y * 0.5 + 0.5) * canvasH;
        const dJoint = Math.hypot(sx - mouseX, sy - mouseY);

        if (dJoint < bestDist) {
          bestDist = dJoint;
          candidateBone = bone;
          candidatePosRef.current.copy(bonePosRef.current);
        }

        // Tester également la ligne vers chaque os enfant
        for (let i = 0; i < bone.children.length; i++) {
          const child = bone.children[i];
          if (!(child as any).isBone) continue;

          child.getWorldPosition(childPosRef.current);
          screenChildRef.current.copy(childPosRef.current).project(camera);
          if (screenChildRef.current.z > 1.0) continue;

          const cx = (screenChildRef.current.x * 0.5 + 0.5) * canvasW;
          const cy = (-screenChildRef.current.y * 0.5 + 0.5) * canvasH;

          const segLenSq = (cx - sx) * (cx - sx) + (cy - sy) * (cy - sy);
          if (segLenSq > 1e-4) {
            const t = Math.max(0, Math.min(1, ((mouseX - sx) * (cx - sx) + (mouseY - sy) * (cy - sy)) / segLenSq));
            const px = sx + t * (cx - sx);
            const py = sy + t * (cy - sy);
            const dSeg = Math.hypot(px - mouseX, py - mouseY);

            if (dSeg < bestDist) {
              bestDist = dSeg;
              candidateBone = bone;
              candidatePosRef.current.copy(bonePosRef.current).lerp(childPosRef.current, t);
            }
          }
        }
      });
    });

    if (candidateBone) {
      if (!hoveredBoneInfo || hoveredBoneInfo.bone !== candidateBone) {
        setHoveredBoneInfo({ bone: candidateBone, pos: candidatePosRef.current.clone() });
      } else {
        hoveredBoneInfo.pos.copy(candidatePosRef.current);
      }
    } else if (hoveredBoneInfo) {
      setHoveredBoneInfo(null);
    }
  });

  // Gestion du clic pour sélectionner un os et afficher son influence
  useEffect(() => {
    if (!show) return;

    const dom = gl.domElement;
    let downTime = 0;
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downTime = Date.now();
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      // Ignorer si l'utilisateur a glissé pour orbiter la caméra
      if (Date.now() - downTime > 350 || Math.hypot(e.clientX - downX, e.clientY - downY) > 6) {
        return;
      }

      if (hoveredBoneInfo) {
        const boneName = hoveredBoneInfo.bone.name;
        const newSelected = activeSelectedName === boneName ? null : boneName;
        if (onSelectBoneName) {
          onSelectBoneName(newSelected);
        } else {
          setInternalSelectedBone(newSelected ? hoveredBoneInfo.bone : null);
        }
      } else if (activeSelectedName) {
        // Clic dans le vide -> désélectionner
        if (onSelectBoneName) {
          onSelectBoneName(null);
        } else {
          setInternalSelectedBone(null);
        }
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointerup', onPointerUp);

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerUp);
    };
  }, [show, hoveredBoneInfo, activeSelectedName, onSelectBoneName, gl.domElement]);

  // Intervalle de mise à jour des helpers de squelette
  useEffect(() => {
    if (!show) {
      helpersRef.current.forEach((helper) => {
        helper.removeFromParent();
        helper.dispose();
      });
      helpersRef.current.clear();
      restoreOriginalMaterials();
      return;
    }

    const interval = setInterval(() => {
      const currentTopBones = new Set<THREE.Bone>();

      scene.traverse((child) => {
        if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
          const skinnedMesh = child as THREE.SkinnedMesh;
          let isVis = skinnedMesh.visible;
          let p: THREE.Object3D | null = skinnedMesh.parent;
          while (p && isVis) {
            if (!p.visible) isVis = false;
            p = p.parent;
          }
          if (!isVis) return;

          if (skinnedMesh.skeleton && skinnedMesh.skeleton.bones.length > 0) {
            const hipsBone = skinnedMesh.skeleton.bones.find((b: any) => {
              const nl = (b.name || '').toLowerCase();
              return nl.includes('hips') || nl.includes('pelvis');
            });
            let topBone = hipsBone || skinnedMesh.skeleton.bones[0];
            while (topBone.parent && (topBone.parent as THREE.Bone).isBone) {
              topBone = topBone.parent as THREE.Bone;
            }
            currentTopBones.add(topBone);
          }
        }
      });

      // Ajouter helpers
      currentTopBones.forEach(topBone => {
        if (!helpersRef.current.has(topBone)) {
          const helper = new THREE.SkeletonHelper(topBone);
          const mat = helper.material as THREE.LineBasicMaterial;
          mat.color.set(0x00ffff);
          mat.depthTest = false;
          helper.renderOrder = 99999;
          helper.raycast = () => {};
          helper.traverse(c => { c.raycast = () => {}; });

          scene.add(helper);
          helpersRef.current.set(topBone, helper);
        }
      });

      // Supprimer helpers obsolètes
      helpersRef.current.forEach((helper, topBone) => {
        if (!currentTopBones.has(topBone)) {
          helper.removeFromParent();
          helper.dispose();
          helpersRef.current.delete(topBone);
        }
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      helpersRef.current.forEach((helper) => {
        helper.removeFromParent();
        helper.dispose();
      });
      helpersRef.current.clear();
      restoreOriginalMaterials();
    };
  }, [show, scene, restoreOriginalMaterials]);

  // Si le squelette n'est pas affiché, ne rien rendre
  if (!show) return null;

  const displayBone = hoveredBoneInfo?.bone || activeSelectedBone.current;
  const displayPos = hoveredBoneInfo?.pos || (activeSelectedBone.current ? activeSelectedBone.current.getWorldPosition(new THREE.Vector3()) : null);
  const isSelected = Boolean(activeSelectedBone.current && displayBone === activeSelectedBone.current);

  return (
    <>
      {displayBone && displayPos && (
        <Html
          position={[displayPos.x, displayPos.y, displayPos.z]}
          style={{
            pointerEvents: 'none',
            transform: 'translate3d(-50%, -130%, 0)',
            transition: 'transform 0.05s ease-out',
            zIndex: 10000
          }}
        >
          <div
            style={{
              background: isSelected ? 'rgba(230, 57, 70, 0.95)' : 'rgba(15, 23, 42, 0.92)',
              color: '#ffffff',
              border: `1px solid ${isSelected ? '#ff7979' : '#38bdf8'}`,
              borderRadius: 6,
              padding: '3px 9px',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>🦴</span>
            <span>{displayBone.name}</span>
            {isSelected && (
              <span
                style={{
                  fontSize: 9,
                  background: '#ffffff',
                  color: '#e63946',
                  padding: '1px 4px',
                  borderRadius: 3,
                  fontWeight: 800
                }}
              >
                INFLUENCE ACTIVE
              </span>
            )}
          </div>
        </Html>
      )}
    </>
  );
}
