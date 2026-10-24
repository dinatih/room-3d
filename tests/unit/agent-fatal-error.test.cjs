const { it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

it('signale une erreur fatale une seule fois et laisse les frames suivantes continuer', () => {
  const { harness } = load('src/features/scene/ai/agentController.ts', {}, source => {
    const begin = source.indexOf('  let failed = false;');
    const end = source.indexOf('  const hasPendingDynamicTask =', begin);
    assert(begin > 0 && end > begin);
    return `export function harness(error) {
      const state = { x: 0, z: 0 }, dynamicNavQueue = [], scenario = null;
      const dynamicNavIndex = 0, stepIndex = 0, _characterId = 'test';
      let agentStatus = 'MOVING', calls = 0, releases = 0;
      const logs = [];
      class NavigationPending {}
      const navigationScope = { run: callback => callback() };
      const updateCurrent = () => { calls++; throw error; };
      const releaseAgentDoors = () => { releases++; };
      const appLog = (...args) => logs.push(args);
      const NAVIGATION_WAIT_ANIMATION = 'idle';
      ${source.slice(begin, end)}
      return { update, state, logs, calls: () => calls, releases: () => releases };
    }`;
  });
  const error = Object.assign(new Error('Navigation funnel produced a segment outside free space'), { cause: { path: [] } });
  const agent = harness(error);
  assert.throws(() => agent.update(1 / 60), caught => caught === error);
  for (let frame = 0; frame < 120; frame++) assert.equal(agent.update(1 / 60), agent.state);
  assert.equal(agent.calls(), 1);
  assert.equal(agent.releases(), 1);
  assert.equal(agent.logs.length, 1);
  assert.equal(agent.logs[0][2].action, 'nav_fatal');
  assert.equal(agent.state.animationPaused, true);
});
