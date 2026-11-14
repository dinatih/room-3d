// Visible browsers require an explicit user request, passed as --headed.
const fs = require('node:fs');

const HARDWARE_GPU_ARGS = [
  '--enable-gpu',
  '--use-angle=vulkan',
  '--enable-features=Vulkan,VulkanFromANGLE',
  '--render-node-override=/dev/dri/renderD128',
  '--disable-vulkan-surface',
];

module.exports = function launchBrowser(options = {}) {
  const useHardwareGpu = process.argv.includes('--hardware-gpu') && fs.existsSync('/dev/dri/renderD128');
  const baseArgs = (options.args || []).filter(
    arg => !useHardwareGpu || (arg !== '--use-angle=swiftshader' && arg !== '--enable-unsafe-swiftshader')
  );
  return require('puppeteer').launch({
    ...options,
    headless: !process.argv.includes('--headed'),
    args: [...baseArgs, ...(useHardwareGpu ? HARDWARE_GPU_ARGS : []), '--codex-browser-test=room-3d'],
    dumpio: true,
  });
};
