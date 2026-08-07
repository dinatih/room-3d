const fs = require('fs');
let content = fs.readFileSync('src/features/scene/Walker.tsx', 'utf-8');

// We will inject a log inside the physics loop to print the quaternion of the first custom bone
content = content.replace(
  `const currentDirWorld = dir.clone().normalize();`,
  `const currentDirWorld = dir.clone().normalize();
              if (!window._boneLogged && activeHairChain === customHairChainRef.current && node === activeHairChain[0]) {
                console.log("[HairPhysics] Bone 0 Quat:", bone.quaternion.toArray().map(n => n.toFixed(3)));
                window._boneLogged = true;
                setTimeout(() => { window._boneLogged = false; }, 1000);
              }`
);

fs.writeFileSync('src/features/scene/Walker.tsx', content);
