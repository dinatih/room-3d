import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { SkeletonGroup, BoneHierarchyNode } from './skeletonTypes';

export interface GlobalSkeletonHelpersProps {
  show: boolean;
  enableInfluence?: boolean;
  selectedBoneName?: string | null;
  onSelectBoneName?: (name: string | null) => void;
  onSkeletonGroupsChange?: (groups: SkeletonGroup[]) => void;
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

function buildBoneNode(bone: THREE.Bone, visited = new Set<THREE.Bone>()): BoneHierarchyNode {
  visited.add(bone);
  const children: BoneHierarchyNode[] = [];
  for (let i = 0; i < bone.children.length; i++) {
    const child = bone.children[i];
    if ((child as any).isBone && !visited.has(child as THREE.Bone)) {
      children.push(buildBoneNode(child as THREE.Bone, visited));
    }
  }
  return {
    name: bone.name || 'Sans-nom',
    bone,
    children,
  };
}

function countBonesInNode(node: BoneHierarchyNode): number {
  let count = 1;
  for (let i = 0; i < node.children.length; i++) {
    count += countBonesInNode(node.children[i]);
  }
  return count;
}

export function GlobalSkeletonHelpers({
  show,
  enableInfluence = true,
  selectedBoneName: externalSelectedName,
  onSelectBoneName,
  onSkeletonGroupsChange,
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

  // Références 3D pour la mise en évidence de l'os sélectionné
  const selectedJointMeshRef = useRef<THREE.Mesh>(null);
  const selectedRingMeshRef = useRef<THREE.Mesh>(null);
  const selectedLinesRef = useRef<THREE.LineSegments>(null);
  const selectedLinesGeomRef = useRef<THREE.BufferGeometry>(null);

  // Référence 3D pour l'os survolé
  const hoveredJointMeshRef = useRef<THREE.Mesh>(null);

  // Signature précédente des groupes pour éviter les re-renders inutiles
  const prevGroupsSigRef = useRef<string>('');

  // Réinitialiser les matériaux modifiés pour la heatmap d'influence
  const restoreOriginalMaterials = useCallback(() => {
    modifiedMeshesRef.current.forEach((origMat, mesh) => {
      mesh.material = origMat;
      if (Array.isArray(origMat)) {
        origMat.forEach((m) => { m.needsUpdate = true; });
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

  // Détection du survol de l'os via useFrame et mise à jour de la mise en évidence 3D
  useFrame((state) => {
    if (!show) {
      if (hoveredBoneInfo) setHoveredBoneInfo(null);
      if (selectedJointMeshRef.current) selectedJointMeshRef.current.visible = false;
      if (selectedRingMeshRef.current) selectedRingMeshRef.current.visible = false;
      if (selectedLinesRef.current) selectedLinesRef.current.visible = false;
      if (hoveredJointMeshRef.current) hoveredJointMeshRef.current.visible = false;
      return;
    }

    const targetBone = activeSelectedBone.current;

    // --- Mise à jour visuelle 3D de l'os sélectionné ---
    if (targetBone) {
      targetBone.getWorldPosition(bonePosRef.current);
      const bPos = bonePosRef.current;

      // Position de la sphère et de l'anneau de sélection
      if (selectedJointMeshRef.current) {
        selectedJointMeshRef.current.position.copy(bPos);
        selectedJointMeshRef.current.visible = true;
      }
      if (selectedRingMeshRef.current) {
        selectedRingMeshRef.current.position.copy(bPos);
        selectedRingMeshRef.current.quaternion.copy(camera.quaternion);
        // Légère pulsation subtile de l'anneau
        const pulse = 1.0 + 0.15 * Math.sin(state.clock.getElapsedTime() * 6);
        selectedRingMeshRef.current.scale.set(pulse, pulse, pulse);
        selectedRingMeshRef.current.visible = true;
      }

      // Lignes de connexion de l'os sélectionné (vers parent et vers enfants)
      if (selectedLinesGeomRef.current) {
        const linePoints: number[] = [];

        // Segment depuis le parent (si parent est un Bone)
        if (targetBone.parent && (targetBone.parent as any).isBone) {
          (targetBone.parent as THREE.Bone).getWorldPosition(childPosRef.current);
          linePoints.push(
            childPosRef.current.x, childPosRef.current.y, childPosRef.current.z,
            bPos.x, bPos.y, bPos.z
          );
        }

        // Segments vers chaque enfant qui est un Bone
        for (let i = 0; i < targetBone.children.length; i++) {
          const child = targetBone.children[i];
          if ((child as any).isBone) {
            child.getWorldPosition(childPosRef.current);
            linePoints.push(
              bPos.x, bPos.y, bPos.z,
              childPosRef.current.x, childPosRef.current.y, childPosRef.current.z
            );
          }
        }

        if (linePoints.length > 0) {
          selectedLinesGeomRef.current.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(linePoints, 3)
          );
          if (selectedLinesRef.current) selectedLinesRef.current.visible = true;
        } else if (selectedLinesRef.current) {
          selectedLinesRef.current.visible = false;
        }
      }
    } else {
      if (selectedJointMeshRef.current) selectedJointMeshRef.current.visible = false;
      if (selectedRingMeshRef.current) selectedRingMeshRef.current.visible = false;
      if (selectedLinesRef.current) selectedLinesRef.current.visible = false;
    }

    // --- Raycast 2D écran pour survoler les os ---
    const canvasW = gl.domElement.clientWidth;
    const canvasH = gl.domElement.clientHeight;
    if (canvasW <= 0 || canvasH <= 0) return;

    const mouseX = (state.pointer.x * 0.5 + 0.5) * canvasW;
    const mouseY = (-state.pointer.y * 0.5 + 0.5) * canvasH;

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

      // Marqueur au survol
      if (hoveredJointMeshRef.current) {
        if (candidateBone !== targetBone) {
          hoveredJointMeshRef.current.position.copy(candidatePosRef.current);
          hoveredJointMeshRef.current.visible = true;
        } else {
          hoveredJointMeshRef.current.visible = false;
        }
      }
    } else {
      if (hoveredBoneInfo) setHoveredBoneInfo(null);
      if (hoveredJointMeshRef.current) hoveredJointMeshRef.current.visible = false;
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

  // Intervalle de mise à jour des helpers de squelette et extraction de la hiérarchie
  useEffect(() => {
    if (!show) {
      helpersRef.current.forEach((helper) => {
        helper.removeFromParent();
        helper.dispose();
      });
      helpersRef.current.clear();
      restoreOriginalMaterials();
      prevGroupsSigRef.current = '';
      onSkeletonGroupsChange?.([]);
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
            const meshBones = skinnedMesh.skeleton.bones;
            const boneSet = new Set(meshBones);

            // Trouver les racines d'os
            const roots = meshBones.filter((b) => !b.parent || !(b.parent as any).isBone || !boneSet.has(b.parent as THREE.Bone));
            roots.forEach((b) => {
              let top = b;
              while (top.parent && (top.parent as any).isBone) {
                top = top.parent as THREE.Bone;
              }
              currentTopBones.add(top);
            });
          }
        }
      });

      // Ajouter helpers SkeletonHelper pour chaque topBone
      currentTopBones.forEach((topBone) => {
        if (!helpersRef.current.has(topBone)) {
          const helper = new THREE.SkeletonHelper(topBone);
          const mat = helper.material as THREE.LineBasicMaterial;
          mat.color.set(0x00d4ff);
          mat.depthTest = false;
          helper.renderOrder = 99990;
          helper.raycast = () => {};
          helper.traverse((c) => { c.raycast = () => {}; });

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

      // --- Construction de la hiérarchie des squelettes ---
      if (onSkeletonGroupsChange) {
        const foundGroups: SkeletonGroup[] = [];
        const visitedTopBones = new Set<THREE.Bone>();

        currentTopBones.forEach((topBone) => {
          if (visitedTopBones.has(topBone)) return;
          visitedTopBones.add(topBone);

          const relatedMeshNames: string[] = [];
          const topBoneDescendants = new Set<THREE.Bone>();
          topBone.traverse((obj) => {
            if ((obj as any).isBone) topBoneDescendants.add(obj as THREE.Bone);
          });

          scene.traverse((child) => {
            if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
              const sm = child as THREE.SkinnedMesh;
              if (sm.skeleton && sm.skeleton.bones.some((b) => topBoneDescendants.has(b))) {
                if (sm.name && !relatedMeshNames.includes(sm.name)) {
                  relatedMeshNames.push(sm.name);
                }
              }
            }
          });

          const allNamesCombined = (
            topBone.name + ' ' +
            Array.from(topBoneDescendants).map((b) => b.name).join(' ') + ' ' +
            relatedMeshNames.join(' ')
          ).toLowerCase();

          let type: 'wig' | 'character' | 'other' = 'other';
          let label = `Squelette (${topBone.name})`;

          if (
            allNamesCombined.includes('hair') ||
            allNamesCombined.includes('wig') ||
            allNamesCombined.includes('tresse') ||
            allNamesCombined.includes('chignon') ||
            allNamesCombined.includes('frange') ||
            allNamesCombined.includes('coupe')
          ) {
            type = 'wig';
            label = `Perruque (${relatedMeshNames[0] || topBone.name})`;
          } else if (
            allNamesCombined.includes('hips') ||
            allNamesCombined.includes('spine') ||
            allNamesCombined.includes('pelvis') ||
            allNamesCombined.includes('walker') ||
            allNamesCombined.includes('character') ||
            allNamesCombined.includes('body') ||
            allNamesCombined.includes('head')
          ) {
            type = 'character';
            label = `Personnage (${relatedMeshNames[0] || topBone.name})`;
          }

          const rootNode = buildBoneNode(topBone);
          const totalBones = countBonesInNode(rootNode);

          foundGroups.push({
            id: topBone.uuid || topBone.name,
            label,
            type,
            meshNames: relatedMeshNames,
            rootNodes: [rootNode],
            totalBones,
          });
        });

        const sig = foundGroups.map((g) => `${g.id}:${g.totalBones}:${g.label}`).join('|');
        if (sig !== prevGroupsSigRef.current) {
          prevGroupsSigRef.current = sig;
          onSkeletonGroupsChange(foundGroups);
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      helpersRef.current.forEach((helper) => {
        helper.removeFromParent();
        helper.dispose();
      });
      helpersRef.current.clear();
      restoreOriginalMaterials();
      prevGroupsSigRef.current = '';
    };
  }, [show, scene, restoreOriginalMaterials, onSkeletonGroupsChange]);

  // Si le squelette n'est pas affiché, ne rien rendre
  if (!show) return null;

  // Afficher une petite infobulle discrète uniquement au survol temporaire d'un os (jamais de bulle permanente sur l'os sélectionné)
  const showHoverTooltip = Boolean(hoveredBoneInfo && hoveredBoneInfo.bone !== activeSelectedBone.current);

  return (
    <>
      {/* Mise en valeur 3D de l'articulation de l'os sélectionné : Sphère + Anneau de ciblage */}
      <mesh ref={selectedJointMeshRef} renderOrder={999999} frustumCulled={false} visible={false}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial color="#ff1e42" depthTest={false} transparent opacity={0.95} />
      </mesh>
      <mesh ref={selectedRingMeshRef} renderOrder={999999} frustumCulled={false} visible={false}>
        <ringGeometry args={[1.2, 1.6, 24]} />
        <meshBasicMaterial color="#fffa65" depthTest={false} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>

      {/* Lignes 3D connectées à l'os sélectionné en jaune doré étincelant */}
      <lineSegments ref={selectedLinesRef} renderOrder={999998} frustumCulled={false} visible={false}>
        <bufferGeometry ref={selectedLinesGeomRef} />
        <lineBasicMaterial color="#fffa65" depthTest={false} linewidth={3} />
      </lineSegments>

      {/* Marqueur discret 3D au survol */}
      <mesh ref={hoveredJointMeshRef} renderOrder={999997} frustumCulled={false} visible={false}>
        <sphereGeometry args={[0.65, 12, 12]} />
        <meshBasicMaterial color="#00ffff" depthTest={false} transparent opacity={0.8} />
      </mesh>

      {/* Étiquette discrète uniquement lors du survol de la souris */}
      {showHoverTooltip && hoveredBoneInfo && (
        <Html
          position={[hoveredBoneInfo.pos.x, hoveredBoneInfo.pos.y, hoveredBoneInfo.pos.z]}
          style={{
            pointerEvents: 'none',
            transform: 'translate3d(-50%, -120%, 0)',
            transition: 'transform 0.05s ease-out',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>🦴</span>
            <span>{hoveredBoneInfo.bone.name}</span>
          </div>
        </Html>
      )}
    </>
  );
}
