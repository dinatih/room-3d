// Visible browsers require an explicit user request, passed as --headed.
module.exports = function launchBrowser(options = {}) {
  return require('puppeteer').launch({
    ...options,
    headless: !process.argv.includes('--headed'),
    args: [...(options.args || []), '--codex-browser-test=room-3d'],
    dumpio: true,
  });
};
