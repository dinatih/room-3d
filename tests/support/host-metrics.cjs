const fs = require('node:fs/promises');
const os = require('node:os');
exports.hostMetrics = async () => {
    const memory = await fs.readFile('/proc/meminfo', 'utf8');
    const bytes = key => Number(new RegExp(`^${key}:\\s+(\\d+) kB`, 'm').exec(memory)[1]) * 1024;
    const supplies = await fs.readdir('/sys/class/power_supply');
    const power = [];
    for (const name of supplies) {
        const directory = `/sys/class/power_supply/${name}`;
        const type = (await fs.readFile(`${directory}/type`, 'utf8')).trim();
        if (type === 'Mains') power.push({ name, online: (await fs.readFile(`${directory}/online`, 'utf8')).trim() === '1' });
    }
    const temperatures = [];
    for (const name of await fs.readdir('/sys/class/thermal')) {
        if (!name.startsWith('thermal_zone')) continue;
        const directory = `/sys/class/thermal/${name}`;
        temperatures.push({ name, type: (await fs.readFile(`${directory}/type`, 'utf8')).trim(), milliCelsius: Number(await fs.readFile(`${directory}/temp`, 'utf8')) });
    }
    return { availableBytes: bytes('MemAvailable'), swapUsedBytes: bytes('SwapTotal') - bytes('SwapFree'), loadAverage: os.loadavg(), power, temperatures,
        temperatureStatus: temperatures.length ? 'observed' : 'unavailable',
        powerStatus: power.length ? 'observed' : 'unavailable' };
};
