const fs = require('fs');
let code = fs.readFileSync('test_metarig.html', 'utf8');

// 1. Remove everything after </html>
const endHtmlIdx = code.indexOf('</html>') + '</html>'.length;
const garbage = code.slice(endHtmlIdx);
code = code.slice(0, endHtmlIdx);

// 2. We also need to define `loadedClips` and `currentAction` since they were missing!
const missingCode = `
    init();

    function init() {
      const container = document.createElement('div');
      document.body.appendChild(container);

      perspCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      perspCamera.position.set(0, 100, 250);
      
      const aspect = window.innerWidth / window.innerHeight;
      const d = 150;
      orthoCamera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
      orthoCamera.position.set(0, 100, 250);
      
      activeCamera = guiOptions.orthoMode ? orthoCamera : perspCamera;
      camera = activeCamera;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xa0a0a0);
      scene.fog = new THREE.Fog(0xa0a0a0, 100, 10000);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
      hemiLight.position.set(0, 200, 0);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 3);
      dirLight.position.set(-30, 100, 100);
      dirLight.castShadow = true;
      scene.add(dirLight);

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const grid = new THREE.GridHelper(1000, 100, 0x000000, 0x000000);
      grid.material.opacity = 0.2;
      grid.material.transparent = true;
      scene.add(grid);

      selectedBoneMarker = new THREE.Mesh(
        new THREE.SphereGeometry(2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x88ccff, depthTest: false, transparent: true, opacity: 0.8 })
      );
      selectedBoneMarker.renderOrder = 999;
      selectedBoneMarker.visible = false;
      scene.add(selectedBoneMarker);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(activeCamera, renderer.domElement);
      controls.target.set(0, 100, 0);
      controls.update();
      window.controls = controls;

      window.addEventListener('resize', onWindowResize);

      clock = new THREE.Clock();
      
      setupGUI();
      createCameraButtons();
      loadModels();
    }

    function createCameraButtons() {
      const btnContainer = document.createElement('div');
      btnContainer.style.position = 'absolute';
      btnContainer.style.bottom = '20px';
      btnContainer.style.right = '20px';
      btnContainer.style.display = 'flex';
      btnContainer.style.gap = '10px';
      document.body.appendChild(btnContainer);

      const views = [
        { label: 'Face', pos: [0, 100, 250] },
        { label: 'Droite', pos: [250, 100, 0] },
        { label: 'Gauche', pos: [-250, 100, 0] },
        { label: 'Derrière', pos: [0, 100, -250] },
        { label: 'Dessus', pos: [0, 250, 1] }
      ];

      views.forEach(view => {
        const btn = document.createElement('button');
        btn.textContent = view.label;
        btn.style.padding = '8px 16px';
        btn.style.cursor = 'pointer';
        btn.onclick = () => {
          activeCamera.position.set(...view.pos);
          activeCamera.lookAt(0, 100, 0);
          if (window.controls) {
            window.controls.target.set(0, 100, 0);
            window.controls.update();
          }
        };
        btnContainer.appendChild(btn);
      });
      
      const orthoCheckbox = document.createElement('label');
      orthoCheckbox.style.padding = '8px 16px';
      orthoCheckbox.style.background = '#ddd';
      orthoCheckbox.style.cursor = 'pointer';
      orthoCheckbox.style.display = 'flex';
      orthoCheckbox.style.alignItems = 'center';
      
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.onchange = (e) => {
        guiOptions.orthoMode = e.target.checked;
        activeCamera = guiOptions.orthoMode ? orthoCamera : perspCamera;
        camera = activeCamera;
        activeCamera.position.copy(window.controls.object.position);
        activeCamera.quaternion.copy(window.controls.object.quaternion);
        window.controls.object = activeCamera;
        window.controls.update();
      };
      
      orthoCheckbox.appendChild(cb);
      orthoCheckbox.appendChild(document.createTextNode(' Orthographique'));
      btnContainer.appendChild(orthoCheckbox);
    }

    function setupGUI() {
      gui = new GUI();
      gui.add(guiOptions, 'showSkeleton').name('Afficher Squelette').onChange(v => {
        if (skeletonHelper) skeletonHelper.visible = v;
      });
      gui.add(guiOptions, 'wireframe').name('Wireframe').onChange(v => {
        if (laraModel) laraModel.traverse(n => { if (n.isMesh && n.material) n.material.wireframe = v; });
      });
      
      guiOptions.togglePause = () => { guiOptions.paused = !guiOptions.paused; };
      gui.add(guiOptions, 'togglePause').name('Pause / Play');
      
      gui.add(guiOptions, 'timeScale', 0.1, 3.0, 0.1).name('Speed');
    }

    let loadedClips = {};
    let currentAction = null;

`;

if (!code.includes('function setupGUI()')) {
  const targetIdx = code.indexOf('    function loadModels() {');
  code = code.slice(0, targetIdx) + missingCode + code.slice(targetIdx);
  fs.writeFileSync('test_metarig.html', code);
  console.log('Fixed file.');
} else {
  console.log('Already fixed.');
}
