const { describe, it } = require('node:test');
const { navigation } = require('../../fixtures/cases.cjs');
const { withBrowser } = require('../../support/browser.cjs');
const { assertArrival } = require('../../support/statistics.cjs');
const options = JSON.parse(process.env.ROOM_TEST_OPTIONS);
describe('Navigation dans l’appartement chargé', () => {
    for (const fixture of navigation.filter(c => options.cases.includes(c.id))) {
        it(fixture.behavior, { timeout: fixture.readinessTimeoutMs + fixture.timeoutMs + 30000 }, async () => {
            await withBrowser(fixture, async (page, result) => {
                result.measurements = await page.evaluate(async (fixture) => {
                    const scenarios = ['life', 'meal', 'sleep', 'hygiene', 'routine', 'roommates'].includes(fixture.activity) ? await import('/tests/support/lara-life.mjs') : await import('/tests/support/apartment.mjs');
                    return scenarios[({ 'closed-door': 'closedDoor' })[fixture.activity] ?? fixture.activity](fixture);
                }, fixture);
                if (result.measurements.actors)
                    assertArrival(result.measurements.actors, fixture.maxTurnRadians ?? Infinity);
            });
        });
    }
});
