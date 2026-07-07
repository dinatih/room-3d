const fs = require('fs');
let code = fs.readFileSync('test_metarig.html', 'utf8');

const missingUI = `
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 2; // Make it easier to click skeleton lines
    const mouse = new THREE.Vector2();

    let selectedBone = null;

    function buildBoneHierarchy(bone) {
      if (!bone.isBone && bone !== laraModel) {
        // If it's a node but not a bone, just traverse children (to find the root bone)
        let html = '';
        bone.children.forEach(c => { html += buildBoneHierarchy(c); });
        return html;
      }
      
      let html = '';
      if (bone.isBone) {
        html += \`<li id="li-bone-\${bone.name}" class="bone-item" onclick="selectBoneByName('\${bone.name}', event)">🦴 \${bone.name}</li>\`;
      }
      
      if (bone.children && bone.children.length > 0) {
        const childHtml = bone.children.map(c => buildBoneHierarchy(c)).join('');
        if (childHtml) {
          if (bone.isBone) {
            html = html.replace('</li>', \`<ul>\${childHtml}</ul></li>\`);
          } else {
            html += childHtml;
          }
        }
      }
      return html;
    }

    const tempBonePos = new THREE.Vector3();
    
    window.selectBoneByName = function(name, event) {
      if (event) event.stopPropagation();
      if (selectedBone) {
        const oldLi = document.getElementById('li-bone-' + selectedBone.name);
        if (oldLi) oldLi.classList.remove('selected');
      }
      const bone = laraModel.getObjectByName(name);
      if (bone) {
        selectedBone = bone;
        const li = document.getElementById('li-bone-' + name);
        if (li) {
          li.classList.add('selected');
          li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        bone.getWorldPosition(tempBonePos);
        selectedBoneMarker.position.copy(tempBonePos);
        selectedBoneMarker.visible = true;
        
        console.log("Selected Bone:", name);
      }
    };

    function updateBoneUI() {
      let infoDiv = document.getElementById('bone-info');
      if (!infoDiv) {
        infoDiv = document.createElement('div');
        infoDiv.id = 'bone-info';
        infoDiv.style.position = 'absolute';
        infoDiv.style.bottom = '10px';
        infoDiv.style.left = '10px';
        infoDiv.style.backgroundColor = '#2a2a2a';
        infoDiv.style.color = '#e0e0e0';
        infoDiv.style.padding = '10px';
        infoDiv.style.maxHeight = '400px';
        infoDiv.style.width = '300px';
        infoDiv.style.overflowY = 'auto';
        infoDiv.style.fontFamily = 'monospace';
        infoDiv.style.fontSize = '12px';
        infoDiv.style.border = '1px solid #444';
        infoDiv.style.borderRadius = '5px';
        infoDiv.style.boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
        
        const style = document.createElement('style');
        style.innerHTML = \`
          #bone-info ul { padding-left: 15px; margin: 2px 0; border-left: 1px dashed #555; }
          #bone-info li { list-style-type: none; margin: 2px 0; cursor: pointer; padding: 2px 4px; border-radius: 3px; }
          #bone-info li:hover { background-color: #3a3a3a; }
          #bone-info li.selected { background-color: rgba(255,255,255,0.15); color: #88ccff; font-weight: bold; border-left: 2px solid #88ccff; }
        \`;
        document.head.appendChild(style);
        document.body.appendChild(infoDiv);
      }
      infoDiv.innerHTML = \`<strong style="color:white;">Bone Hierarchy:</strong><ul>\${buildBoneHierarchy(laraModel)}</ul>\`;
    }

    function findClosestBone(model, worldPoint) {
      let closestBone = null;
      let minDistance = Infinity;
      const tPos = new THREE.Vector3();
      
      model.traverse(node => {
        if (node.isBone) {
          node.getWorldPosition(tPos);
          const dist = tPos.distanceTo(worldPoint);
          if (dist < minDistance) {
            minDistance = dist;
            closestBone = node;
          }
        }
      });
      return closestBone;
    }

    function onPointerDown(event) {
      // Don't intercept clicks on the UI
      if (event.target.tagName === 'LI' || event.target.closest('#bone-info') || event.target.closest('.lil-gui')) {
        return;
      }
      
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (laraModel) {
        const intersects = raycaster.intersectObject(laraModel, true);
        if (intersects.length > 0) {
          const intersectPoint = intersects[0].point;
          const closestBone = findClosestBone(laraModel, intersectPoint);
          if (closestBone) {
            selectBoneByName(closestBone.name);
          }
        }
      }
    }

`;

if (!code.includes('function updateBoneUI()')) {
  const targetIdx = code.indexOf('    let loadedClips = {};');
  code = code.slice(0, targetIdx) + missingUI + code.slice(targetIdx);
  fs.writeFileSync('test_metarig.html', code);
  console.log('Fixed UI.');
} else {
  console.log('Already fixed.');
}
