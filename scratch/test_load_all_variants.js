import fs from 'fs';
import path from 'path';

// Minimal polyfill for Three.js in Node
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.self = global;
global.document = {
  createElement: (type) => {
    if (type === 'canvas') {
      return {
        getContext: () => ({}),
        width: 100,
        height: 100,
        style: {},
      };
    }
    return {};
  },
  createElementNS: () => ({}),
};
Object.defineProperty(global, 'navigator', {
  value: { userAgent: 'node' },
  writable: true,
  configurable: true
});

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

THREE.FileLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  let cleanUrl = url;
  if (cleanUrl.startsWith('file://')) {
    cleanUrl = cleanUrl.substring(7);
  }
  // Try relative to public directory if absolute path not found
  if (!fs.existsSync(cleanUrl)) {
    const publicCleanUrl = path.join('/home/dinatih/Projects/room-3d/public', cleanUrl);
    if (fs.existsSync(publicCleanUrl)) {
      cleanUrl = publicCleanUrl;
    }
  }
  fs.readFile(cleanUrl, (err, data) => {
    if (err) {
      if (onError) onError(err);
    } else {
      const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      onLoad(ab);
    }
  });
};

// Exact functions from all_lara_style.html
function getDepth(bone) {
  let depth = 0;
  let p = bone.parent;
  while (p && p.isBone) {
    depth++;
    p = p.parent;
  }
  return depth;
}

function splitMeshByFingerBones(node, parent) {
  try {
    if (!node.isSkinnedMesh || !node.geometry || !node.geometry.attributes.position || !node.geometry.attributes.skinIndex || !node.geometry.attributes.skinWeight) {
      return;
    }
    
    const skeleton = node.skeleton;
    if (!skeleton || !skeleton.bones) return;
    
    const positionAttr = node.geometry.attributes.position;
    const skinIndexAttr = node.geometry.attributes.skinIndex;
    const skinWeightAttr = node.geometry.attributes.skinWeight;
    const indexAttr = node.geometry.index;
    
    const vertexCount = positionAttr.count;
    const itemSize = skinIndexAttr.itemSize;
    
    const fingerKeywords = ['finger', 'thumb', 'index', 'middle', 'ring', 'pinky', 'hand'];
    
    // Step 1: Classify each vertex
    const isFingerVertex = new Uint8Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
      let hasFingerWeight = false;
      for (let j = 0; j < itemSize; j++) {
        const idx = i * itemSize + j;
        const boneIdx = skinIndexAttr.array[idx];
        const weight = skinWeightAttr.array[idx];
        if (weight > 0.05) {
          const bone = skeleton.bones[boneIdx];
          if (bone && bone.name) {
            const boneNameLower = bone.name.toLowerCase();
            if (fingerKeywords.some(kw => boneNameLower.includes(kw))) {
              hasFingerWeight = true;
              break;
            }
          }
        }
      }
      isFingerVertex[i] = hasFingerWeight ? 1 : 0;
    }
    
    // Check if there are vertices of both types. If not, no need to split!
    let fingerVerts = 0;
    for (let i = 0; i < vertexCount; i++) {
      if (isFingerVertex[i]) fingerVerts++;
    }
    if (fingerVerts === 0 || fingerVerts === vertexCount) {
      return;
    }
    
    console.log(`[splitMesh] Splitting mesh ${node.name} (${vertexCount} vertices) into finger_nails (${fingerVerts} verts) and accessories (${vertexCount - fingerVerts} verts)`);
    
    if (!indexAttr) return;
    
    const indexArray = indexAttr.array;
    const faceCount = indexArray.length / 3;
    
    const fingerIndices = [];
    const otherIndices = [];
    
    for (let i = 0; i < faceCount; i++) {
      const idx0 = indexArray[i * 3];
      const idx1 = indexArray[i * 3 + 1];
      const idx2 = indexArray[i * 3 + 2];
      
      const isFingerFace = isFingerVertex[idx0] || isFingerVertex[idx1] || isFingerVertex[idx2];
      
      if (isFingerFace) {
        fingerIndices.push(idx0, idx1, idx2);
      } else {
        otherIndices.push(idx0, idx1, idx2);
      }
    }
    
    // Create the finger nails mesh
    const fingerGeom = node.geometry.clone();
    fingerGeom.setIndex(new THREE.BufferAttribute(new (indexArray.constructor)(fingerIndices), 1));
    fingerGeom.groups = [];
    const fingerMesh = new THREE.SkinnedMesh(fingerGeom, node.material);
    fingerMesh.name = 'finger_nails';
    fingerMesh.bind(skeleton, node.bindMatrix);
    
    // Create the other (ribbon/accessories) mesh
    const otherGeom = node.geometry.clone();
    otherGeom.setIndex(new THREE.BufferAttribute(new (indexArray.constructor)(otherIndices), 1));
    otherGeom.groups = [];
    const otherMesh = new THREE.SkinnedMesh(otherGeom, node.material);
    otherMesh.name = node.name;
    otherMesh.bind(skeleton, node.bindMatrix);
    
    // Add them to the parent and remove the original node
    parent.add(fingerMesh);
    parent.add(otherMesh);
    
    // Mark the original node for removal
    node.userData.toBeRemoved = true;
  } catch (err) {
    console.error("Error in splitMeshByFingerBones for node:", node.name, err);
  }
}

const variants = [
  { id: 'lara_croft_324_rigged', label: 'Lara 324 Rigged', file: 'media/all_lara/lara_croft_324_rigged.glb' },
  { id: 'lara_croft_43254_rigged', label: 'Lara 43254 Rigged', file: 'media/all_lara/lara_croft_43254_rigged.glb' },
  { id: 'lara_croft_4543', label: 'Lara 4543', file: 'media/all_lara/lara_croft_4543.glb' },
  { id: 'lara_croft_motorcycle_gear', label: 'Motorcycle Gear', file: 'media/all_lara/lara_croft_motorcycle_gear.glb' },
  { id: 'lara_croft_spy_gear', label: 'Spy Gear', file: 'media/all_lara/lara_croft_spy_gear.glb' },
  { id: 'lara_croft_suit', label: 'Suit', file: 'media/all_lara/lara_croft_suit.glb' },
  { id: 'lara_croft_brown_jacket', label: 'Brown Jacket', file: 'media/all_lara/lara_croft_brown_jacket.glb' },
  { id: 'lara_croft_swim_gear', label: 'Swim Gear', file: 'media/all_lara/lara_croft_swim_gear.glb' },
  { id: 'lara_croft_swim_gear_1', label: 'Swim Gear 1', file: 'media/all_lara/lara_croft_swim_gear_1.glb' },
  { id: 'lara_croft_dress_345', label: 'Dress 345', file: 'media/all_lara/lara_croft_dress_345.glb' },
  { id: 'lara_croft_red_dress', label: 'Red Dress', file: 'media/all_lara/lara_croft_red_dress.glb' },
  { id: 'lara_croft_swim_gear_243', label: 'Swim Gear 243', file: 'media/all_lara/lara_croft_swim_gear_243.glb' },
  { id: 'lara_croft_black_tank_top', label: 'Black Tank Top', file: 'media/all_lara/lara_croft_black_tank_top.glb' },
  { id: 'lara_croft_4259', label: 'Lara 4259', file: 'media/all_lara/lara_croft_4259.glb' },
  { id: 'lara_croft_3254_rigged', label: 'Lara 3254 Rigged', file: 'media/all_lara/lara_croft_3254_rigged.glb' },
  { id: 'lara_croft_gold_shades', label: 'Gold Shades', file: 'media/all_lara/lara_croft_gold_shades.glb' },
  { id: 'lara_officiel', label: 'Lara Officiel', file: 'media/all_lara/lara_original_88_bones.glb' },
  { id: 'lara_croft_zip', label: 'Swim', file: 'media/all_lara/lara_croft_zip.glb' },
  { id: 'lara_croft_543i', label: 'Lara 543i', file: 'media/all_lara/lara_croft_543i.glb' },
  { id: 'xbot_studio', label: 'X-Bot (Studio)', file: 'media/all_lara/xbot_studio.glb' }
];

async function testLoad(v) {
  const filePath = path.join('/home/dinatih/Projects/room-3d/public', v.file);
  const loader = new GLTFLoader();

  return new Promise((resolve) => {
    loader.load(filePath, gltf => {
      const model = gltf.scene;
      model.name = v.label;
      
      try {
        model.updateMatrixWorld(true);
        
        // Pre-process
        if (v.id === 'lara_croft_spy_gear' || v.id === 'lara_croft_motorcycle_gear' || v.id === 'lara_croft_3254_rigged') {
          const meshesToSplit = [];
          model.traverse(c => {
            if (c.isSkinnedMesh) {
              const cNameLower = (c.name || '').toLowerCase();
              if (cNameLower.includes('object_108') || cNameLower.includes('grenade.002') || cNameLower.includes('grenade')) {
                meshesToSplit.push({ node: c, parent: c.parent });
              }
            }
          });
          meshesToSplit.forEach(item => {
            splitMeshByFingerBones(item.node, item.parent);
          });
          // Remove original nodes that were split
          const toRemove = [];
          model.traverse(c => {
            if (c.userData.toBeRemoved) {
              toRemove.push(c);
            }
          });
          toRemove.forEach(c => {
            if (c.parent) c.parent.remove(c);
          });
        }
        
        // Hair bones rename
        const targetHairBones = [];
        model.traverse(c => {
          if (c.isBone) {
            const nameLower = (c.name || '').toLowerCase();
            if (nameLower.includes('hair') || nameLower.includes('ponytail')) {
              targetHairBones.push({ bone: c, depth: getDepth(c) });
            }
          }
        });
        targetHairBones.sort((a, b) => a.depth - b.depth);
        targetHairBones.forEach((hb, idx) => {
          hb.bone.name = `hair_${idx + 1}`;
        });

        // Other traversal
        model.traverse(c => {
          c.restWorldQuaternion = c.getWorldQuaternion(new THREE.Quaternion());
          if (c.isBone) {
            c.defaultPosition = c.position.clone();
            c.defaultRotation = c.rotation.clone();
            c.defaultScale = c.scale.clone();
            c.restLocalQuaternion = c.quaternion.clone();
          }
          if (c.isMesh) {
            c.userData.originalName = c.name;
            c.material = c.material.clone();
          }
        });

        const skeletonHelper = new THREE.SkeletonHelper(model);
        console.log(`[OK] ${v.label} loaded and preprocessed fine.`);
        resolve({ success: true });
      } catch (err) {
        console.error(`[ERROR] ${v.label} processing failed:`, err);
        resolve({ success: false, error: err });
      }
    }, undefined, err => {
      console.error(`[LOAD ERROR] ${v.label} load failed:`, err);
      resolve({ success: false, loadError: err });
    });
  });
}

async function main() {
  console.log("Starting loading tests of all variants...");
  const results = [];
  for (const v of variants) {
    const res = await testLoad(v);
    results.push({ variant: v, ...res });
  }
  
  console.log("\n--- TEST SUMMARY ---");
  results.forEach(r => {
    if (r.success) {
      console.log(`✅ ${r.variant.label}: Success`);
    } else {
      console.log(`❌ ${r.variant.label}: FAILED (Error: ${r.error || r.loadError})`);
    }
  });
}

main();
