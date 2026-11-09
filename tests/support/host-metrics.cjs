const fs = require('node:fs/promises');
const os = require('node:os');
exports.powerMode = power => power.some(supply => supply.online) ? 'ac' : power.length ? 'battery' : 'unknown';
exports.hostMetrics = async () => {
    const memory = await fs.readFile('/proc/meminfo', 'utf8');
    const bytes = key => Number(new RegExp(`^${key}:\\s+(\\d+) kB`, 'm').exec(memory)[1]) * 1024;
    const supplies = await fs.readdir('/sys/class/power_supply');
    const power = [];
    for (const name of supplies) {
        const directory = `/sys/class/power_supply/${name}`;
        const type = (await fs.readFile(`${directory}/type`, 'utf8')).trim();
        if (['Mains', 'USB', 'USB_C', 'USB_PD', 'USB_PD_DRP', 'Wireless'].includes(type)) {
            const online = (await fs.readFile(`${directory}/online`, 'utf8')).trim();
            if (!['0', '1'].includes(online)) throw Error(`Invalid power supply online value: ${name}: ${online}`);
            power.push({ name, online: online === '1' });
        }
    }
    const temperatures = [];
    for (const name of await fs.readdir('/sys/class/thermal')) {
        if (!name.startsWith('thermal_zone')) continue;
        const directory = `/sys/class/thermal/${name}`;
        temperatures.push({ name, type: (await fs.readFile(`${directory}/type`, 'utf8')).trim(), milliCelsius: Number(await fs.readFile(`${directory}/temp`, 'utf8')) });
    }
    return { availableBytes: bytes('MemAvailable'), swapUsedBytes: bytes('SwapTotal') - bytes('SwapFree'), loadAverage: os.loadavg(), power, powerMode: exports.powerMode(power), temperatures,
        temperatureStatus: temperatures.length ? 'observed' : 'unavailable',
        powerStatus: power.length ? 'observed' : 'unavailable' };
};
