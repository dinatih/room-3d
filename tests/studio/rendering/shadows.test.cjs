const { describe, it } = require('node:test');
const rendering = require('../../fixtures/rendering.cjs');
const { withBrowser } = require('../../support/browser.cjs');
const options = JSON.parse(process.env.ROOM_TEST_OPTIONS);
describe('Ombres dans la scène animée', () => {
    for (const fixture of rendering.filter(c => options.cases.includes(c.id))) {
        it(fixture.behavior, { timeout: fixture.readinessTimeoutMs + fixture.timeoutMs + 30000 }, async () => {
            await withBrowser(fixture, async (page, result) => {
                result.measurements = await page.evaluate(async fixture => {
                    const { compareShadows } = await import('/tests/support/shadows.mjs');
                    return compareShadows(fixture);
                }, fixture);
            });
        });
    }
});
