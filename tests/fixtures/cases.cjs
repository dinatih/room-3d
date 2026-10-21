const apartment = {
    seed: 20261019, count: 0, preset: 'low', camera: 'top',
    viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
    collisions: true, cache: { browser: 'cold-new-profile', vite: 'cold-temporary-isolated', os: 'uncontrolled-shared' }, readinessTimeoutMs: 180000,
    heartbeatTimeoutMs: 30000, travelCmPerFrame: 3, dt: 1 / 30, turnSpeed: Math.PI,
    startZone: 'garden', arrivalOffsets: [{ x: 50, z: 0 }, { x: -50, z: 0 }, { x: 0, z: 50 }, { x: 0, z: -50 }],
    doorDistances: { before: 60, after: 100 },
    interaction: { objectId: 'sofa-garden-east', slotId: 'seat-1', exit: { x: 180, y: 0, z: -80 }, initialWaitSeconds: .1, useSeconds: .3, delayedPlaybackFrames: 100 },
    profile: { radius: 13.3, height: 170 },
};
exports.navigation = [
    { id: 'occupied-target', behavior: 'atteint une destination occupée avec une empreinte PNJ à zéro', activity: 'arrival', actors: 1, occupied: true, maxTurnRadians: Math.PI, timeoutMs: 30000 },
    { id: 'garden-fifteen', behavior: 'termine quinze trajets simultanés dans le jardin sans rotation en boucle', activity: 'arrival', actors: 15, occupied: true, maxTurnRadians: Math.PI, timeoutMs: 30000 },
    { id: 'locomotion-twenty-seven', behavior: 'poursuit les trajets libres de 27 contrôleurs pendant un recalcul distant et initialise leurs interactions', activity: 'locomotion', actors: 27, timeoutMs: 60000 },
    { id: 'open-crossing', behavior: 'croise un autre trajet en espace libre', activity: 'arrival', actors: 2, crossing: true, maxTurnRadians: Math.PI, timeoutMs: 30000 },
    { id: 'living-kallax', behavior: 'traverse la porte du séjour pendant une interaction Kallax', activity: 'door', objectId: 'drona-se-linen', timeoutMs: 60000 },
    { id: 'living-kallax-hidden', behavior: 'continue la navigation et ouvre la porte du séjour avec tout le décor masqué', activity: 'door', objectId: 'drona-se-linen', query: { debug: 'characters-only' }, timeoutMs: 60000 },
    { id: 'double-kallax', behavior: 'traverse la double porte pendant une interaction Kallax', activity: 'door', objectId: 'drona-ne-catchall', timeoutMs: 60000 },
    { id: 'closed-door', behavior: 'explique l’attente devant un battant infranchissable puis reprend', activity: 'closed-door', timeoutMs: 30000 },
    { id: 'unreachable', behavior: 'signale une destination inaccessible sans recalcul permanent', activity: 'unreachable', timeoutMs: 30000 },
    { id: 'approach-reachability', behavior: 'préserve l’accessibilité des approches et mesure leur coût sur la géométrie réelle', activity: 'reachability',
        objects: ['drona-se-linen', 'drona-ne-catchall', 'sofa-garden-east'], timeoutMs: 60000 },
].map(c => ({ ...apartment, ...c }));
exports.interactions = [
    { id: 'posture-exit', behavior: 'approche, agit, termine son relèvement réel et sort complètement', activity: 'posture', timeoutMs: 60000 },
    { id: 'failed-action', behavior: 'libère les réservations d’une action devenue inaccessible', activity: 'failed-action', objectId: 'sofa-garden-east', timeoutMs: 60000 },
    { id: 'interruption', behavior: 'libère ses réservations après interruption et échec', activity: 'interruption', timeoutMs: 60000 },
].map(c => ({ ...apartment, ...c }));
exports.performance = Object.fromEntries([0, 7, 15].flatMap(count => ['low', 'mid'].map(preset => {
    const id = `${count}-${preset}`;
    return [id, { ...apartment, id, count, preset, camera: 'orbit', activity: 'seeded-autonomous',
            behavior: `mesure ${count} personnages en ${preset}`, timeoutMs: 480000,
            stableMs: 15000, sessionMs: 300000 }];
})));
