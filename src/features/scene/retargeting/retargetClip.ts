import * as THREE from 'three';
import { CC3_TO_MIXAMO } from './boneMappings';
import { getDepth } from './hairChain';
import { resolveTargetBoneName } from './boneResolver';
import { retargetH2Clip } from './unitreeH2Retarget';

function subsampleTrackTo30Fps(track: THREE.KeyframeTrack): THREE.KeyframeTrack {
  const times = track.times;
  const numFrames = times.length;
  if (numFrames <= 4) {
    const cl = track.clone();
    cl.times = new Float32Array(times);
    cl.values = new Float32Array(track.values);
    return cl;
  }

  const duration = times[numFrames - 1] - times[0];
  if (duration <= 0) {
    const cl = track.clone();
    cl.times = new Float32Array(times);
    cl.values = new Float32Array(track.values);
    return cl;
  }

  const fps = (numFrames - 1) / duration;
  if (fps <= 40) {
    const cl = track.clone();
    cl.times = new Float32Array(times);
    cl.values = new Float32Array(track.values);
    return cl;
  }

  const stride = Math.round(fps / 30);
  if (stride <= 1) {
    const cl = track.clone();
    cl.times = new Float32Array(times);
    cl.values = new Float32Array(track.values);
    return cl;
  }

  const valueSize = track.getValueSize ? track.getValueSize() : (track.values.length / numFrames);
  const selectedIndices: number[] = [];
  for (let i = 0; i < numFrames - 1; i += stride) {
    selectedIndices.push(i);
  }
  selectedIndices.push(numFrames - 1);

  const newTimes = new Float32Array(selectedIndices.length);
  const newValues = new Float32Array(selectedIndices.length * valueSize);
  for (let k = 0; k < selectedIndices.length; k++) {
    const idx = selectedIndices[k];
    newTimes[k] = times[idx];
    const srcOffset = idx * valueSize;
    const dstOffset = k * valueSize;
    for (let s = 0; s < valueSize; s++) {
      newValues[dstOffset + s] = track.values[srcOffset + s];
    }
  }

  const cl = track.clone();
  cl.times = newTimes;
  cl.values = newValues;
  return cl;
}

export function retargetClip(rawClip: THREE.AnimationClip, targetInstance: THREE.Object3D, animScene: THREE.Object3D | undefined, rootMotionSpace?: 'world-meters' | 'rest-meters'): THREE.AnimationClip {
  if (targetInstance.getObjectByName('H2')?.userData.h2MotionDriver) {
    return retargetH2Clip(rawClip, targetInstance, animScene, rootMotionSpace, retargetClip);
  }
  const animBones: Record<string, any> = {};
  const sourceHairMap = new Map<string, string>();

  if (animScene) {
    animScene.updateMatrixWorld(true);

    // Auto T-pose correction for A-pose models (like CC3/CC4)
    // We adjust the rest pose of the arms in animScene so it aligns with standard Mixamo T-pose.
    animScene.traverse((c: any) => {
      if (c.isBone) {
        let name = c.name;
        if (CC3_TO_MIXAMO[name]) name = CC3_TO_MIXAMO[name];
        const match = name.match(/mixamorig[:_]?(.+)/i);
        const baseName = match ? match[1] : name;
        if (baseName === 'LeftArm' || baseName === 'RightArm') {
          const wQ = c.getWorldQuaternion(new THREE.Quaternion());
          const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(wQ);
          // If the arm is pointing downwards (dir.y < -0.1), it's an A-pose.
          if (dir.y < -0.1) {
            const targetDir = name === 'LeftArm' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0);
            const offsetQ = new THREE.Quaternion().setFromUnitVectors(dir.normalize(), targetDir);
            const pWQ = c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion();
            const newWorldQ = offsetQ.clone().multiply(wQ);
            c.quaternion.copy(pWQ.invert().multiply(newWorldQ));
          }
        }
      }
    });
    // Update matrices again after our corrections
    animScene.updateMatrixWorld(true);

    const sourceHairBones: Array<{ bone: THREE.Object3D; baseName: string; depth: number }> = [];
    animScene.traverse(c => {
      if ((c as any).isBone) {
        const nameLower = (c.name || '').toLowerCase();
        if (nameLower.includes('hair') || nameLower.includes('ponytail')) {
          const match = c.name.match(/mixamorig[:_]?(.+)/i);
          const base = match ? match[1] : c.name;
          sourceHairBones.push({ bone: c, baseName: base, depth: getDepth(c) });
        }
      }
    });
    sourceHairBones.sort((a, b) => a.depth - b.depth);
    sourceHairBones.forEach((hb, idx) => {
      sourceHairMap.set(hb.baseName.toLowerCase(), `hair_${idx + 1}`);
    });

    animScene.traverse((c: any) => {
      if (c.isBone) {
        let name = c.name;
        if (CC3_TO_MIXAMO[name]) name = 'mixamorig:' + CC3_TO_MIXAMO[name];
        const match = name.match(/mixamorig[:_]?(.+)/i);
        if (match) {
          animBones[match[1]] = {
            restWorldQuaternion: c.getWorldQuaternion(new THREE.Quaternion()),
            restLocalQuaternion: c.quaternion.clone(),
            parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion(),
            defaultPosition: c.position.clone(),
            bone: c
          };
        } else if (name.toLowerCase() === 'cc_base_boneroot' || name.toLowerCase() === 'rootjoint') {
          animBones['RootJoint'] = {
            restWorldQuaternion: c.getWorldQuaternion(new THREE.Quaternion()),
            restLocalQuaternion: c.quaternion.clone(),
            parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion(),
            defaultPosition: c.position.clone(),
            bone: c
          };
        }
      }
    });
  }

  // Clone and subsample rawClip tracks to 30 fps (if high-framerate) to avoid mutating source and cut retargeting cost
  const clonedTracks: THREE.KeyframeTrack[] = [];
  for (const track of rawClip.tracks) {
    clonedTracks.push(subsampleTrackTo30Fps(track));
  }
  const workingClip = new THREE.AnimationClip(rawClip.name, rawClip.duration, clonedTracks);

  // Detect and fix centimeter positions (scale to meters)
  for (const track of workingClip.tracks) {
    if (track.name.endsWith('.position')) {
      // Find the maximum absolute value in the track to determine if it's in cm
      let maxVal = 0;
      for (let i = 0; i < track.values.length; i++) {
        if (Math.abs(track.values[i]) > maxVal) {
          maxVal = Math.abs(track.values[i]);
        }
      }
      
      // If the track has values > 5.0, it's almost certainly in centimeters
      if (maxVal > 5.0) {
        for (let i = 0; i < track.values.length; i++) {
          track.values[i] *= 0.01;
        }
      }
    }
  }

  // Combine rootjoint and hips rotations
  const rootRotTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')) && t.name.endsWith('.quaternion'));
  const hipsRotTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('hips') || t.name.toLowerCase().includes('hip') || t.name.toLowerCase().includes('pelvis')) && t.name.endsWith('.quaternion') && !(t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')));

  const evaluateQuaternionTrack = (track: THREE.KeyframeTrack, t: number): THREE.Quaternion => {
    const trackTimes = track.times;
    const trackValues = track.values;
    if (t <= trackTimes[0]) {
      return new THREE.Quaternion(trackValues[0], trackValues[1], trackValues[2], trackValues[3]);
    }
    if (t >= trackTimes[trackTimes.length - 1]) {
      const idx = (trackTimes.length - 1) * 4;
      return new THREE.Quaternion(trackValues[idx], trackValues[idx+1], trackValues[idx+2], trackValues[idx+3]);
    }
    let i = 0;
    while (i < trackTimes.length - 1 && trackTimes[i+1] < t) {
      i++;
    }
    const t0 = trackTimes[i];
    const t1 = trackTimes[i+1];
    const alpha = (t - t0) / (t1 - t0);
    const q0 = new THREE.Quaternion(trackValues[4*i], trackValues[4*i+1], trackValues[4*i+2], trackValues[4*i+3]);
    const q1 = new THREE.Quaternion(trackValues[4*(i+1)], trackValues[4*(i+1)+1], trackValues[4*(i+1)+2], trackValues[4*(i+1)+3]);
    return q0.slerp(q1, alpha);
  };

  if (rootRotTrackIndex !== -1) {
    const rootRotTrack = workingClip.tracks[rootRotTrackIndex];
    if (hipsRotTrackIndex !== -1) {
      const hipsRotTrack = workingClip.tracks[hipsRotTrackIndex];
      const timesSet = new Set<number>([...rootRotTrack.times, ...hipsRotTrack.times]);
      const times = Array.from(timesSet).sort((a, b) => a - b);
      const values = new Float32Array(times.length * 4);

      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const qRoot = evaluateQuaternionTrack(rootRotTrack, t);
        const qHips = evaluateQuaternionTrack(hipsRotTrack, t);
        
        // The true world rotation of the hips is the parent's world rotation * local rotation
        const qCombined = qRoot.clone().multiply(qHips);
        
        values[4*i] = qCombined.x;
        values[4*i+1] = qCombined.y;
        values[4*i+2] = qCombined.z;
        values[4*i+3] = qCombined.w;
      }
      
      const newHipsRotTrack = new THREE.QuaternionKeyframeTrack('mixamorig:Hips.quaternion', new Float32Array(times), values);
      workingClip.tracks.splice(hipsRotTrackIndex, 1, newHipsRotTrack);
      
      const updatedRootRotTrackIndex = workingClip.tracks.indexOf(rootRotTrack);
      if (updatedRootRotTrackIndex !== -1) {
        workingClip.tracks.splice(updatedRootRotTrackIndex, 1);
      }
    } else {
      rootRotTrack.name = 'mixamorig:Hips.quaternion';
    }
  }

  // Combine rootjoint and hips positions
  const rootPosTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')) && t.name.endsWith('.position'));
  const hipsPosTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('hips') || t.name.toLowerCase().includes('hip') || t.name.toLowerCase().includes('pelvis') || t.name.toLowerCase().endsWith('hips.position')) && t.name.endsWith('.position') && !(t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')));

  if (rootPosTrackIndex !== -1) {
    const rootPosTrack = workingClip.tracks[rootPosTrackIndex];
    let hipsPosTrack = hipsPosTrackIndex !== -1 ? workingClip.tracks[hipsPosTrackIndex] : null;
    
    // If the animation doesn't have a hips position track (e.g. Miley animations where all translation is on root),
    // create a static one from the default position so we can still combine them.
    if (!hipsPosTrack && animBones['Hips']) {
      const defPos = animBones['Hips'].defaultPosition.clone();
      // Ensure it's in meters if it came from CC4 (centimeters)
      if (defPos.length() > 5.0) defPos.multiplyScalar(0.01);
      hipsPosTrack = new THREE.VectorKeyframeTrack(
        'mixamorig:Hips.position',
        [0],
        [defPos.x, defPos.y, defPos.z]
      );
    }

    if (hipsPosTrack) {
      const rootRotTrack = rawClip.tracks.find(t => (t.name.toLowerCase().includes('rootjoint') || t.name.toLowerCase().includes('cc_base_boneroot')) && t.name.endsWith('.quaternion'));
      if (rootRotTrack) {
        const posTimes = rootPosTrack.times;
        const posValues = new Float32Array(posTimes.length * 3);

        const evaluateVectorTrack = (track: THREE.KeyframeTrack, t: number): THREE.Vector3 => {
          const trackTimes = track.times;
          const trackValues = track.values;
          if (t <= trackTimes[0]) return new THREE.Vector3(trackValues[0], trackValues[1], trackValues[2]);
          if (t >= trackTimes[trackTimes.length - 1]) {
            const idx = (trackTimes.length - 1) * 3;
            return new THREE.Vector3(trackValues[idx], trackValues[idx+1], trackValues[idx+2]);
          }
          let i = 0;
          while (i < trackTimes.length - 1 && trackTimes[i+1] < t) i++;
          const alpha = (t - trackTimes[i]) / (trackTimes[i+1] - trackTimes[i]);
          const v0 = new THREE.Vector3(trackValues[3*i], trackValues[3*i+1], trackValues[3*i+2]);
          const v1 = new THREE.Vector3(trackValues[3*(i+1)], trackValues[3*(i+1)+1], trackValues[3*(i+1)+2]);
          return v0.lerp(v1, alpha);
        };
        const evaluateQuaternionTrack = (track: THREE.KeyframeTrack, t: number): THREE.Quaternion => {
          const trackTimes = track.times;
          const trackValues = track.values;
          if (t <= trackTimes[0]) return new THREE.Quaternion(trackValues[0], trackValues[1], trackValues[2], trackValues[3]);
          if (t >= trackTimes[trackTimes.length - 1]) {
            const idx = (trackTimes.length - 1) * 4;
            return new THREE.Quaternion(trackValues[idx], trackValues[idx+1], trackValues[idx+2], trackValues[idx+3]);
          }
          let i = 0;
          while (i < trackTimes.length - 1 && trackTimes[i+1] < t) i++;
          const alpha = (t - trackTimes[i]) / (trackTimes[i+1] - trackTimes[i]);
          const q0 = new THREE.Quaternion(trackValues[4*i], trackValues[4*i+1], trackValues[4*i+2], trackValues[4*i+3]);
          const q1 = new THREE.Quaternion(trackValues[4*(i+1)], trackValues[4*(i+1)+1], trackValues[4*(i+1)+2], trackValues[4*(i+1)+3]);
          return q0.slerp(q1, alpha);
        };

        const pRootRest = evaluateVectorTrack(rootPosTrack, posTimes[0]);

        for (let i = 0; i < posTimes.length; i++) {
          const t = posTimes[i];
          const pRoot = evaluateVectorTrack(rootPosTrack, t);
          const pHips = evaluateVectorTrack(hipsPosTrack, t);
          const qRoot = evaluateQuaternionTrack(rootRotTrack, t);
          
          // pRoot is in CC4 world space (Y-up). pHips is in CC4 root space (Z-up).
          // 1. Convert hips to Y-up world space:
          const pHipsWorld = pHips.clone().applyQuaternion(qRoot);
          
          // 2. Add root motion delta (also in Y-up world space)
          const pRootDelta = pRoot.clone().sub(pRootRest);
          const pFinalWorld = pRootDelta.add(pHipsWorld);
          
          // We leave it in world space because the generic loop will apply P_src (Identity) and P_tgt_inv (+90 X) 
          // to correctly project it onto the target bone.
          
          posValues[3*i] = pFinalWorld.x;
          posValues[3*i+1] = pFinalWorld.y;
          posValues[3*i+2] = pFinalWorld.z;
        }
        
        const newHipsPosTrack = new THREE.VectorKeyframeTrack('mixamorig:Hips.position', new Float32Array(posTimes), posValues);
        if (hipsPosTrackIndex !== -1) {
          workingClip.tracks.splice(hipsPosTrackIndex, 1, newHipsPosTrack);
        } else {
          workingClip.tracks.push(newHipsPosTrack);
        }
        
        const updatedRootPosTrackIndex = workingClip.tracks.indexOf(rootPosTrack);
        if (updatedRootPosTrackIndex !== -1) {
          workingClip.tracks.splice(updatedRootPosTrackIndex, 1);
        }
      }
    }
  }

  // Determine height translations scale multiplier dynamically
  let srcHipsDefaultY = 0.991;
  let computedHipsRatio = 100.0;
  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split('.');
    const match = boneFull.match(/mixamorig[:_]?(.+)/i);
    if (match) {
      const baseName = match[1];
      if (prop === 'position' && baseName.toLowerCase() === 'hips') {
        const resolvedHipsName = resolveTargetBoneName(targetInstance, 'Hips', sourceHairMap);
        const bone = resolvedHipsName ? targetInstance.getObjectByName(resolvedHipsName) as any : null;
        let refSrcY = 0.991;
        if (animBones[baseName] && animBones[baseName].defaultPosition) {
          refSrcY = animBones[baseName].defaultPosition.length();
        } else {
          refSrcY = 0.991;
        }
        if (refSrcY > 5.0) {
          refSrcY *= 0.01;
        }
        srcHipsDefaultY = refSrcY;

        let targetHipsHeight = 99.1;
        if (bone && bone.defaultPosition) {
          targetHipsHeight = bone.defaultPosition.length();
        }
        if (Math.abs(refSrcY) > 0) {
          computedHipsRatio = targetHipsHeight / Math.abs(refSrcY);
        }
      }
    }
  }

  const tracks: THREE.KeyframeTrack[] = [];

  // Cache existence checks once for the entire clip
  const targetHasLeftClavicle = Boolean(resolveTargetBoneName(targetInstance, 'LeftShoulder', sourceHairMap));
  const targetHasRightClavicle = Boolean(resolveTargetBoneName(targetInstance, 'RightShoulder', sourceHairMap));
  const targetHasSpine1 = Boolean(resolveTargetBoneName(targetInstance, 'Spine1', sourceHairMap));

  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split('.');
    
    let mappedBoneFull = boneFull;
    if (CC3_TO_MIXAMO[boneFull]) mappedBoneFull = 'mixamorig:' + CC3_TO_MIXAMO[boneFull];
    
    let match = mappedBoneFull.match(/mixamorig[:_]?(.+)/i);
    let baseName = match ? match[1] : '';
    
    if (mappedBoneFull.toLowerCase() === 'cc_base_boneroot' || mappedBoneFull.toLowerCase() === 'rootjoint') {
      baseName = 'Hips';
      match = ['Hips', 'Hips'];
    }

    if (!match) continue;

    let isRootJointTranslation = false;
    if (prop === 'position' && (boneFull.toLowerCase().includes('rootjoint') || boneFull.toLowerCase().includes('cc_base_boneroot'))) {
      baseName = 'Hips';
      isRootJointTranslation = true;
    }

    const targetBoneName = resolveTargetBoneName(targetInstance, baseName, sourceHairMap);
    if (!targetBoneName) continue;

    if (prop === 'scale') continue;
    const isHips = targetBoneName.toLowerCase().endsWith('hips') || targetBoneName.toLowerCase().includes('pelvis');
    if (prop === 'position' && !isHips) continue;

    const clone = tr.clone();
    clone.name = `${targetBoneName}.${prop}`;

    // Retarget position for hips
    if (prop === 'position' && isHips) {
      const bone = targetInstance.getObjectByName(targetBoneName) as any;
      if (bone && bone.defaultPosition) {
        let P_src = null;
        if (isRootJointTranslation) {
          P_src = new THREE.Quaternion();
        } else if (animBones[baseName]) {
          P_src = animBones[baseName].parentRestWorldQuaternion;
        } else {
          P_src = new THREE.Quaternion();
        }

        const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
          ? bone.parent.restWorldQuaternion
          : new THREE.Quaternion();
        const P_tgt_inv = P_tgt.clone().invert();

        let srcRestPos = null;
        if (isRootJointTranslation) {
          srcRestPos = new THREE.Vector3(0, srcHipsDefaultY, 0);
        } else if (animBones[baseName]) {
          srcRestPos = animBones[baseName].defaultPosition.clone();
          if (srcRestPos.length() > 5.0) {
            srcRestPos.multiplyScalar(0.01);
          }
        } else {
          srcRestPos = new THREE.Vector3(0, srcHipsDefaultY * 100, 0);
          if (srcRestPos.length() > 5.0) {
            srcRestPos.multiplyScalar(0.01);
          }
        }

        const restX = clone.values[0];
        const restY = clone.values[1];
        const restZ = clone.values[2];

        let isFlat = true;
        for (let j = 1; j < clone.values.length / 3; j++) {
          if (Math.abs(clone.values[3*j] - restX) > 0.001 ||
              Math.abs(clone.values[3*j+1] - restY) > 0.001 ||
              Math.abs(clone.values[3*j+2] - restZ) > 0.001) {
            isFlat = false;
            break;
          }
        }

        const animNameLower = rawClip.name.toLowerCase();
        const isYoga = animNameLower.includes('yoga');
        const isWalk = !isYoga && (animNameLower.includes('walk') ||
                        animNameLower.includes('run') ||
                        animNameLower.includes('step') ||
                        animNameLower.includes('stairs')) &&
                       !animNameLower.includes('dance');

        if (rootMotionSpace === 'world-meters' || rootMotionSpace === 'rest-meters') {
          const sourceBone = animBones[baseName]?.bone as THREE.Bone | undefined;
          const originalTrack = rawClip.tracks.find(track => track.name === tr.name);
          if (!sourceBone?.parent || !bone.parent?.restWorldQuaternion || !originalTrack) {
            throw new Error(`Repère du root motion métrique manquant : ${rawClip.name}`);
          }
          // Source GLB transforms carry its exact metre scale. Target rest
          // rotation and current model scale map centimetres to bone space.
          // Do not use the target/source hip-height ratio for paired motion.
          const sourceToMeters = new THREE.Matrix3().setFromMatrix4(sourceBone.parent.matrixWorld);
          const targetRest = new THREE.Matrix4().compose(
            new THREE.Vector3(), bone.parent.restWorldQuaternion,
            bone.parent.getWorldScale(new THREE.Vector3())
          );
          const centimetersToTarget = new THREE.Matrix3().setFromMatrix4(targetRest).invert();
          // Solo imports retain their height relative to the standing bind pose;
          // paired Inter-X motion continues to use its first-frame origin.
          const origin = rootMotionSpace === 'rest-meters'
            ? sourceBone.position.clone()
            : new THREE.Vector3().fromArray(originalTrack.values);
          const groundOffset = new THREE.Vector3();
          if (rootMotionSpace === 'world-meters' && animScene && !rawClip.name.toLowerCase().includes('a025')) {
            const mixer = new THREE.AnimationMixer(animScene);
            mixer.clipAction(rawClip).play();
            mixer.setTime(0);
            animScene.updateMatrixWorld(true);
            let lowestFootY = Infinity;
            animScene.traverse(obj => {
              if ((obj as any).isBone && (obj.name.includes('Foot') || obj.name.includes('Toe'))) {
                const v = new THREE.Vector3();
                obj.getWorldPosition(v);
                if (v.y < lowestFootY) lowestFootY = v.y;
              }
            });
            mixer.stopAllAction();
            mixer.uncacheRoot(animScene);
            if (lowestFootY > 0.10 && Number.isFinite(lowestFootY)) {
              groundOffset.set(0, -lowestFootY * 100, 0).applyMatrix3(centimetersToTarget);
            }
          }
          const positions = new THREE.LinearInterpolant(originalTrack.times, originalTrack.values, 3);
          for (let index = 0; index < clone.times.length; index++) {
            const displacement = new THREE.Vector3().fromArray(positions.evaluate(clone.times[index]))
              .sub(origin).applyMatrix3(sourceToMeters).multiplyScalar(100)
              .applyMatrix3(centimetersToTarget).add(groundOffset);
            bone.defaultPosition.clone().add(displacement).toArray(clone.values, index * 3);
          }
        } else if (isFlat && isWalk) {
          const duration = workingClip.duration;
          const fps = 30;
          const numFrames = Math.ceil(duration * fps) + 1;
          const newTimes = new Float32Array(numFrames);
          const newValues = new Float32Array(numFrames * 3);

          for (let f = 0; f < numFrames; f++) {
            const t = Math.min(f / fps, duration);
            newTimes[f] = t;
            const phase = (t / duration) * 2.0 * Math.PI;
            const dx = 0.5 * Math.cos(phase);
            const dy = 0.0;
            const dz = 0.0; // Pas d'oscillation avant/arrière pour éviter la saccade sur la marche in-place

            const dP = new THREE.Vector3(dx, dy, dz)
              .applyQuaternion(P_src)
              .applyQuaternion(P_tgt_inv);
            const resPos = bone.defaultPosition.clone().add(dP);

            newValues[3*f] = resPos.x;
            newValues[3*f+1] = resPos.y;
            newValues[3*f+2] = resPos.z;
          }
          clone.times = newTimes;
          clone.values = newValues;
        } else {
          let yMinDelta = 0;
          if (animNameLower.includes('takedown')) {
            let minY = Infinity;
            for (let j = 0; j < clone.values.length / 3; j++) {
              if (clone.values[3*j+1] < minY) minY = clone.values[3*j+1];
            }
            if (minY < 0) {
              yMinDelta = -minY;
            }
          }

          const isLayingAnim = animNameLower.includes('laying') || animNameLower.includes('sleeping') || animNameLower.includes('situps');

          if (isLayingAnim) {
            const targetHipsHeight = bone.defaultPosition.length();
            const groundHipsY = targetHipsHeight < 5.0 ? 0.12 : 12.0;

            const f0Raw = new THREE.Vector3(clone.values[0], clone.values[1], clone.values[2]);
            const f0World = f0Raw.applyQuaternion(P_src).multiplyScalar(computedHipsRatio);

            for (let j = 0; j < clone.values.length / 3; j++) {
              const rawPos = new THREE.Vector3(clone.values[3*j], clone.values[3*j+1], clone.values[3*j+2]);
              const worldPos = rawPos.applyQuaternion(P_src).multiplyScalar(computedHipsRatio);

              // On conserve les micro-variations naturelles de l'animation (respiration, tremblement) par rapport à f0
              const animDeltaX = worldPos.x - f0World.x;
              const animDeltaY = worldPos.y - f0World.y;
              const animDeltaZ = worldPos.z - f0World.z;

              const deltaWorld = new THREE.Vector3(
                animDeltaX,
                (groundHipsY + animDeltaY) - targetHipsHeight,
                animDeltaZ
              );

              const dP = deltaWorld.applyQuaternion(P_tgt_inv);
              const resPos = bone.defaultPosition.clone().add(dP);

              clone.values[3*j] = resPos.x;
              clone.values[3*j+1] = resPos.y;
              clone.values[3*j+2] = resPos.z;
            }
          } else {
            for (let j = 0; j < clone.values.length / 3; j++) {
              let yVal = clone.values[3*j+1] + yMinDelta;
              // Substring matching also freezes twist-pose, boat-pose and split-pose.
              const isTPose = animNameLower === 't-pose';
              const dy = (isWalk || isTPose) ? 0.0 : (yVal - srcRestPos.y) * computedHipsRatio;
              const dx = (isWalk || isTPose) ? 0.0 : (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
              const dz = (isWalk || isTPose) ? 0.0 : (clone.values[3*j+2] - srcRestPos.z) * computedHipsRatio;

              const dP = new THREE.Vector3(dx, dy, dz)
                .applyQuaternion(P_src)
                .applyQuaternion(P_tgt_inv);
              const resPos = bone.defaultPosition.clone().add(dP);

              clone.values[3*j] = resPos.x;
              clone.values[3*j+1] = resPos.y;
              clone.values[3*j+2] = resPos.z;
            }
          }
        }
      }
    }

    // Retarget rotations
    if (prop === 'quaternion') {
      const bone = targetInstance.getObjectByName(targetBoneName) as any;
      if (bone) {
        if (bone.restLocalQuaternion && bone.restWorldQuaternion) {
          let B_src = null;
          let P_src = null;
          let parentBakeTrack: THREE.KeyframeTrack | null = null;
          let parentBakeRestWorld = new THREE.Quaternion();
          if (animBones[baseName]) {
            B_src = animBones[baseName].restWorldQuaternion.clone();
            P_src = animBones[baseName].parentRestWorldQuaternion.clone();
            if (isHips) {
              // Hips world rest rotation must be neutralized so the character stands up (for Mixamo +90X rest poses)
              B_src = new THREE.Quaternion();
            }

            // Check if we need to bake a missing parent bone animation into the child (e.g. clavicle into arm, or Spine1 into Spine2)
            if (baseName === 'LeftArm' || baseName === 'RightArm') {
              const targetHasClavicle = baseName === 'LeftArm' ? targetHasLeftClavicle : targetHasRightClavicle;
              
              if (!targetHasClavicle) {
                // Target lacks clavicle. Find the clavicle track in the source animation.
                const clavicleSourceNode = animBones[baseName].bone.parent;
                if (clavicleSourceNode) {
                  const sNodeName = clavicleSourceNode.name.toLowerCase().replace(/[:_]/g, '');
                  parentBakeTrack = rawClip.tracks.find(t => {
                    if (!t.name.endsWith('.quaternion')) return false;
                    const bName = t.name.split('.')[0].toLowerCase().replace(/[:_]/g, '');
                    return bName === sNodeName || bName.endsWith(baseName === 'LeftArm' ? 'leftshoulder' : 'rightshoulder');
                  }) || null;
                  if (parentBakeTrack) {
                    const clavicleRestLocal = clavicleSourceNode.quaternion.clone(); // Rest local rotation
                    parentBakeRestWorld = P_src.clone().multiply(clavicleRestLocal.invert());
                  }
                }
              }
            } else if (baseName === 'Spine2' && !targetHasSpine1) {
              // Target lacks Spine1. Find the Spine1 track in the source animation.
              const spine1SourceNode = animBones[baseName].bone.parent;
              if (spine1SourceNode) {
                const sNodeName = spine1SourceNode.name.toLowerCase().replace(/[:_]/g, '');
                parentBakeTrack = rawClip.tracks.find(t => {
                  if (!t.name.endsWith('.quaternion')) return false;
                  const bName = t.name.split('.')[0].toLowerCase().replace(/[:_]/g, '');
                  return bName === sNodeName || bName.endsWith('spine1');
                }) || null;
                if (parentBakeTrack) {
                  const spine1RestLocal = spine1SourceNode.quaternion.clone();
                  parentBakeRestWorld = P_src.clone().multiply(spine1RestLocal.invert());
                }
              }
            }
          } else {
            B_src = new THREE.Quaternion();
            P_src = new THREE.Quaternion();
          }

          if (B_src && P_src) {
            let B_tgt = bone.restWorldQuaternion;
            if (baseName === 'LeftArm' || baseName === 'RightArm') {
              const childBone = bone.children.find((c: any) => c.isBone);
              if (childBone) {
                const boneWorldPos = bone.restWorldPosition || bone.getWorldPosition(new THREE.Vector3());
                const childWorldPos = childBone.restWorldPosition || childBone.getWorldPosition(new THREE.Vector3());
                const worldArmDir = childWorldPos.clone().sub(boneWorldPos).normalize();
                if (worldArmDir.y < -0.15) {
                  const targetDir = baseName === 'LeftArm'
                    ? new THREE.Vector3(1, 0, 0)
                    : new THREE.Vector3(-1, 0, 0);
                  const aPoseOffset = new THREE.Quaternion().setFromUnitVectors(worldArmDir, targetDir);
                  B_tgt = aPoseOffset.multiply(bone.restWorldQuaternion.clone());
                }
              }
            }
            const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
              ? bone.parent.restWorldQuaternion
              : new THREE.Quaternion();
            const P_tgt_inv = P_tgt.clone().invert();
            const B_src_inv = B_src.clone().invert();

            for (let j = 0; j < clone.values.length / 4; j++) {
              const srcLocalQ = new THREE.Quaternion(
                clone.values[4*j],
                clone.values[4*j+1],
                clone.values[4*j+2],
                clone.values[4*j+3]
              );
              
              let currentP_src = P_src.clone();
              if (parentBakeTrack) {
                // Evaluate missing parent bone animation at this frame
                const t = clone.times[j];
                const parentAnimatedLocal = evaluateQuaternionTrack(parentBakeTrack, t);
                currentP_src = parentBakeRestWorld.clone().multiply(parentAnimatedLocal);
              }

              const animWorldQ = currentP_src.multiply(srcLocalQ);
              const deltaQ = animWorldQ.clone().multiply(B_src_inv);
              const tgtAnimWorldQ = deltaQ.clone().multiply(B_tgt);
              const tgtLocalQ = P_tgt_inv.clone().multiply(tgtAnimWorldQ).normalize();

              // Enforce quaternion continuity with previous frame to prevent 360° hemisphere flips
              if (j > 0) {
                const prevX = clone.values[4*(j-1)];
                const prevY = clone.values[4*(j-1)+1];
                const prevZ = clone.values[4*(j-1)+2];
                const prevW = clone.values[4*(j-1)+3];
                const dot = prevX * tgtLocalQ.x + prevY * tgtLocalQ.y + prevZ * tgtLocalQ.z + prevW * tgtLocalQ.w;
                if (dot < 0) {
                  tgtLocalQ.x = -tgtLocalQ.x;
                  tgtLocalQ.y = -tgtLocalQ.y;
                  tgtLocalQ.z = -tgtLocalQ.z;
                  tgtLocalQ.w = -tgtLocalQ.w;
                }
              }

              clone.values[4*j]   = tgtLocalQ.x;
              clone.values[4*j+1] = tgtLocalQ.y;
              clone.values[4*j+2] = tgtLocalQ.z;
              clone.values[4*j+3] = tgtLocalQ.w;
            }
          } else {
            const parentRestWorldQ = (bone.parent && bone.parent.restWorldQuaternion)
              ? bone.parent.restWorldQuaternion
              : new THREE.Quaternion();
            const parentInv = parentRestWorldQ.clone().invert();
            const boneRestLocalQ = bone.restLocalQuaternion.clone();

            for (let i = 0; i < clone.values.length; i += 4) {
              const q = new THREE.Quaternion(clone.values[i], clone.values[i+1], clone.values[i+2], clone.values[i+3]);
              const resQ = parentInv.clone()
                .multiply(q)
                .multiply(parentRestWorldQ)
                .multiply(boneRestLocalQ).normalize();

              if (i >= 4) {
                const prevX = clone.values[i-4];
                const prevY = clone.values[i-3];
                const prevZ = clone.values[i-2];
                const prevW = clone.values[i-1];
                const dot = prevX * resQ.x + prevY * resQ.y + prevZ * resQ.z + prevW * resQ.w;
                if (dot < 0) {
                  resQ.x = -resQ.x;
                  resQ.y = -resQ.y;
                  resQ.z = -resQ.z;
                  resQ.w = -resQ.w;
                }
              }

              clone.values[i] = resQ.x;
              clone.values[i+1] = resQ.y;
              clone.values[i+2] = resQ.z;
              clone.values[i+3] = resQ.w;
            }
          }
        }
      }
    }

    tracks.push(clone);
  }

  return new THREE.AnimationClip(`${workingClip.name}_retargeted`, workingClip.duration, tracks);
}
