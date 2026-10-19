module.exports = [{
    ...require('./cases.cjs').performance['7-mid'],
    id: 'shadow-receivers', behavior: 'préserve les ombres et compare le coût des scans sur les personnages animés',
    activity: 'shadows', framesPerMode: 90, timeoutMs: 120000,
}];
