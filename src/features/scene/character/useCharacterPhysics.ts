import { useRef } from 'react';
import * as THREE from 'three';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import type { CharacterParts } from '../characterParts';

// Static temp vectors for zero-allocation per-frame physics & transforms
const _tmpV1 = new THREE.Vector3();
const _tmpV2 = new THREE.Vector3();
const _tmpV3 = new THREE.Vector3();
const _tmpV4 = new THREE.Vector3();
const _tmpG  = new THREE.Vector3(0, -981, 0);
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
const _restDir = new THREE.Vector3();
const _restTip = new THREE.Vector3();
const _hairVel = new THREE.Vector3();
const _hairNext = new THREE.Vector3();
const _hairDir = new THREE.Vector3();
const _hairFinalDir = new THREE.Vector3();
const _hairCurrentDirWorld = new THREE.Vector3();
const _colliderCenter = new THREE.Vector3();
const _colliderOffset = new THREE.Vector3();
const _rotAxis = new THREE.Vector3();
const _clampedSwingQuat = new THREE.Quaternion();
const _headW = new THREE.Vector3();
const _hipsW = new THREE.Vector3();
const _lShoulderW = new THREE.Vector3();
const _rShoulderW = new THREE.Vector3();

export interface CharacterPhysicsContext {
  haircut: string;
  isMoving: boolean;
  targetAnim: string;
  walkerAnim?: string;
  clockElapsedTime: number;
}

export function useCharacterPhysics() {
  const hairChainRef = useRef<any[]>([]);
  const customHairChainRef = useRef<any[]>([]);
  const breastChainRef = useRef<any[]>([]);
  const breastImpulseRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const breastVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const prevSpinePosRef = useRef<THREE.Vector3 | null>(null);
  const prevSpineVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const torsoAccelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Collision bones
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const spine2BoneRef = useRef<THREE.Bone | null>(null);
  const spineBoneRef = useRef<THREE.Bone | null>(null);
  const hipsBoneRef = useRef<THREE.Bone | null>(null);
  const lShoulderRef = useRef<THREE.Bone | null>(null);
  const rShoulderRef = useRef<THREE.Bone | null>(null);

  const physicsPrevDt = useRef<number>(1 / 60);

  const initPhysicsBones = (parts: CharacterParts) => {
    hipsBoneRef.current = parts.bones.hips;
    spine2BoneRef.current = parts.bones.spine2;
    spineBoneRef.current = parts.bones.spine;
    headBoneRef.current = parts.bones.head;
    lShoulderRef.current = parts.bones.lShoulder;
    rShoulderRef.current = parts.bones.rShoulder;

    const breastChain: any[] = [];
    for (const bone of parts.bones.breastBones) {
      let axis = new THREE.Vector3(0, 1, 0);
      let length = 15.0;
      const child = bone.children.find(x => (x as any).isBone);
      if (child && child.position.lengthSq() > 1e-8) {
        length = child.position.length();
        axis = child.position.clone().normalize();
      }
      bone.updateMatrixWorld(true);
      const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
      const worldScale = new THREE.Vector3().setFromMatrixScale(bone.matrixWorld);
      const worldLength = length * worldScale.z;
      const tipDirWorld = axis.clone().transformDirection(bone.matrixWorld).normalize();
      const tipWorld = jointWorld.clone().addScaledVector(tipDirWorld, worldLength);
      const initialRestQ = (bone as any).restLocalQuaternion ? (bone as any).restLocalQuaternion.clone() : bone.quaternion.clone();
      breastChain.push({
        bone,
        restQuat: initialRestQ,
        axis,
        length,
        worldLength,
        tipWorld: tipWorld.clone(),
        tipPrev: tipWorld.clone(),
      });
    }
    breastChainRef.current = breastChain;
  };

  const updatePhysics = (delta: number, ctx: CharacterPhysicsContext, scene: THREE.Object3D) => {
    const enableHairPhysics = useSceneStore.getState().layers.hairPhysics;
    const enableBreastPhysics = useSceneStore.getState().layers.breastPhysics;

    if (enableHairPhysics || enableBreastPhysics) {
      scene.updateMatrixWorld(true);
    }

    let simDt = delta;
    if (simDt > 0.05) simDt = 0.05;
    const dtRatio = physicsPrevDt.current > 0 ? (simDt / physicsPrevDt.current) : 1;

    // Ponytail & Wig physics simulation (Verlet)
    const activeHairChain = (ctx.haircut !== 'original' && customHairChainRef.current.length > 0)
      ? customHairChainRef.current
      : hairChainRef.current;

    if (!enableHairPhysics && activeHairChain.length > 0) {
      for (const node of activeHairChain) {
        if (node.restQuat) {
          node.bone.quaternion.copy(node.restQuat);
        }
      }
    }

    if (enableHairPhysics && activeHairChain.length > 0) {
      const firstNode = activeHairChain[0];
      const baseParent = firstNode.bone.parent;
      if (baseParent) {
        baseParent.getWorldQuaternion(_baseParentQuat);

        if (headBoneRef.current && hipsBoneRef.current && lShoulderRef.current && rShoulderRef.current) {
          const headW = _headW.setFromMatrixPosition(headBoneRef.current.matrixWorld);
          const hipsW = _hipsW.setFromMatrixPosition(hipsBoneRef.current.matrixWorld);
          const lShoulderW = _lShoulderW.setFromMatrixPosition(lShoulderRef.current.matrixWorld);
          const rShoulderW = _rShoulderW.setFromMatrixPosition(rShoulderRef.current.matrixWorld);

          _upDir.subVectors(headW, hipsW).normalize();
          _rightDir.subVectors(lShoulderW, rShoulderW).normalize();
          _backDir.crossVectors(_upDir, _rightDir).normalize();
        }

        const isWig = (ctx.haircut !== 'original');
        const isHeadMoving = ctx.isMoving || (ctx.targetAnim !== 'idle') || (ctx.walkerAnim && ctx.walkerAnim.toLowerCase().includes('walk')) || (ctx.walkerAnim && ctx.walkerAnim.toLowerCase().includes('run'));

        const userWigStiffness = useSceneStore.getState().layers.wigStiffness ?? 1.0;
        const userWigDamping = useSceneStore.getState().layers.wigDamping ?? 0.80;
        const userWigGravity = useSceneStore.getState().layers.wigGravity ?? 1.0;
        const userWigInertia = useSceneStore.getState().layers.wigInertia ?? 1.0;
        const userWigTipWeight = useSceneStore.getState().layers.wigTipWeight ?? 1.2;
        const userWigWind = useSceneStore.getState().layers.wigWind ?? 0.0;
        const userWigHeadRadius = useSceneStore.getState().layers.wigHeadCollisionRadius ?? 13.0;

        const baseDamping = isHeadMoving ? 0.70 : 0.85;
        const dampingFactor = isWig 
          ? (isHeadMoving ? (userWigDamping * 0.90) : userWigDamping)
          : baseDamping;

        const baseStiffness = isHeadMoving ? 0.038 : 0.12;
        const lerpStiffness = isWig
          ? Math.min(1.0, baseStiffness * userWigStiffness)
          : baseStiffness;

        const gravMultiplier = isWig ? userWigGravity : 1.0;
        const headColliderRadius = isWig ? userWigHeadRadius : 13.0;

        for (let nodeIdx = 0; nodeIdx < activeHairChain.length; nodeIdx++) {
          const node = activeHairChain[nodeIdx];
          const { bone, relQuat, axis, worldLength } = node;
          const parent = bone.parent;
          if (!parent) continue;

          const jointWorld = _jointWorld.setFromMatrixPosition(bone.matrixWorld);
          const restDirWorld = _restDirWorld.copy(axis).applyQuaternion(_boneRestWorldQuat.copy(_baseParentQuat).multiply(relQuat)).normalize();
          const restDir = _restDir.copy(_downWorld).lerp(restDirWorld, 0.10).normalize();
          const restTip = _restTip.copy(jointWorld).addScaledVector(restDir, worldLength);

          // Teleportation safety reset
          const dist = jointWorld.distanceTo(node.tipWorld);
          if (dist > Math.max(worldLength * 3, 20.0)) {
            node.tipWorld.copy(restTip);
            node.tipPrev.copy(restTip);
          }

          // Normalized position along the chain (0 = root, 1 = tip)
          const pChain = nodeIdx / Math.max(1, activeHairChain.length - 1);

          // 1. Damping: progressively increase damping towards the tip for wigs to kill whip vibrations
          const nodeDamping = isWig
            ? Math.min(0.98, dampingFactor + (0.96 - dampingFactor) * pChain * 0.5)
            : dampingFactor;

          // 2. Velocity computation with anti-flick clamping
          const vel = _hairVel.subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - nodeDamping));
          if (isWig) {
            const maxTipTravel = worldLength * (0.6 + (1 - pChain) * 0.6);
            if (vel.length() > maxTipTravel) {
              vel.setLength(maxTipTravel);
            }
          }

          // 3. Tip weight anchor (acts like a small stabilizing weight at the tip of each strand)
          const tipAnchorStrength = isWig ? (userWigTipWeight * pChain * pChain) : 0;

          const tipWeightFactor = isWig
            ? (1.0 + (userWigInertia - 1.0) * (1.0 - pChain * 0.5))
            : (1.0 + pChain * 0.40);

          const next = _hairNext.copy(node.tipWorld)
            .add(vel)
            .addScaledVector(_tmpG, simDt * simDt * tipWeightFactor * gravMultiplier);

          if (tipAnchorStrength > 0) {
            next.addScaledVector(_downWorld, simDt * 80.0 * tipAnchorStrength);
          }

          // Ambient wind breeze for wigs
          if (isWig && userWigWind > 0) {
            const tWind = (ctx.clockElapsedTime * 3.0) + (nodeIdx * 0.5);
            const wX = Math.sin(tWind) * 0.25 * userWigWind;
            const wZ = Math.cos(tWind * 0.7) * 0.25 * userWigWind;
            next.x += wX * simDt * 60;
            next.z += wZ * simDt * 60;
          }

          // Spring return to natural rest orientation
          const effectiveStiffness = isWig
            ? Math.min(1.0, lerpStiffness * (1.0 + tipAnchorStrength * 0.5))
            : lerpStiffness;
          next.lerp(restTip, effectiveStiffness);

          // Anti-vibration sleep filter when velocity is low
          const sleepThreshold = isWig ? (0.25 + pChain * 0.35) : 0.1;
          if (!isHeadMoving && vel.lengthSq() < sleepThreshold) {
            vel.multiplyScalar(0.2);
            next.lerp(restTip, isWig ? 0.90 : 0.80);
          }

          // Constraints pass (2 passes)
          for (let i = 0; i < 2; i++) {
            const dir = _hairDir.subVectors(next, jointWorld);
            const currentLen = dir.length();
            if (currentLen > 1e-6) {
              dir.multiplyScalar(worldLength / currentLen);
            } else {
              dir.copy(restDir).multiplyScalar(worldLength);
            }
            next.copy(jointWorld).add(dir);

            // Tête (Sphère douce)
            if (headBoneRef.current) {
              const center = _colliderCenter.setFromMatrixPosition(headBoneRef.current.matrixWorld).addScaledVector(_backDir, isWig ? 2 : 4);
              const radius = headColliderRadius;
              const dCenter = next.distanceTo(center);
              if (dCenter < radius) {
                next.add(_colliderOffset.subVectors(next, center).normalize().multiplyScalar(radius - dCenter));
              }
            }

            // Sac à dos (Collider OBB)
            if (spine2BoneRef.current) {
              const backpackCenter = _colliderCenter.setFromMatrixPosition(spine2BoneRef.current.matrixWorld).addScaledVector(_backDir, 11);
              const localPos = _colliderOffset.subVectors(next, backpackCenter);
              const px = localPos.dot(_rightDir);
              const py = localPos.dot(_upDir);
              const pz = localPos.dot(_backDir);

              const halfW = 14.0;
              const halfH = 18.0;
              const thickness = 7.0;

              if (Math.abs(px) < halfW && Math.abs(py) < halfH && pz < thickness && pz > -5.0) {
                next.addScaledVector(_backDir, thickness - pz);
              }
            }
          }

          const finalDir = _hairFinalDir.subVectors(next, jointWorld);
          const finalLen = finalDir.length();
          if (finalLen > 1e-6) {
            finalDir.multiplyScalar(worldLength / finalLen);
          } else {
            finalDir.copy(restDir).multiplyScalar(worldLength);
          }

          const currentDirWorld = _hairCurrentDirWorld.copy(finalDir).normalize();

          // Cône de déviation angulaire stricte (Perruques UNIQUEMENT - max 15° par rapport au repos)
          if (isWig) {
            const maxAngleDeg = useSceneStore.getState().layers.wigMaxAngle ?? 15;
            const maxAngleRad = (maxAngleDeg * Math.PI) / 180;
            const cosAngle = Math.max(-1.0, Math.min(1.0, restDirWorld.dot(currentDirWorld)));
            const currentAngle = Math.acos(cosAngle);

            if (currentAngle > maxAngleRad) {
              _rotAxis.crossVectors(restDirWorld, currentDirWorld);
              if (_rotAxis.lengthSq() > 1e-6) {
                _rotAxis.normalize();
                _clampedSwingQuat.setFromAxisAngle(_rotAxis, maxAngleRad);
                currentDirWorld.copy(restDirWorld).applyQuaternion(_clampedSwingQuat).normalize();
                finalDir.copy(currentDirWorld).multiplyScalar(worldLength);
              }
            }
          }

          node.tipPrev.copy(node.tipWorld);
          node.tipWorld.copy(jointWorld).add(finalDir);

          const parentWQuat = parent.getWorldQuaternion(_parentWQuat);
          const boneRestWorldQuat = _boneRestWorldQuat.copy(_baseParentQuat).multiply(relQuat);
          const swing = _swingQuat.setFromUnitVectors(restDirWorld, currentDirWorld);

          const newWorldQuat = swing.multiply(boneRestWorldQuat);
          bone.quaternion.copy(parentWQuat.invert().multiply(newWorldQuat));
          bone.updateMatrixWorld(true);
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
    const breastIntensity = useSceneStore.getState().layers.breastIntensity ?? 1.0;
    const breastMass = useSceneStore.getState().layers.breastMass ?? 1.0;
    const breastFirmness = useSceneStore.getState().layers.breastFirmness ?? 1.0;
    const braElasticity = useSceneStore.getState().layers.braElasticity ?? 1.0;
    const braElasticityXZ = useSceneStore.getState().layers.braElasticityXZ ?? 1.0;
    const breastLagDelay = useSceneStore.getState().layers.breastLagDelay ?? 1.0;
    const maxBreastAngleDeg = useSceneStore.getState().layers.maxBreastAngle ?? 25;
    const maxBreastAngleXZDeg = useSceneStore.getState().layers.maxBreastAngleXZ ?? 35;

    const maxBreastAngleRad = (maxBreastAngleDeg * Math.PI) / 180;
    const maxBreastAngleXZRad = (maxBreastAngleXZDeg * Math.PI) / 180;

    if (enableBreastPhysics && breastIntensity > 0 && breastChainRef.current.length > 0) {
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
        const { bone, restQuat } = breastChainRef.current[i];

        let swingX = Math.max(-maxBreastAngleRad, Math.min(maxBreastAngleRad, breastImpulseRef.current.y * 0.25));
        let swingY = Math.max(-maxBreastAngleXZRad, Math.min(maxBreastAngleXZRad, breastImpulseRef.current.x * 0.45 * softnessFactor));
        let swingZ = Math.max(-maxBreastAngleXZRad, Math.min(maxBreastAngleXZRad, breastImpulseRef.current.z * 0.45 * softnessFactor));

        _eulerBreast.set(swingX, swingY, swingZ, 'ZXY');
        _animBreastQ.setFromEuler(_eulerBreast);

        const baseRest = (bone as any).userData?.restQuat || (bone as any).restLocalQuaternion || restQuat;
        bone.quaternion.copy(baseRest).multiply(_animBreastQ);
      }
    }

    physicsPrevDt.current = simDt;
  };

  return {
    hairChainRef,
    customHairChainRef,
    breastChainRef,
    initPhysicsBones,
    updatePhysics
  };
}
