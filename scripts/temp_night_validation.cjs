const assert = require('node:assert/strict');
const fs = require('node:fs');
const launch = require('./browser-test-options.cjs');
(async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 5179, strictPort: true } });
  let browser;
  try {
    await server.listen();
    browser = await launch({ args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5179');
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
      createRoot(document.getElementById('weather-test')).render(React.createElement(Canvas, { camera: { position: [150, 100, 150], far: 10000 }, onCreated: ({ camera, scene }) => { camera.layers.enableAll(); camera.lookAt(150, 0, 0); window.weatherScene = scene; window.weatherCamera = camera; } }, React.createElement(React.Fragment, null, React.createElement(SimulationClock), React.createElement('ambientLight', { intensity: 2 }), React.createElement('directionalLight', { position: [150, 500, 300], intensity: 2 }), React.createElement(Weather), React.createElement(Rain, { snow: true }), React.createElement(React.Suspense, { fallback: null }, React.createElement(BermudaGround, { active: true })))));
    });
    await page.waitForFunction(() => window.weatherScene?.children.some(child => child.children.length), { timeout: 30000 });
    await page.evaluate(() => new Promise(resolve => { let frames = 0; function tick() { if (++frames === 30) resolve(); else requestAnimationFrame(tick); } requestAnimationFrame(tick); }));
    await page.waitForFunction(() => { let found = false; window.weatherScene.traverse(object => { if (object.userData.birdSupport?.id === 'garden-ground') found = true; }); return found; });
    const shader = await page.evaluate(() => { const mesh = window.weatherScene.children.find(child => child.type === 'Group').children[0]; return { coverage: mesh.material.uniforms.coverage.value, offset: mesh.material.uniforms.offset.value.toArray() }; });
    assert.equal(shader.coverage, 0.8, 'Coverage reaches the rendered material');
    assert.ok(Math.hypot(...shader.offset) > 0, 'Wind updates the rendered material');
    const flakes = await page.evaluate(() => { const points = window.weatherScene.children.find(child => child.type === 'Points'); return { count: points.geometry.drawRange.count, finite: Array.from(points.geometry.attributes.position.array).every(Number.isFinite), nearby: Array.from(points.geometry.attributes.position.array).every((value, index) => index % 3 === 1 || Math.abs(value - (index % 3 === 0 ? window.weatherCamera.position.x : window.weatherCamera.position.z)) <= 901) }; });
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
    assert.deepEqual(errors, [], 'No browser or shader errors');
    fs.writeFileSync('/tmp/room-night-validation.json', JSON.stringify(result, null, 2));
    console.log('PASS: browser-loaded day/night curves and lunar trajectory');
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
