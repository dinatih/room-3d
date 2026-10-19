const fs = require('node:fs');
const path = require('node:path');
const jsonBlock = data => `\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
exports.writeReport = (directory, report) => {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2));
    const rows = report.results.map(r => `| ${r.id} | ${r.status} | ${Math.round(r.durationMs ?? 0)} | ${(r.error ?? '').split('\n')[0].replaceAll('|', '\\|')} |`);
    const details = report.results.map(r => {
        let text = `### ${r.id}\n\nReproduction : \`${r.reproduction ?? ''}\`\n`;
        if (r.loaded)
            text += `\nNavigateur : ${r.browser}\n\nGPU : ${r.loaded.renderer}\n`;
        if (r.error)
            text += `\n${r.error}\n`;
        if (r.measurements?.session) {
            const compact = Object.fromEntries(['startup', 'stable', 'session'].map(phase => {
                const m = r.measurements[phase];
                return [phase, { durationMs: m.durationMs, frameMs: m.frameMs, longTasks: Array.isArray(m.longTasks) ? { count: m.longTasks.length, maxMs: Math.max(0, ...m.longTasks.map(t => t.duration)) } : { count: m.longTasks.count, totalMs: m.longTasks.totalMs }, pathfinding: m.pathfinding,
                        memorySummary: m.memorySummary, memoryAtEnd: m.memory?.at(-1) }];
            }));
            text += jsonBlock(compact);
        }
        else if (r.measurements)
            text += jsonBlock(r.measurements);
        return text;
    });
    fs.writeFileSync(path.join(directory, 'report.md'), `# Tests ${report.suite}\n\nCommit : ${report.commit}\n\n| Cas | Résultat | Durée (ms) | Erreur |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n${report.aggregates ? '## Médianes, dispersion et écarts\n' + jsonBlock({ aggregates: report.aggregates, comparison: report.comparison }) : ''}\n\n${details.join('\n\n')}\n\n${report.error ?? ''}\n`);
};
