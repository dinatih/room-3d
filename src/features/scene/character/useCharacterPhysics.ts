import { useRef } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import type { CharacterParts } from '../characterParts';
import type { HairNode } from '../retargeting/hairChain';

// Static temp vectors for zero-allocation per-frame physics & transforms
const _tmpV1 = new THREE.Vector3();
const _tmpV2 = new THREE.Vector3();
const _tmpV3 = new THREE.Vector3();
const _tmpV4 = new THREE.Vector3();
const _tmpG  = new THREE.Vector3(0, -981, 0);
const HAIR_STEP = 1 / 60;
const _downWorld = new THREE.Vector3(0, -1, 0);
const _upDir = new THREE.Vector3(0, 1, 0);
const _rightDir = new THREE.Vector3(1, 0, 0);
const _backDir = new THREE.Vector3(0, 0, -1);
const _eulerBreast = new THREE.Euler(0, 0, 0, 'ZXY');
const _animBreastQ = new THREE.Quaternion();

// Dedicated static vectors & quaternions for hair physics
const _baseParentQuat = new THREE.Quaternion();
const _boneRestWorldQuat = new THREE.Quaternion();
const _swingQuat = new THREE.Quaternion();
const _parentWQuat = new THREE.Quaternion();
const _jointWorld = new THREE.Vector3();
const _restDirWorld = new THREE.Vector3();
const _restTip = new THREE.Vector3();
const _hairVel = new THREE.Vector3();
const _hairMotion = new THREE.Vector3();
const _hairNext = new THREE.Vector3();
const _hairDir = new THREE.Vector3();
const _hairCurrentDirWorld = new THREE.Vector3();
const _colliderCenter = new THREE.Vector3();
const _colliderOffset = new THREE.Vector3();
const _clampedSwingQuat = new THREE.Quaternion();
const _headW = new THREE.Vector3();
const _hipsW = new THREE.Vector3();
const _lShoulderW = new THREE.Vector3();
const _rShoulderW = new THREE.Vector3();

export interface CharacterPhysicsContext {
  haircut: string;
  targetAnim: string;
  resetHair?: boolean;
  characterAnim?: string;
  clockElapsedTime: number;
}

export function useCharacterPhysics() {
  const hairChainRef = useRef<HairNode[]>([]);
  const customHairChainRef = useRef<HairNode[]>([]);
  const previousHairChainRef = useRef<HairNode[]>([]);
  const breastChainRef = useRef<any[]>([]);
  const breastImpulseRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const breastVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const prevSpinePosRef = useRef<THREE.Vector3 | null>(null);
  const prevSpineVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const torsoAccelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Collision bones
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const spine2BoneRef = useRef<THREE.Bone | null>(null);
  const hipsBoneRef = useRef<THREE.Bone | null>(null);
  const lShoulderRef = useRef<THREE.Bone | null>(null);
  const rShoulderRef = useRef<THREE.Bone | null>(null);
  const backpacksRef = useRef<CharacterParts['backpacks']>([]);

  const hairAccumulator = useRef(0);

  const initPhysicsBones = (parts: CharacterParts) => {
    hipsBoneRef.current = parts.bones.hips;
    spine2BoneRef.current = parts.bones.spine2;
    headBoneRef.current = parts.bones.head;
    lShoulderRef.current = parts.bones.lShoulder;
    rShoulderRef.current = parts.bones.rShoulder;
    backpacksRef.current = parts.backpacks;

    const breastChain: any[] = [];
    for (const bone of parts.bones.breastBones) {
      let axis = new THREE.Vector3(0, 1, 0);
      const child = bone.children.find(x => (x as any).isBone);
      if (child && child.position.lengthSq() > 1e-8) {
        axis = child.position.clone().normalize();
      }
      bone.updateMatrixWorld(true);
      const initialRestQ = (bone as any).restLocalQuaternion ? (bone as any).restLocalQuaternion.clone() : bone.quaternion.clone();
      const initialRestPos = (bone as any).userData?.restPos ? (bone as any).userData.restPos.clone() : bone.position.clone();
      const initialRestScale = (bone as any).userData?.restScale ? (bone as any).userData.restScale.clone() : bone.scale.clone();
      breastChain.push({
        bone,
        restQuat: initialRestQ,
        restPos: initialRestPos,
        restScale: initialRestScale,
        axis,
      });
    }
    breastChainRef.current = breastChain;
  };

  const updatePhysics = (delta: number, ctx: CharacterPhysicsContext, scene: THREE.Object3D) => {
    const layers = useSceneStore.getState().layers;
    const enableHairPhysics = layers.hairPhysics;
    const enableBreastPhysics = layers.breastPhysics;

    // Ponytail & Wig physics simulation (Verlet)
    const activeHairChain = ctx.haircut !== 'original'
      ? customHairChainRef.current
      : hairChainRef.current;

    if (previousHairChainRef.current !== activeHairChain) {
      hairAccumulator.current = 0;
      for (const node of previousHairChainRef.current) {
        node.bone.quaternion.copy(node.restQuat);
        node.needsReset = true;
      }
      previousHairChainRef.current = activeHairChain;
    }

    for (const node of activeHairChain) {
      if (!enableHairPhysics || ctx.resetHair) {
        if (!node.needsReset) node.bone.quaternion.copy(node.restQuat);
        node.needsReset = true;
      } else if (delta <= 0) {
        node.tipPrev.copy(node.tipWorld);
      }
    }

    if (delta <= 0) {
      hairAccumulator.current = 0;
      prevSpinePosRef.current = null;
      return;
    }

    if (hipsBoneRef.current) {
      hipsBoneRef.current.updateWorldMatrix(true, true);
    } else {
      scene.updateMatrixWorld(true);
    }

    const simDt = Math.min(delta, 0.05);

    if (!enableHairPhysics || ctx.resetHair) hairAccumulator.current = 0;
    if (enableHairPhysics && activeHairChain.length > 0) {
      hairAccumulator.current += simDt;
      _upDir.set(0, 1, 0);
      _rightDir.set(1, 0, 0);
      _backDir.set(0, 0, -1);
      if (headBoneRef.current && hipsBoneRef.current && lShoulderRef.current && rShoulderRef.current) {
        const headW = _headW.setFromMatrixPosition(headBoneRef.current.matrixWorld);
        const hipsW = _hipsW.setFromMatrixPosition(hipsBoneRef.current.matrixWorld);
        const lShoulderW = _lShoulderW.setFromMatrixPosition(lShoulderRef.current.matrixWorld);
        const rShoulderW = _rShoulderW.setFromMatrixPosition(rShoulderRef.current.matrixWorld);

        _upDir.subVectors(headW, hipsW).normalize();
        _rightDir.subVectors(lShoulderW, rShoulderW).normalize();
        _backDir.crossVectors(_upDir, _rightDir).normalize();
        _rightDir.crossVectors(_backDir, _upDir);
      }

      const isWig = ctx.haircut !== 'original';

      const userWigStiffness = isWig ? (layers.wigStiffness ?? 1.0) : 1.0;
      const damping = isWig ? (layers.wigDamping ?? 0.80) : 0.80;
      const userWigGravity = isWig ? (layers.wigGravity ?? 1.0) : 1.0;
      const userWigInertia = isWig ? (layers.wigInertia ?? 1.0) : 1.0;
      const userWigTipWeight = isWig ? (layers.wigTipWeight ?? 1.2) : 1.2;
      const userWigWind = isWig ? (layers.wigWind ?? 0.0) : 0.0;
      const headColliderRadius = isWig ? (layers.wigHeadCollisionRadius ?? 13.0) : 13.0;

      const stiffness = THREE.MathUtils.clamp(0.038 * userWigStiffness, 0, 1);
      const wigMaxAngle = THREE.MathUtils.degToRad(layers.wigMaxAngle ?? 15);
      const backpackSpine = backpacksRef.current.some(({ mesh }) => mesh.visible) ? spine2BoneRef.current : null;

      // Fixed steps keep gravity, damping and contacts consistent when the render rate varies.
      while (hairAccumulator.current >= HAIR_STEP) {
        hairAccumulator.current -= HAIR_STEP;
        for (const node of activeHairChain) {
          const { bone, rootParent, relQuat, axis, length, progress } = node;
          const parent = bone.parent;
          if (!parent) continue;

          bone.updateWorldMatrix(true, false);
          rootParent.matrixWorld.decompose(_tmpV1, _baseParentQuat, _tmpV2);
          const jointWorld = _jointWorld.setFromMatrixPosition(bone.matrixWorld);
          const worldLength = _hairDir.copy(axis).multiplyScalar(length).applyMatrix4(bone.matrixWorld).distanceTo(jointWorld);
          const restDirWorld = _restDirWorld.copy(axis).applyQuaternion(_boneRestWorldQuat.copy(_baseParentQuat).multiply(relQuat)).normalize();
          const restTip = _restTip.copy(jointWorld).addScaledVector(restDirWorld, worldLength);

          if (node.needsReset) {
            node.needsReset = false;
            node.tipWorld.copy(restTip);
            node.tipPrev.copy(restTip);
          }

          const nodeDamping = isWig ? THREE.MathUtils.lerp(damping, 0.96, progress * 0.5) : damping;
          const velocity = _hairVel.subVectors(node.tipWorld, node.tipPrev).multiplyScalar(1 - nodeDamping);
          const tipWeight = isWig ? userWigTipWeight * progress * progress : 0;
          const inertia = isWig
            ? 1 + (userWigInertia - 1) * (1 - progress * 0.5)
            : 1 + progress * 0.40;
          const next = _hairNext.copy(node.tipWorld)
            .add(velocity)
            .addScaledVector(_tmpG, HAIR_STEP * HAIR_STEP * inertia * userWigGravity)
            .addScaledVector(_downWorld, HAIR_STEP * HAIR_STEP * 4800 * tipWeight);

          if (userWigWind > 0) {
            const tWind = (ctx.clockElapsedTime - hairAccumulator.current) * 3 + progress;
            const windDisplacement = 900 * userWigWind * HAIR_STEP * HAIR_STEP;
            next.x += Math.sin(tWind) * windDisplacement;
            next.z += Math.cos(tWind * 0.7) * windDisplacement;
          }

          next.lerp(restTip, stiffness);
          const motion = _hairMotion.subVectors(next, node.tipWorld);

          // Constraints pass (2 passes)
          for (let i = 0; i < 2; i++) {
            const dir = _hairDir.subVectors(next, jointWorld);
            const currentLen = dir.length();
            if (currentLen > 1e-6) {
              dir.multiplyScalar(worldLength / currentLen);
            } else {
              dir.copy(restDirWorld).multiplyScalar(worldLength);
            }
            next.copy(jointWorld).add(dir);

            // Tête (Sphère douce)
            if (headBoneRef.current) {
              const center = _colliderCenter.setFromMatrixPosition(headBoneRef.current.matrixWorld).addScaledVector(_backDir, isWig ? 2 : 4);
              const radius = headColliderRadius;
              const dCenter = next.distanceTo(center);
              if (dCenter < radius) {
                const normal = _colliderOffset.subVectors(next, center);
                if (dCenter > 0) normal.divideScalar(dCenter);
                else normal.copy(restDirWorld);
                next.addScaledVector(normal, radius - dCenter);
                motion.addScaledVector(normal, -Math.min(0, motion.dot(normal)));
              }
            }

            // Sac à dos (Collider OBB)
            if (backpackSpine) {
              const backpackCenter = _colliderCenter.setFromMatrixPosition(backpackSpine.matrixWorld).addScaledVector(_backDir, 11);
              const localPos = _colliderOffset.subVectors(next, backpackCenter);
              const px = localPos.dot(_rightDir);
              const py = localPos.dot(_upDir);
              const pz = localPos.dot(_backDir);

              const halfW = 14.0;
              const halfH = 18.0;
              const thickness = 7.0;

              if (Math.abs(px) < halfW && Math.abs(py) < halfH && pz < thickness && pz > -5.0) {
                next.addScaledVector(_backDir, thickness - pz);
                motion.addScaledVector(_backDir, -Math.min(0, motion.dot(_backDir)));
              }
            }
          }

          const currentDirWorld = _hairCurrentDirWorld.subVectors(next, jointWorld).normalize();
          if (currentDirWorld.lengthSq() === 0) currentDirWorld.copy(restDirWorld);

          const swing = _swingQuat.setFromUnitVectors(restDirWorld, currentDirWorld);
          if (isWig) {
            swing.copy(_clampedSwingQuat.identity().rotateTowards(swing, wigMaxAngle));
            currentDirWorld.copy(restDirWorld).applyQuaternion(swing);
          }

          // Carry only tangential motion. Constraint corrections must never feed the next Verlet step.
          motion.addScaledVector(currentDirWorld, -motion.dot(currentDirWorld));
          node.tipWorld.copy(jointWorld).addScaledVector(currentDirWorld, worldLength);
          node.tipPrev.copy(node.tipWorld).sub(motion);

          parent.matrixWorld.decompose(_tmpV1, _parentWQuat, _tmpV2);
          const boneRestWorldQuat = _boneRestWorldQuat.copy(_baseParentQuat).multiply(relQuat);
          const newWorldQuat = swing.multiply(boneRestWorldQuat);
          bone.quaternion.copy(_parentWQuat.invert().multiply(newWorldQuat)).normalize();
          bone.updateWorldMatrix(false, false);
        }
      }
    }

    // Vitesse & accélération du torse
    if (spine2BoneRef.current) {
      spine2BoneRef.current.getWorldPosition(_tmpV1);
      if (prevSpinePosRef.current) {
        _tmpV2.subVectors(_tmpV1, prevSpinePosRef.current).divideScalar(Math.max(0.001, simDt));
        _tmpV3.subVectors(_tmpV2, prevSpineVelRef.current).divideScalar(Math.max(0.001, simDt));

        if (_tmpV3.lengthSq() > 0.01) {
          torsoAccelRef.current.copy(_tmpV3);
        } else {
          torsoAccelRef.current.lerp(_tmpV4.set(0, 0, 0), simDt * 10.0);
        }
        prevSpineVelRef.current.copy(_tmpV2);
      } else {
        prevSpinePosRef.current = new THREE.Vector3().copy(_tmpV1);
        prevSpineVelRef.current.set(0, 0, 0);
      }
      prevSpinePosRef.current.copy(_tmpV1);
    }

    // Physique poitrine
    const breastIntensity = layers.breastIntensity ?? 1.0;
    const breastMass = layers.breastMass ?? 1.0;
    const breastFirmness = layers.breastFirmness ?? 1.0;
    const braElasticity = layers.braElasticity ?? 1.0;
    const braElasticityXZ = layers.braElasticityXZ ?? 1.0;
    const breastLagDelay = layers.breastLagDelay ?? 1.0;
    const maxBreastAngleDeg = layers.maxBreastAngle ?? 25;
    const maxBreastAngleXZDeg = layers.maxBreastAngleXZ ?? 35;
    const breastTranslation = layers.breastTranslation ?? 0.15;
    const breastMaxTravel = layers.breastMaxTravel ?? 0.5;
    const breastSquash = layers.breastSquash ?? 0.25;
    const breastGravity = layers.breastGravity ?? 1.0;

    const maxBreastAngleRad = (maxBreastAngleDeg * Math.PI) / 180;
    const maxBreastAngleXZRad = (maxBreastAngleXZDeg * Math.PI) / 180;

    const isBakedBustAnimation = Boolean(
      (ctx.targetAnim && ctx.targetAnim.toLowerCase().includes('signature')) ||
      (ctx.characterAnim && ctx.characterAnim.toLowerCase().includes('signature'))
    );

    if (enableBreastPhysics && !isBakedBustAnimation && breastIntensity > 0 && breastChainRef.current.length > 0) {
      const mass = Math.max(0.2, breastMass);
      const stiffness = (35.0 * braElasticity * breastFirmness);
      const damping = 10.0 * (1.0 + breastLagDelay * 0.4);
      const softnessFactor = 1.0 / Math.max(0.1, breastFirmness);

      const externalForce = _tmpV1.copy(torsoAccelRef.current).multiplyScalar((0.2 * breastIntensity * softnessFactor) / mass);
      externalForce.x *= braElasticityXZ * 1.5;
      externalForce.y *= braElasticity * 1.2;
      externalForce.z *= braElasticityXZ * 1.8;

      const accel = externalForce
        .addScaledVector(breastImpulseRef.current, -stiffness / mass)
        .addScaledVector(breastVelRef.current, -damping / mass);

      breastVelRef.current.addScaledVector(accel, simDt);
      breastImpulseRef.current.addScaledVector(breastVelRef.current, simDt);

      if (externalForce.lengthSq() < 0.0001) {
        breastVelRef.current.multiplyScalar(Math.max(0, 1 - simDt * 8.0));
        breastImpulseRef.current.multiplyScalar(Math.max(0, 1 - simDt * 6.0));
      }

      if (breastImpulseRef.current.lengthSq() < 1e-7) {
        breastImpulseRef.current.set(0, 0, 0);
        breastVelRef.current.set(0, 0, 0);
      }

      for (let i = 0; i < breastChainRef.current.length; i++) {
        const { bone, restQuat, restPos, restScale, axis } = breastChainRef.current[i];

        // Vecteur gravité monde (0, -1, 0) projeté dans l'espace local du parent de l'os
        const parent = bone.parent;
        const localGrav = _tmpV3.set(0, -1, 0);
        if (parent) {
          parent.getWorldQuaternion(_parentWQuat);
          localGrav.applyQuaternion(_parentWQuat.invert());
        }

        // Inclinaison sous gravité (les seins pendent naturellement quand le torse est penché)
        const gravAngleInfluence = 0.35 * breastGravity * Math.min(1.5, softnessFactor);
        let swingX = Math.max(-maxBreastAngleRad, Math.min(maxBreastAngleRad,
          breastImpulseRef.current.y * 0.25 + localGrav.z * maxBreastAngleRad * gravAngleInfluence
        ));
        let swingY = Math.max(-maxBreastAngleXZRad, Math.min(maxBreastAngleXZRad, breastImpulseRef.current.x * 0.45 * softnessFactor));
        let swingZ = Math.max(-maxBreastAngleXZRad, Math.min(maxBreastAngleXZRad,
          breastImpulseRef.current.z * 0.45 * softnessFactor - localGrav.x * maxBreastAngleXZRad * gravAngleInfluence * 0.5
        ));

        _eulerBreast.set(swingX, swingY, swingZ, 'ZXY');
        _animBreastQ.setFromEuler(_eulerBreast);

        const baseRest = (bone as any).userData?.restQuat || (bone as any).restLocalQuaternion || restQuat;
        bone.quaternion.copy(baseRest).multiply(_animBreastQ);

        // Déplacement élastique et gravitationnel (translation du buste vers le bas monde)
        const baseRestPos = (bone as any).userData?.restPos || restPos;
        if (baseRestPos) {
          if (breastTranslation > 0) {
            const maxTravelCm = Math.max(0.05, breastMaxTravel);

            // Déplacement dynamique par inertie
            const dynDispY = breastImpulseRef.current.y * 0.05 * softnessFactor * breastTranslation;
            const dynDispZ = breastImpulseRef.current.z * 0.04 * softnessFactor * breastTranslation;
            const dynDispX = breastImpulseRef.current.x * 0.02 * softnessFactor * breastTranslation;

            // Déplacement statique par gravité (tire vers le bas du repère monde)
            const gravStrengthCm = maxTravelCm * 0.65 * Math.min(1.6, softnessFactor) * mass * breastGravity * Math.min(2.0, breastTranslation);
            const gravDispX = localGrav.x * gravStrengthCm;
            const gravDispY = localGrav.y * gravStrengthCm;
            const gravDispZ = localGrav.z * gravStrengthCm;

            // Déplacement total combiné en cm monde
            const dispX_cm = Math.max(-maxTravelCm, Math.min(maxTravelCm, dynDispX + gravDispX));
            const dispY_cm = Math.max(-maxTravelCm, Math.min(maxTravelCm, dynDispY + gravDispY));
            const dispZ_cm = Math.max(-maxTravelCm, Math.min(maxTravelCm, dynDispZ + gravDispZ));

            // Conversion cm -> espace local de l'os selon l'échelle réelle de l'armature
            bone.getWorldScale(_tmpV4);
            const invScaleX = _tmpV4.x > 1e-4 ? (1.0 / _tmpV4.x) : 0.01;
            const invScaleY = _tmpV4.y > 1e-4 ? (1.0 / _tmpV4.y) : 0.01;
            const invScaleZ = _tmpV4.z > 1e-4 ? (1.0 / _tmpV4.z) : 0.01;

            bone.position.set(
              baseRestPos.x + dispX_cm * invScaleX,
              baseRestPos.y + dispY_cm * invScaleY,
              baseRestPos.z + dispZ_cm * invScaleZ
            );
          } else {
            bone.position.copy(baseRestPos);
          }
        }

        // Déformation élastique volumétrique (Squash & Stretch : aplatissement en profondeur Z et élargissement X/Y)
        const baseRestScale = (bone as any).userData?.restScale || restScale;
        if (baseRestScale) {
          if (breastSquash > 0) {
            // Taux de compression sur la profondeur (impact torse avant/arrière)
            const depthComp = Math.max(-0.60, Math.min(0.60, breastImpulseRef.current.z * 0.08 * softnessFactor * breastSquash));
            // Taux de compression sur la hauteur (inertie verticale haut/bas)
            const vertComp = Math.max(-0.50, Math.min(0.50, breastImpulseRef.current.y * 0.06 * softnessFactor * breastSquash));

            const depthScale = Math.max(0.35, Math.min(2.0, 1.0 - depthComp));
            const verticalScale = Math.max(0.40, Math.min(1.8, 1.0 + vertComp));
            const alongY = Math.abs(axis.y) > 0.7;
            const sy = alongY ? depthScale : verticalScale;
            const sz = alongY ? verticalScale : depthScale;
            const volumeComp = 1.0 / Math.sqrt(Math.max(0.2, sy * sz));
            const sx = Math.max(0.40, Math.min(2.0, volumeComp));
            bone.scale.set(baseRestScale.x * sx, baseRestScale.y * sy, baseRestScale.z * sz);
          } else {
            bone.scale.copy(baseRestScale);
          }
        }

        bone.userData.hasPhysicsApplied = true;
      }
    } else if (breastChainRef.current.length > 0) {
      // Nettoyage / Réinitialisation propre si la physique est désactivée ou qu'une animation bake joue
      for (let i = 0; i < breastChainRef.current.length; i++) {
        const { bone, restQuat, restPos, restScale } = breastChainRef.current[i];
        if (bone.userData?.hasPhysicsApplied) {
          if (!isBakedBustAnimation) {
            const baseRest = (bone as any).userData?.restQuat || (bone as any).restLocalQuaternion || restQuat;
            const baseRestPos = (bone as any).userData?.restPos || restPos;
            const baseRestScale = (bone as any).userData?.restScale || restScale;
            if (baseRest) bone.quaternion.copy(baseRest);
            if (baseRestPos) bone.position.copy(baseRestPos);
            if (baseRestScale) bone.scale.copy(baseRestScale);
          }
          bone.userData.hasPhysicsApplied = false;
        }
      }
    }

  };

  return {
    hairChainRef,
    customHairChainRef,
    initPhysicsBones,
    updatePhysics
  };
}
