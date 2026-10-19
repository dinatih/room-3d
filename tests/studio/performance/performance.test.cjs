const { describe, it } = require('node:test');
const { performance: fixtures } = require('../../fixtures/cases.cjs');
const { withBrowser } = require('../../support/browser.cjs');
const { measure } = require('../../support/performance.cjs');
const options = JSON.parse(process.env.ROOM_TEST_OPTIONS);
describe('Performances — trois passages isolés par configuration', () => {
    for (const id of options.cases) {
        for (const pass of [1, 2, 3]) {
            const fixture = { ...fixtures[id], configurationId: id, id: `${id}-run-${pass}`, pass };
            it(`${fixture.behavior}, passage ${pass}`, { timeout: fixture.readinessTimeoutMs + fixture.timeoutMs + 30000 }, async () => {
                await withBrowser(fixture, (page, result, system) => measure(page, result, system, fixture));
            });
        }
    }
});
