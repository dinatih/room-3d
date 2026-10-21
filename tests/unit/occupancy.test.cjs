const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

function fixture() {
    const ids = Array.from({ length: 10 }, (_, i) => `npc-${i}`);
    const slots = Array.from({ length: 12 }, (_, i) => ({ slotId: `seat-${i}`, offset: [100, 0, 100] }));
    const objects = { living: { id: 'living', position: [100, 0, 100], slots }, outside: { id: 'outside', position: [100, 0, -100], slots: [{ slotId: 'use', offset: [100, 0, -100] }] } };
    for (const id of ['toilet', 'vasque-sdb', 'sdb-closet', 'shower']) objects[id] = { id, position: [100, 0, 550], slots: [{ slotId: 'use', offset: [100, 0, 550] }] };
    const camera = { positions: {} }, store = { activeCharacterId: 'player' };
    const module = load('src/features/scene/ai/occupancyManager.ts', {
        './smartObjectRegistry': { SMART_OBJECTS: objects, getSmartObject: id => objects[id] },
        '../cameraState': { cameraState: camera }, '../characterConfig': { CHARACTERS: [...ids, 'player'].map(id => ({ id })) },
        '../store/useSceneStore': { useSceneStore: { getState: () => store } },
        '../wallData': { BATH_WEST_WALL: -10, BATH_EAST_WALL: 195, BATH_NORTH_WALL: 465, ROOM_NORTH_WALL: 0, ROOM_SOUTH_WALL: 400, ROOM_EAST_WALL: 316, WALL_H: 250 },
    });
    return { ids, camera, store, ...module, manager: module.OccupancyManager };
}

describe('Capacité des pièces', () => {
    it('réserve huit places au séjour et refuse une neuvième arrivée', () => {
        const { ids, manager, LIVING_ROOM_NPC_CAPACITY } = fixture();
        assert.equal(LIVING_ROOM_NPC_CAPACITY, 8);
        for (let i = 0; i < 8; i++) assert(manager.claimSlot('living', `seat-${i}`, ids[i]));
        assert.equal(manager.getLivingRoomOccupants().size, 8);
        assert.equal(manager.claimSlot('living', 'seat-8', ids[8]), false);
        assert.equal(manager.getAvailableSlot('living', ids[8]), null);
        assert.equal(manager.isObjectFullyOccupied('living', ids[8]), true);
        assert(manager.getOccupant('living', 'seat-8', ids[8]));
        assert(manager.claimSlot('outside', 'use', ids[8]), 'A full living room must not prevent outdoor activities');
        manager.releaseAllForCharacter(ids[0]);
        assert(manager.claimSlot('living', 'seat-8', ids[8]), 'A released reservation must admit the next NPC');
    });

    it('compte les présences réelles et ne libère la place qu’après le départ', () => {
        const { ids, camera, manager } = fixture();
        for (let i = 0; i < 8; i++) camera.positions[ids[i]] = { x: 100, y: 0, z: 100 };
        assert.equal(manager.hasLivingRoomCapacity(ids[8]), false);
        assert(manager.claimSlot('living', 'seat-0', ids[0]), 'An occupant can change activity within the same room');
        assert.equal(manager.getLivingRoomOccupants().size, 8, 'Presence and reservation must not double-count an NPC');
        manager.releaseAllForCharacter(ids[0]);
        assert.equal(manager.hasLivingRoomCapacity(ids[8]), false, 'Releasing an activity does not teleport its occupant outside');
        camera.positions[ids[0]].z = -100;
        assert(manager.hasLivingRoomCapacity(ids[8]));
    });

    it('exclut le joueur et les animaux du plafond des PNJ', () => {
        const { ids, camera, manager } = fixture();
        camera.positions.player = camera.positions.robin = { x: 100, y: 0, z: 100 };
        for (let i = 0; i < 8; i++) assert(manager.claimSlot('living', `seat-${i}`, ids[i]));
        assert(manager.claimSlot('living', 'seat-8', 'player'));
        assert(manager.hasLivingRoomCapacity('robin'), 'Animals do not consume NPC places');
        assert.equal(manager.getLivingRoomOccupants().size, 8);
        assert.equal(manager.hasLivingRoomCapacity(ids[8]), false);
    });

    it('réserve la capacité des deux partenaires avant de lancer un duo', () => {
        const { ids, manager } = fixture();
        for (let i = 0; i < 7; i++) assert(manager.claimSlot('living', `seat-${i}`, ids[i]));
        assert.equal(manager.hasLivingRoomCapacity(ids[7], ids[8]), false);
        assert(manager.hasLivingRoomCapacity(ids[0], ids[7]), 'An existing occupant only needs one additional place for their partner');
        assert(manager.hasLivingRoomCapacity('player', ids[7]));
    });

    it('inclut la cuisine et exclut le couloir, les voisins, le jardin et les chutes en hauteur', () => {
        const { isInLivingRoom } = fixture();
        assert(isInLivingRoom({ x: 100, z: 100 }));
        assert(isInLivingRoom({ x: 100, z: 430 }));
        for (const point of [{ x: 250, z: 430 }, { x: -100, z: 200 }, { x: 100, z: -100 }, { x: 100, z: 550 }, { x: 100, y: 2500, z: 100 }]) assert.equal(isInLivingRoom(point), false);
    });

    it('conserve la limite existante de trois personnages dans la salle de bains', () => {
        const { ids, manager, BATHROOM_CAPACITY } = fixture();
        assert.equal(BATHROOM_CAPACITY, 3);
        for (const [i, objectId] of ['toilet', 'vasque-sdb', 'sdb-closet'].entries()) assert(manager.claimSlot(objectId, 'use', ids[i]));
        assert.equal(manager.claimSlot('shower', 'use', ids[3]), false);
        manager.releaseAllForCharacter(ids[0]);
        assert(manager.claimSlot('shower', 'use', ids[3]));
    });
});
