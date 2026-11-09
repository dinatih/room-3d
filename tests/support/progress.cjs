exports.PROGRESS_INTERVAL_MS = 5000;
exports.createProgress = (id, enabled = process.env.ROOM_TEST_SUITE === 'perf', write = message => process.stdout.write(message), now = () => Date.now()) => {
    return message => {
        if (enabled) write(`[perf ${id} ${new Date(now()).toISOString().slice(11, 19)} UTC] ${message}\n`);
    };
};
