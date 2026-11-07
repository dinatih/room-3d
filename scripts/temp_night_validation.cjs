const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
const WEATHER_BASELINE_REF = 'cd5899f19cb401d4661fec7102d9f7bc1a517faf';
if (process.argv.includes('--inspect-plants')) {
  for (const path of ['public/items/plant-monstera/potted_palm.glb', 'public/items/yucca10329308/Yucca10329308.glb']) {
    const data = fs.readFileSync(path), gltf = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString());
    console.log(path, JSON.stringify(gltf.meshes.map(mesh => ({ name: mesh.name, parts: mesh.primitives.map(part => ({ material: gltf.materials[part.material].name, bounds: gltf.accessors[part.attributes.POSITION] })) }))));
  }
  process.exit(0);
}
(async () => {
  const { createServer } = await import('vite');
  const baseline = process.argv.includes('--weather-perf=before');
  const baselineFiles = ['Rain.tsx', 'DayNight.tsx', 'Weather.tsx', 'WeatherAudio.tsx', 'ai/laraLifeStore.ts', 'building/Floor.tsx'];
  const server = await createServer({ server: { host: '127.0.0.1', port: 5179, strictPort: true, hmr: false }, plugins: [{
    name: 'isolated-weather-test', enforce: 'pre', transform(source, id) {
      const file = baseline && baselineFiles.find(file => id.split('?')[0].endsWith('/src/features/scene/' + file));
      if (file) {
        return { code: require('node:child_process').execFileSync('git', ['show', WEATHER_BASELINE_REF + ':src/features/scene/' + file], { encoding: 'utf8' }), map: null };
      }
    }, configureServer(vite) {
      vite.middlewares.use('/__weather_test', (_request, response) => {
        response.setHeader('Content-Type', 'text/html');
        response.end(`<html><body><script type="module">
          import RefreshRuntime from '/@react-refresh';
          RefreshRuntime.injectIntoGlobalHook(window);
          window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => type => type;
          window.__vite_plugin_react_preamble_installed__ = true;
        </script></body></html>`);
      });
    }
  }] });
  let browser;
  try {
    await server.listen();
    browser = await launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5179/__weather_test');
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', message => { if (message.type() === 'error' && /shader|WebGLProgram/.test(message.text())) errors.push(message.text()); });
    const result = await page.evaluate(async () => {
      const { simulationClock, advanceSimulationClock, characterLives, useLaraLifeStore } = await import('/src/features/scene/ai/laraLifeStore.ts');
      const beforeTime = simulationClock.minutes;
      useLaraLifeStore.setState({ speed: 3 });
      advanceSimulationClock(2);
      if (Math.abs(simulationClock.minutes - beforeTime - 6) > 1e-9) throw Error('Shared clock speed');
      if (Object.values(characterLives).some(life => life.elapsedSeconds !== simulationClock.minutes)) throw Error('Character clock drift');
      if (Object.values(useLaraLifeStore.getState().characters).some(life => life.elapsedSeconds !== simulationClock.minutes)) throw Error('Displayed clock drift');
      advanceSimulationClock(0);
      if (Math.abs(simulationClock.minutes - beforeTime - 6) > 1e-9) throw Error('Shared clock pause');
      useLaraLifeStore.setState({ speed: 1 });
      const { daylight } = await import('/src/features/scene/DayNight.tsx');
      const { advanceWeatherSurface } = await import('/src/features/scene/weatherSurface.ts');
      const snowy = advanceWeatherSurface({ snow: 0, water: 0 }, 0, 1, 30);
      if (snowy.snow !== 1) throw Error('Snow accumulation');
      const wet = advanceWeatherSurface({ snow: 0, water: 0 }, 1, 0, 15);
      if (wet.water !== 1) throw Error('Puddle accumulation');
      const dry = advanceWeatherSurface(wet, 0, 0, 120);
      if (dry.water !== 0) throw Error('Drying');
      const paused = advanceWeatherSurface(snowy, 1, 0, 0);
      if (paused.snow !== snowy.snow) throw Error('Paused surface');
      const melting = advanceWeatherSurface(snowy, 1, 0, 15);
      if (!(melting.snow < snowy.snow && melting.water > 0)) throw Error('Rain melts snow');
      const { useWeather } = await import('/src/features/scene/Weather.tsx');
      if (!useWeather.getState().automatic) throw Error('Weather should default to automatic');
      useWeather.setState({ automatic: false });
      if (new URL(location.href).searchParams.get('weatherAuto') !== '0') throw Error('Manual URL state');
      useWeather.setState({ automatic: true });
      if (new URL(location.href).searchParams.get('weatherAuto') !== '1') throw Error('Automatic URL state');
      const { automaticWeather } = await import('/src/features/scene/Weather.tsx');
      for (const [minute, condition] of [[30, 'clear'], [390, 'cloudy'], [750, 'rain'], [1110, 'snow']]) {
        const weather = automaticWeather(minute);
        if (condition === 'clear' && Math.abs(weather.coverage - 0.05) > 1e-9) throw Error('Clear phase');
        if (condition === 'cloudy' && Math.abs(weather.coverage - 0.8) > 1e-9) throw Error('Cloudy phase');
        if (condition === 'rain' && Math.abs(weather.rain - 0.8) > 1e-9) throw Error('Rain phase');
        if (condition === 'snow' && Math.abs(weather.snow - 0.8) > 1e-9) throw Error('Snow phase');
      }
      for (const boundary of [360, 720, 1080, 1440]) {
        const before = automaticWeather(boundary - 0.001), after = automaticWeather(boundary);
        if (Math.abs(before.coverage - after.coverage) > 0.001) throw Error('Weather discontinuity');
      }
      const hours = [0, 6, 7, 8, 12, 18, 20, 22, 24];
      return hours.map(hour => ({ hour, light: daylight(hour), moonY: Math.sin(((hour + 6) % 24) / 24 * Math.PI * 2) }));
    });
    for (const { hour, light, moonY } of result) {
      assert.ok(Number.isFinite(light) && light >= 0 && light <= 1);
      if ([0, 6, 22, 24].includes(hour)) assert.equal(light, 0);
      if ([8, 12, 18].includes(hour)) assert.equal(light, 1);
      if (hour === 0) assert.ok(moonY > 0);
      if (hour === 12) assert.ok(moonY < 0);
    }
    await page.evaluate(async () => {
      const { default: React } = await import('/node_modules/.vite/deps/react.js');
      const { default: { createRoot } } = await import('/node_modules/.vite/deps/react-dom_client.js');
      const { Canvas } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { Weather, useWeather } = await import('/src/features/scene/Weather.tsx');
      const { WindPlant } = await import('/src/features/scene/WindPlant.tsx');
      const { DayNight } = await import('/src/features/scene/DayNight.tsx');
      const { SimulationClock } = await import('/src/features/scene/SimulationClock.tsx');
      const { cameraState } = await import('/src/features/scene/cameraState.ts');
      cameraState.isSceneLaunched = true;
      const { Rain } = await import('/src/features/scene/Rain.tsx');
      const { BermudaGround } = await import('/src/features/scene/building/BermudaGround.tsx');
      const { weatherSurface } = await import('/src/features/scene/weatherSurface.ts');
      Object.assign(weatherSurface, { snow: 0.5, water: 0.8 });
      document.head.querySelectorAll('style, link[rel=stylesheet]').forEach(element => element.remove());
      document.body.innerHTML = '<div id="weather-test" style="width:800px;height:600px"></div>';
      useWeather.setState({ coverage: 0.8, windSpeed: 5, snow: 1, automatic: false });
      createRoot(document.getElementById('weather-test')).render(React.createElement(Canvas, { camera: { position: [150, 100, 150], far: 10000 }, onCreated: ({ camera, scene }) => { camera.layers.enableAll(); camera.lookAt(150, 0, 0); window.weatherScene = scene; window.weatherCamera = camera; } }, React.createElement(React.Fragment, null, React.createElement(SimulationClock), React.createElement('ambientLight', { intensity: 2 }), React.createElement('directionalLight', { position: [150, 500, 300], intensity: 2 }), React.createElement(Weather), React.createElement(WindPlant, { rootHeight: 35 }, React.createElement('mesh', { name: 'wind-test-plant', position: [0, 70, 0] }, React.createElement('boxGeometry', { args: [20, 140, 20] }), React.createElement('meshStandardMaterial', { color: 'green' }))), React.createElement(DayNight), React.createElement(Rain, { snow: true }), React.createElement(Rain), React.createElement(React.Suspense, { fallback: null }, React.createElement(BermudaGround, { active: true })))));
    });
    await page.waitForFunction(() => window.weatherScene?.children.some(child => child.children.length), { timeout: 30000 });
    await page.evaluate(() => new Promise(resolve => { let frames = 0; function tick() { if (++frames === 30) resolve(); else requestAnimationFrame(tick); } requestAnimationFrame(tick); }));
    await page.waitForFunction(() => { let found = false; window.weatherScene.traverse(object => { if (object.userData.birdSupport?.id === 'garden-ground') found = true; }); return found; });
    const shader = await page.evaluate(() => { const mesh = window.weatherScene.children.find(child => child.type === 'Group').children[0]; return { coverage: mesh.material.uniforms.coverage.value, offset: mesh.material.uniforms.offset.value.toArray() }; });
    assert.equal(shader.coverage, 0.8, 'Coverage reaches the rendered material');
    assert.ok(Math.hypot(...shader.offset) > 0, 'Wind updates the rendered material');
    const perfArgument = process.argv.find(argument => argument.startsWith('--weather-perf='));
    if (perfArgument) {
      const session = await page.createCDPSession();
      await session.send('Performance.enable');
      const cpuBefore = (await session.send('Performance.getMetrics')).metrics;
      const measurements = await page.evaluate(async () => {
        const THREE = await import('/node_modules/.vite/deps/three.js');
        const { useWeather } = await import('/src/features/scene/Weather.tsx');
        const { useLaraLifeStore } = await import('/src/features/scene/ai/laraLifeStore.ts');
        useWeather.setState({ automatic: false, rain: 1, snow: 1, windSpeed: 5 });
        const roof = new THREE.Mesh(new THREE.BoxGeometry(350, 20, 800), new THREE.MeshBasicMaterial());
        roof.name = 'ceiling-group'; roof.position.set(150, 250, 350); window.weatherScene.add(roof);
        let raycasts = 0, clockEvents = 0;
        const original = THREE.Raycaster.prototype.intersectObject;
        THREE.Raycaster.prototype.intersectObject = function(object, ...args) { if (object.name === 'ceiling-group') raycasts++; return original.call(this, object, ...args); };
        const unsubscribe = useLaraLifeStore.subscribe((state, previous) => { if (state.characters !== previous.characters) clockEvents++; });
        const buffers = window.weatherScene.children.filter(object => object.type === 'Points' || object.type === 'LineSegments').map(object => object.geometry.attributes.position);
        const before = buffers.map(buffer => buffer.version), times = [];
        let last = performance.now();
        await new Promise(resolve => { function frame(now) { times.push(now-last); last=now; if (times.length === 120) resolve(); else requestAnimationFrame(frame); } requestAnimationFrame(frame); });
        unsubscribe(); THREE.Raycaster.prototype.intersectObject = original;
        return { frames: times.length, meanFrameMs: times.reduce((a,b)=>a+b,0)/times.length, p95FrameMs: times.sort((a,b)=>a-b)[Math.floor(times.length*0.95)], raycasts, clockEvents, positionUploads: buffers.reduce((sum, buffer, i) => sum + buffer.version-before[i], 0) };
      });
      assert.deepEqual(errors, [], 'No shader or browser errors during benchmark');
      if (!baseline) { assert.equal(measurements.raycasts, 0); assert.equal(measurements.positionUploads, 0); }
      const cpuAfter = (await session.send('Performance.getMetrics')).metrics;
      for (const name of ['TaskDuration', 'ScriptDuration']) measurements[name + 'MsPerFrame'] = (cpuAfter.find(metric => metric.name === name).value - cpuBefore.find(metric => metric.name === name).value) * 1000 / measurements.frames;
      const path = `/tmp/room-weather-perf-${perfArgument.split('=')[1]}.json`;
      fs.writeFileSync(path, JSON.stringify(measurements, null, 2)); console.log('Weather benchmark', measurements); return;
    }
    const plant = await page.evaluate(() => {
      const mesh = window.weatherScene.getObjectByName('wind-test-plant');
      const shader = { uniforms: {}, vertexShader: '#include <begin_vertex>' };
      mesh.material.onBeforeCompile(shader);
      const depth = { uniforms: {}, vertexShader: '#include <begin_vertex>' };
      mesh.customDepthMaterial.onBeforeCompile(depth);
      return { root: shader.uniforms.plantRoot.value, crown: shader.uniforms.plantCrown.value, wind: shader.uniforms.plantWind.value.length(), matchingShadow: depth.vertexShader === shader.vertexShader, baseY: mesh.geometry.attributes.position.array[1] };
    });
    assert.equal(plant.root, 35); assert.equal(plant.crown, 105);
    assert.ok(plant.wind > 0); assert.ok(plant.matchingShadow);
    const still = await page.evaluate(async () => {
      const { useWeather } = await import('/src/features/scene/Weather.tsx');
      useWeather.setState({ windSpeed: 0 });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const shader = { uniforms: {}, vertexShader: '#include <begin_vertex>' };
      window.weatherScene.getObjectByName('wind-test-plant').material.onBeforeCompile(shader);
      return shader.uniforms.plantWind.value.length();
    });
    assert.equal(still, 0, 'No plant movement when wind is zero');
    const flakes = await page.evaluate(() => { const points = window.weatherScene.children.find(child => child.type === 'Points'); return { count: points.geometry.drawRange.count, finite: Array.from(points.geometry.attributes.position.array).every(Number.isFinite), nearby: points.material.uniforms.center.value.x === window.weatherCamera.position.x && points.material.uniforms.center.value.y === window.weatherCamera.position.z }; });
    assert.equal(flakes.count, 4000);
    assert.ok(flakes.nearby, 'Snow stays in the local viewing volume');
    assert.ok(flakes.finite, 'Snow coordinates stay finite');
    await page.screenshot({ path: '/tmp/room-weather-preview.png' });
    await page.evaluate(async () => {
      const { weatherSurface } = await import('/src/features/scene/weatherSurface.ts');
      Object.assign(weatherSurface, { snow: 0, water: 1 });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.screenshot({ path: '/tmp/room-puddles-preview.png' });
    await page.evaluate(async () => {
      const { useWeather } = await import('/src/features/scene/Weather.tsx');
      useWeather.setState({ rain: 0.5, windSpeed: 10, rainVolume: 0.5 });
      window.windAudioGains = [];
      const Base = window.AudioContext;
      window.AudioContext = class extends Base {
        createGain() {
          const node = super.createGain(), original = node.gain.setTargetAtTime.bind(node.gain);
          node.gain.setTargetAtTime = (value, ...args) => { node.target = value; return original(value, ...args); };
          window.windAudioGains.push(node); return node;
        }
      };
    });
    await page.mouse.click(400, 300);
    await page.waitForFunction(() => window.windAudioGains.length === 2 && window.windAudioGains.every(node => node.target > 0)).catch(async error => { console.error('Audio test state', await page.evaluate(() => window.windAudioGains.map(node => ({ target: node.target, state: node.context.state })))); throw error; });
    const indoorAudio = await page.evaluate(async () => {
      const original = window.weatherCamera.position.clone();
      window.weatherCamera.position.set(-200, 100, 150);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const outside = window.windAudioGains[0].target;
      window.weatherCamera.position.set(150, 100, 150);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const inside = window.windAudioGains[0].target;
      window.weatherCamera.position.copy(original);
      const { useWeather } = await import('/src/features/scene/Weather.tsx');
      useWeather.setState({ rainVolume: 0 });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return { outside, inside, muted: window.windAudioGains.every(node => node.target === 0) };
    });
    assert.ok(indoorAudio.inside < indoorAudio.outside, 'Weather audio is quieter indoors');
    assert.ok(indoorAudio.muted, 'Shared weather volume mutes both audio bands');
    const automaticChanged = await page.evaluate(async () => {
      const { useWeather } = await import('/src/features/scene/Weather.tsx');
      useWeather.setState({ automatic: true, coverage: 0.42 });
      const before = useWeather.getState().coverage;
      await new Promise(resolve => { let frames = 0; function tick() { if (++frames === 30) resolve(); else requestAnimationFrame(tick); } requestAnimationFrame(tick); });
      const { simulationClock, characterLives } = await import('/src/features/scene/ai/laraLifeStore.ts');
      if (Object.values(characterLives).some(life => life.elapsedSeconds !== simulationClock.minutes)) throw Error('Character clocks diverged during weather evolution');
      return before !== useWeather.getState().coverage;
    });
    assert.ok(automaticChanged, 'Shared clock advances weather without a character controller');
    await page.evaluate(async () => {
      const { advanceSimulationClock, simulationClock } = await import('/src/features/scene/ai/laraLifeStore.ts');
      const { useSceneStore } = await import('/src/features/scene/store/useSceneStore.ts');
      const wait = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      advanceSimulationClock(600 - simulationClock.minutes);
      await wait();
      if (!useSceneStore.getState().layers.lightsHD || !useSceneStore.getState().furniture.lampOn) throw Error('Night lighting automation');
      advanceSimulationClock(720);
      await wait();
      if (useSceneStore.getState().layers.lightsHD || useSceneStore.getState().furniture.lampOn) throw Error('Sunrise lighting automation');
    });
    assert.deepEqual(errors, [], 'No browser or shader errors');
    await page.evaluate(async () => {
      const { useWeather } = await import('/src/features/scene/Weather.tsx');
      const { weatherSurface } = await import('/src/features/scene/weatherSurface.ts');
      useWeather.setState({ automatic: false, rain: 0.6, snow: 0, windSpeed: 7, rainVolume: 0.2 });
      Object.assign(weatherSurface, { snow: 0.3, water: 0.6 });
      window.dispatchEvent(new Event('pagehide'));
      const url = new URL(location.href); url.searchParams.delete('weatherAuto');
      history.replaceState(history.state, '', url);
    });
    await page.reload();
    const restored = await page.evaluate(async () => {
      const { useWeather } = await import('/src/features/scene/Weather.tsx');
      const { weatherSurface } = await import('/src/features/scene/weatherSurface.ts');
      const { WEATHER_SAVE_KEY, parseWeatherSave } = await import('/src/features/scene/weatherPersistence.ts');
      const saved = parseWeatherSave(localStorage.getItem(WEATHER_SAVE_KEY));
      const state = useWeather.getState();
      return { rain: state.rain, windSpeed: state.windSpeed, volume: state.rainVolume, automatic: state.automatic, surface: { ...weatherSurface }, savedSurface: saved.surface, error: state.saveError };
    });
    assert.equal(restored.rain, 0.6); assert.equal(restored.windSpeed, 7); assert.equal(restored.volume, 0.2);
    assert.equal(restored.automatic, false); assert.equal(restored.error, null);
    assert.deepEqual(restored.surface, restored.savedSurface);
    await page.goto('http://127.0.0.1:5179/__weather_test?weatherAuto=1');
    assert.equal(await page.evaluate(async () => (await import('/src/features/scene/Weather.tsx')).useWeather.getState().automatic), true, 'URL overrides saved manual mode');
    fs.writeFileSync('/tmp/room-night-validation.json', JSON.stringify(result, null, 2));
    console.log('PASS: browser-loaded day/night curves and lunar trajectory');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
