// Observe instruction changes only in the dedicated Vite test server. Application
// sources and production builds remain untouched; the controller still runs as-is.
exports.instrumentController = source => {
    const marker = '    const blocked = blockedCoordsRef.current;';
    if (source.split(marker).length !== 2)
        throw Error('Controller instruction observation point changed');
    return source.replace(marker, '    window.__testRecordInstruction(_characterId, instruction);\n' + marker);
};
