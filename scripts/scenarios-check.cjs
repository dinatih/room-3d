/** Run with node scripts/temp_kitchen_navigation_check.cjs --browser --scenarios-only. */
module.exports = async function checkScenarios(page) {
  const result = await page.evaluate(async () => {
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const scenarios = await import('/src/features/scene/ai/scenarios.ts');
    const activities = await import('/src/features/scene/ai/autonomousActivities.ts');
    const { SpatialZoneManager } = await import('/src/features/scene/ai/SpatialZone.ts');
    const { useAgentController } = await import('/src/features/scene/ai/useAgentController.ts');
    const React = (await import('/node_modules/.vite/deps/react.js')).default;
    const { createRoot } = (await import('/node_modules/.vite/deps/react-dom_client.js')).default;
    const { flushSync } = (await import('/node_modules/.vite/deps/react-dom.js')).default;
    const { SMART_OBJECTS, getAllSmartObjects, buildSmartObjectInstructionSequence, getSmartObject } = window.smartObjects;
    const nav = window.nav, occupancy = window.occupancy, camera = window.cameraState;
    const privateId = 'building-b-corridor-end';
    const origin = { x: 160, y: 0, z: 300, rotY: 0 };
    const profile = nav.getAgentProfile('native');
    camera.isSceneLaunched = true;
    for (const id of Object.keys(camera.positions)) delete camera.positions[id];
    nav.useSceneStore.setState(s => ({ layers: { ...s.layers, npcCollisions: true } }));
    window.duoManager.leaveAllSessions();

    const tour = scenarios.buildGuidedTour(origin);
    const expected = getAllSmartObjects().filter(obj => !obj.ownerCharacterId).map(obj => obj.id).sort();
    check(JSON.stringify(tour.slice(0,-1).map(i => i.smartObjectId).sort()) === JSON.stringify(expected), 'Visit every public active object once');
    check(tour.at(-1).type === 'RETURN_TO_START', 'Return to original position');
    check(tour.slice(0,-1).every(i => i.type === 'OBSERVE_OBJECT' && i.duration === 2 && !i.slotId && !i.triggerEventKey && !i.animation), 'Observation has no interactions');
    check(tour.some(i => i.smartObjectId === 'desk-bollsidan-1'), 'Objects with no actions remain in tour');
    const second = scenarios.buildGuidedTour(origin);
    tour[0].duration = 500;
    check(second[0].duration === 2, 'Tours cannot mutate each other');
    check(!activities.buildAutonomousActivities('native').some(i => i.smartObjectId === privateId), 'Autonomous NPC cannot select private rest');
    check(activities.buildAutonomousActivities('sara').some(i => i.smartObjectId === 'inyeong-cha-hugs-point'), 'Duo activities retained');
    for (const char of ['native', 'rosanna', undefined]) {
      check(!occupancy.canUseObject(privateId, char), 'Non-owner access denied');
      check(!occupancy.claimSlot(privateId, 'visit', char ?? 'anonymous'), 'Non-owner reservation denied');
      check(occupancy.getAvailableSlot(privateId, char ?? 'anonymous') === null, 'No alternate private slot');
      check(buildSmartObjectInstructionSequence(privateId, 'visit', char).length === 0, 'No private action sequence');
    }
    check(occupancy.canUseObject(privateId, 'xbot'), 'Xbot permanently allowed');
    check(occupancy.claimSlot(privateId, 'visit', 'xbot'), 'Xbot can claim rest');
    occupancy.releaseAllForCharacter('xbot');
    check(!occupancy.claimSlot(privateId, 'watchdog', 'native'), 'Released owner reservation stays private');
    check(occupancy.getOccupant(privateId, 'visit') === null, 'Access restriction is distinct from occupation');
    check(SpatialZoneManager.getZone('living'), 'Zone module initializes without circular import errors');
    const round = scenarios.buildConciergeTour(), anotherRound = scenarios.buildConciergeTour();
    check(round.filter(i => i.type === 'ROTATE_360').length === 4, 'Four inspected zones');
    check(round.at(-1).duration === 90 && round.at(-1).smartObjectId === privateId, '90 second rest with persistent claim');
    round[0].targetZoneId = 'invalid';
    check(anotherRound[0].targetZoneId === 'entrance-outside', 'Concierge tours cannot mutate each other');

    const host = document.createElement('div'); document.body.append(host);
    const root = createRoot(host);
    let handle, state, done, interactionOwner, claims = 0, duos = 0;
    const claim = occupancy.claimSlot, duo = window.duoManager.startDuoSession;
    occupancy.claimSlot = function(...args) { claims++; return claim.apply(this,args); };
    window.duoManager.startDuoSession = function(...args) { duos++; return duo.apply(this,args); };
    function Probe({ id, sequence, loop }) {
      handle = useAgentController(id, sequence, loop, () => state ?? origin, () => { done++; });
      return null;
    }
    const mount = (id, sequence, loop = false, start = origin) => {
      nav.setAgentProfile(id, profile);
      done = 0; state = { ...start };
      flushSync(() => root.render(React.createElement(Probe, { key: id, id, sequence, loop })));
      if (sequence[0]?.type !== 'OBSERVE_OBJECT') handle.setPosition(state.x,state.y,state.z);
      return handle;
    };
    const tick = (id, dt = 0.1) => {
      const before = state;
      state = { ...handle.update(dt) };
      camera.positions[id] = { ...state, yaw: state.rotY };
      if (window.geom.distance(before,state) > 0) {
        const graph = nav.getNavigationGraph(profile,interactionOwner);
        check(window.geom.segmentFree(before,state,graph.obstacles), `Static obstacle crossed by ${id}`);
        for (const key of nav.doorKeys) {
          const leaf = [[window.geom.inflate(nav.doorPolygon(key,nav.doorCollisionState[key].angle),profile.radius+nav.DOOR_CONFIGS[key].margin)]];
          check(window.geom.segmentFree(before,state,leaf), `Actual ${key} door crossed`);
        }
      }
      return handle.getStatus();
    };
    async function run(id, timeout = 60000) {
      const deadline = performance.now() + timeout;
      while (performance.now() < deadline) {
        const status = tick(id);
        if (status === 'FINISHED') return;
        if (status === 'BLOCKED') throw new Error(`${id} blocked: ${JSON.stringify(nav.navigationDebug.get(id))}`);
        // Give rendered doors their real animation frames when a request is pending.
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
      throw new Error(`${id} timed out: ${JSON.stringify({ state, status: handle.getStatus(), route: nav.navigationDebug.get(id) })}`);
    }
    try {
      // Real furniture, occupied slot, duo point, zero-slot object, and return.
      check(claim.call(occupancy,'bed-west','seat-middle','bed-user'), 'Occupancy fixture');
      const object = getSmartObject('bed-west');
      const bedSlot = object.slots.find(s => s.slotId === 'seat-middle');
      nav.setAgentProfile('bed-user',profile);
      camera.positions['bed-user'] = { x:bedSlot.offset[0],y:0,z:bedSlot.offset[2],yaw:0 };
      const sequence = ['bed-west','desk-bollsidan-1','hugs-point'].map(smartObjectId => ({type:'OBSERVE_OBJECT',smartObjectId,duration:2}));
      sequence.push({ type:'RETURN_TO_START' });
      mount('tour-check',sequence);
      const initial = { ...handle.initialPos };
      check(initial.x === origin.x && initial.z === origin.z, 'Tour starts at real position');
      await run('tour-check');
      check(window.geom.distance(state,origin) < 1e-6 && done === 1, 'One completion and exact return');
      for (let i=0;i<20;i++) tick('tour-check');
      check(done === 1 && handle.getStatus() === 'FINISHED', 'Guided tour does not loop');
      check(claims === 0 && duos === 0, 'Observation never reserves or joins duo');
      check(occupancy.getOccupant('bed-west','seat-middle') === 'bed-user', 'Existing user remains seated');
      document.dispatchEvent(new CustomEvent('agent-force-smartobject',{detail:{targetId:'tour-check',objectId:privateId,slotId:'visit'}}));
      check(!handle.hasPendingDynamicTask(), 'Direct private rest order refused');
      document.dispatchEvent(new CustomEvent('npc-invite-duo',{detail:{targetId:'tour-check',fromId:'HoverMenu',objectId:privateId,slotId:'watchdog'}}));
      check(!handle.hasPendingDynamicTask(), 'Private duo invitation refused');
      occupancy.releaseAllForCharacter('bed-user'); delete camera.positions['bed-user']; delete camera.positions['tour-check'];

      // Re-render while mounted: preserve real position, then resume autonomous work.
      const resume = [{type:'WAIT',duration:0.2,animation:'idle'}];
      flushSync(() => root.render(React.createElement(Probe,{key:'tour-check',id:'tour-check',sequence:resume,loop:true})));
      check(window.geom.distance(handle.update(0),origin) < 1e-6, 'Resume without teleport');
      for (let i=0;i<20;i++) tick('tour-check');
      check(handle.getStatus() !== 'FINISHED', 'Autonomous activities resume looping');
      delete camera.positions['tour-check'];

      // Observe a moved public marker and report inaccessible destinations explicitly.
      SMART_OBJECTS['observation-fixture'] = {id:'observation-fixture',name:'Observation fixture',category:'decor',position:[160,0,310],slots:[]};
      mount('moved-check',[{type:'OBSERVE_OBJECT',smartObjectId:'observation-fixture',duration:2}]);
      tick('moved-check');
      SMART_OBJECTS['observation-fixture'].position = [160,0,330];
      nav.registerObstacle({id:'revision-fixture',owner:'revision-fixture',polygon:window.geom.rectangle(-400,-600,10,10),yMin:0,yMax:200});
      await run('moved-check');
      check(window.geom.distance(state,{x:160,z:330}) < 1e-6, 'Observation follows moved target');
      delete camera.positions['moved-check'];
      // Cover the walkable floor: no free approach or furniture exit can exist.
      const { walkableSurfaces } = await import('/src/features/scene/ai/navigation/architecture.ts');
      const floorPoints = walkableSurfaces.flat(2);
      const xs = floorPoints.map(p => p.x), zs = floorPoints.map(p => p.z);
      const xMin = Math.min(...xs), xMax = Math.max(...xs), zMin = Math.min(...zs), zMax = Math.max(...zs);
      nav.registerObstacle({id:'blocked-fixture',owner:'blocked-fixture',polygon:window.geom.rectangle((xMin+xMax)/2,(zMin+zMax)/2,xMax-xMin,zMax-zMin),yMin:0,yMax:profile.height});
      SMART_OBJECTS['observation-fixture'].position = [160,0,-100];
      mount('blocked-check',[{type:'OBSERVE_OBJECT',smartObjectId:'observation-fixture',duration:2}]);
      tick('blocked-check');
      check(handle.getStatus() === 'BLOCKED', 'Inaccessible observation is explicitly blocked');
      delete SMART_OBJECTS['observation-fixture']; nav.unregisterObstacle('revision-fixture'); nav.unregisterObstacle('blocked-fixture'); delete camera.positions['blocked-check'];

      if (!window.scenariosSeatedOnly) {
        mount('full-tour-check',scenarios.buildGuidedTour(origin));
        await run('full-tour-check',120000);
        check(done === 1 && window.geom.distance(state,origin) < 1e-6, 'Full public tour completes and returns home');
        check(duos === 0, 'Full tour never joins a duo');
        delete camera.positions['full-tour-check'];
      }

      const chair = window.resolveCoords({type:'USE_OBJECT',smartObjectId:'chair-office',slotId:'sit'},null);
      const seated = {x:chair.tx,y:chair.ty ?? 0,z:chair.tz,rotY:chair.rotY ?? 0};
      interactionOwner = 'chair-office';
      mount('seated-check',[{type:'OBSERVE_OBJECT',smartObjectId:'mirror-south',duration:2},{type:'RETURN_TO_START'}],false,seated);
      check(window.geom.distance(handle.initialPos,seated) < 1e-6, 'Seated start preserved');
      await run('seated-check');
      check(done === 1 && window.geom.distance(state,seated) < 1e-6, 'Exit furniture and return to original seat');
      interactionOwner = undefined; delete camera.positions['seated-check'];
      if (window.scenariosSeatedOnly) return {seated:true};

      // Two genuine rounds, including full 90-second rests. Only waiting time is accelerated.
      const concierge = scenarios.buildConciergeTour();
      mount('xbot',concierge,true);
      const deadline = performance.now()+120000;
      let rests = 0, waiting = false, restSeconds = 0;
      while (performance.now() < deadline && rests < 2) {
        const atRest = occupancy.getOccupant(privateId,'visit') === 'xbot' && handle.getStatus() === 'INTERACTING';
        if (atRest && !waiting) { waiting = true; restSeconds = 0; }
        if (waiting && !atRest) {
          check(restSeconds >= 90, 'Full 90 seconds elapsed at rest'); rests++; waiting = false;
        }
        const dt = atRest ? 1 : 0.1;
        if (atRest) {
          restSeconds += dt;
          check(!occupancy.claimSlot(privateId,'watchdog','native'), 'Private rest blocked while occupied');
        } else check(!occupancy.canUseObject(privateId,'native'), 'Private rest blocked during round');
        const status = tick('xbot',dt);
        if (status === 'BLOCKED') throw new Error(`Concierge blocked: ${JSON.stringify(nav.navigationDebug.get('xbot'))}`);
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }
      check(rests === 2, `Two complete concierge rounds required, got ${rests}`);
      return {publicObjects:expected.length,observationClaims:0,observationDuos:0,rounds:rests,restSeconds:90};
    } finally {
      flushSync(()=>root.unmount()); host.remove();
      occupancy.claimSlot = claim; window.duoManager.startDuoSession = duo;
      occupancy.releaseAllForCharacter('bed-user');
    }
  });
  console.log('Scenario checks passed:',JSON.stringify(result));
};
