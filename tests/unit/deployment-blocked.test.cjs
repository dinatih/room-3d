const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('attend le départ du PNJ bloquant puis termine le déploiement avant de choisir une autre action', () => {
  const { harness } = load('src/features/scene/ai/agentController.ts', {}, source => {
    const begin = source.indexOf('    const landingThisFrame =');
    const end = source.indexOf('    // Finish an explicitly configured transition', begin);
    const update = source.indexOf('  const updateCurrent =');
    const updateEnd = source.indexOf('  const setPosition =', update);
    assert(begin > 0 && end > begin && update > end && updateEnd > update);
    return `export function harness() {
      class NavigationBlockedError extends Error { actorBlockers = new Map(); }
      const state = { x:500, y:20, z:100, animation:'falling' }, route = {};
      const scenario = [{ type:'MOVE_TO', smartObjectId:'est-neighbor-flat' }], dynamicNavQueue = [];
      const dynamicNavIndex = 0, stepIndex = 0, _characterId = 'lewis', enabled = true, loop = true;
      const deployment = { hasCompleted:false, hasLoggedFalling:true };
      let agentStatus = 'FALLING', timer = .1, delayTimer = 0, spawnObstacleRevision = -1, initialProfileResolved = true;
      let cachedCoords = null, blockedCoords = null, manualOverride = false, interruptedSmartObjectId;
      let startPos = { x:500,y:0,z:100 }, revision = 1, occupied = true, checks, resolutions = 0, retries = 0;
      const cameraState = { isSceneLaunched:true }, hasSkyDrop = true, landingPhaseDuration = .2, landingAnimId = 'landing';
      const graph = {}, getNavigationGraph = () => graph, getAgentProfile = () => ({}), hasAgentProfile = () => true;
      const getObstacleRevision = () => revision;
      const beginActorBlockCheck = () => { checks = new Map(); };
      const endActorBlockCheck = () => { const result = checks ?? new Map(); checks = undefined; return result; };
      const actorBlocksUnchanged = blockers => [...blockers.values()].every(value => value === occupied);
      const resolveInstructionCoords = () => {
        resolutions++;
        if (occupied) { checks.set('native', occupied); throw new NavigationBlockedError('No approach for est-neighbor-flat'); }
        return { tx:500,ty:0,tz:100 };
      };
      const getInteractionOwner = owner => owner, releaseAgentDoors = () => {}, reportNavigationStop = () => {}, appLog = () => {};
      const SMART_OBJECTS = {}, NAVIGATION_WAIT_ANIMATION = 'idle';
      const retrySmartAction = () => { retries++; agentStatus = 'IDLE'; timer = 0; };
      const advance = dt => { ${source.slice(begin, end)} return state; };
      ${source.slice(update, updateEnd)}
      return { update:updateCurrent, state, deployment, status:()=>agentStatus, resolutions:()=>resolutions, retries:()=>retries,
        release() { occupied = false; }, revise() { revision++; } };
    }`;
  });
  const agent = harness();
  agent.update(.1);
  assert.equal(agent.status(), 'FALLING');
  assert.equal(agent.deployment.hasCompleted, false);
  assert.equal(agent.retries(), 0);
  for (let frame = 0; frame < 10; frame++) agent.update(.1);
  assert.equal(agent.resolutions(), 1, 'An unchanged blocking actor must not restart the landing query');
  agent.release();
  agent.update(.1);
  assert.equal(agent.status(), 'LANDING');
  assert.equal(agent.state.y, 0);
  agent.update(.2);
  assert.equal(agent.deployment.hasCompleted, true);
  assert.equal(agent.status(), 'IDLE');
  assert.equal(agent.retries(), 0);
  const resolved = agent.resolutions();
  agent.revise();
  agent.update(.1);
  assert.equal(agent.resolutions(), resolved, 'Later geometry changes must not resolve the original spawn again');
});
