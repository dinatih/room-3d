const { describe, it } = require('node:test');
const { interactions } = require('../../fixtures/cases.cjs');
const { withBrowser } = require('../../support/browser.cjs');
const options = JSON.parse(process.env.ROOM_TEST_OPTIONS);
describe('Interactions et transitions réelles', () => {
    for (const fixture of interactions.filter(c => options.cases.includes(c.id))) {
        it(fixture.behavior, { timeout: fixture.readinessTimeoutMs + fixture.timeoutMs + 30000 }, async () => {
            await withBrowser(fixture, async (page, result) => {
                result.measurements = await page.evaluate(async (fixture) => { const scenarios = await import('/tests/support/interactions.mjs'); return fixture.activity === 'failed-action' ? scenarios.failedAction(fixture) : fixture.activity === 'kitchen-access' ? scenarios.kitchenAccess(fixture) : scenarios.exercise(fixture); }, fixture);
            });
        });
    }
});
