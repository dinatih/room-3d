const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('../support/load-ts.cjs');

function fixture() {
    const ids = Array.from({ length: 10 }, (_, i) => `npc-${i}`);
    const slots = Array.from({ length: 12 }, (_, i) => ({ slotId: `seat-${i}`, offset: [100, 0, 100] }));
    const objects = { living: { id: 'living', position: [100, 0, 100], slots }, outside: { id: 'outside', position: [100, 0, -100], slots: [{ slotId: 'use', offset: [100, 0, -100] }] } };
    objects.corridor = { id: 'corridor', position: [250, 0, 550], slots: slots.map(slot => ({ ...slot, offset: [250, 0, 550] })) };
    for (const id of ['toilet', 'vasque-sdb', 'sdb-closet', 'shower', 'storage-box']) objects[id] = { id, position: [100, 0, 550], slots: [{ slotId: 'use', offset: [100, 0, 550], approachOffset: [250, 0, 550] }] };
    const camera = { positions: {} }, store = { activeCharacterId: 'player' };
    const module = load('src/features/scene/ai/occupancyManager.ts', {
        './smartObjectRegistry': { SMART_OBJECTS: objects, getSmartObject: id => objects[id] },
        '../cameraState': { cameraState: camera }, '../characterConfig': { CHARACTERS: [...ids, 'player', 'ybot'].map(id => ({ id })) },
        '../store/useSceneStore': { useSceneStore: { getState: () => store } },
        '../wallData': { BATH_WEST_WALL: -10, BATH_EAST_WALL: 195, BATH_NORTH_WALL: 465, ROOM_NORTH_WALL: 0, ROOM_SOUTH_WALL: 400, ROOM_EAST_WALL: 316, CORRIDOR_WEST_WALL: 200, CORRIDOR_EAST_WALL: 316, CORRIDOR_NORTH_WALL: 410, WALL_H: 250, DiagWall: { A: { x: 0, z: 700 }, slope: -0.2 } },
    });
    return { ids, camera, store, ...module, manager: module.OccupancyManager };
}

describe('Capacité des pièces', () => {
    it('limite le couloir à deux présences ou arrivées, joueur et Ybot inclus', () => {
        const { ids, camera, manager, ROOM_CAPACITIES } = fixture();
        assert.equal(ROOM_CAPACITIES.corridor, 2);
        camera.positions.player = camera.positions.robin = { x: 250, y: 0, z: 550 };
        assert(manager.claimSlot('corridor', 'seat-0', 'ybot'));
        assert.equal(manager.hasRoomCapacity('corridor', ids[0]), false);
        assert.equal(manager.getAvailableSlot('corridor', ids[0]), null);
        assert.equal(manager.isObjectFullyOccupied('corridor', ids[0]), true);
        assert.equal(manager.claimSlot('corridor', 'seat-1', ids[0]), false);
        camera.positions.ybot = { x: 250, y: 0, z: 550 };
        assert.equal(manager.getRoomOccupants('corridor').size, 2, 'An arrival and its reservation count once; animals are excluded');
        manager.releaseAllForCharacter('ybot');
        assert.equal(manager.hasRoomCapacity('corridor', ids[0]), false, 'The place remains occupied until departure');
        camera.positions.ybot.z = 350;
        assert.equal(manager.hasRoomCapacity('corridor', ids[0], ids[1]), false, 'A duo needs two available places');
        assert(manager.claimSlot('corridor', 'seat-1', ids[0]));
    });

    it('délimite le couloir intérieur sans compter séjour, salle de bains ni passage extérieur', () => {
        const { isInRoom } = fixture();
        for (const point of [{ x: 250, z: 430 }, { x: 250, z: 550 }]) assert(isInRoom('corridor', point));
        for (const point of [{ x: 250, z: 350 }, { x: 100, z: 550 }, { x: 330, z: 550 }, { x: 250, z: 660 }, { x: 250, y: 2500, z: 550 }]) assert.equal(isInRoom('corridor', point), false);
    });

    it('réserve huit places au séjour et refuse une neuvième arrivée', () => {
        const { ids, manager, ROOM_CAPACITIES } = fixture();
        assert.equal(ROOM_CAPACITIES.living, 8);
        for (let i = 0; i < 8; i++) assert(manager.claimSlot('living', `seat-${i}`, ids[i]));
        assert.equal(manager.getRoomOccupants('living').size, 8);
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
        assert.equal(manager.hasRoomCapacity('living', ids[8]), false);
        assert(manager.claimSlot('living', 'seat-0', ids[0]), 'An occupant can change activity within the same room');
        assert.equal(manager.getRoomOccupants('living').size, 8, 'Presence and reservation must not double-count an NPC');
        manager.releaseAllForCharacter(ids[0]);
        assert.equal(manager.hasRoomCapacity('living', ids[8]), false, 'Releasing an activity does not teleport its occupant outside');
        camera.positions[ids[0]].z = -100;
        assert(manager.hasRoomCapacity('living', ids[8]));
    });

    it('exclut le joueur et les animaux du plafond des PNJ', () => {
        const { ids, camera, manager } = fixture();
        camera.positions.player = camera.positions.robin = { x: 100, y: 0, z: 100 };
        for (let i = 0; i < 8; i++) assert(manager.claimSlot('living', `seat-${i}`, ids[i]));
        assert(manager.claimSlot('living', 'seat-8', 'player'));
        assert(manager.hasRoomCapacity('living', 'robin'), 'Animals do not consume NPC places');
        assert.equal(manager.getRoomOccupants('living').size, 8);
        assert.equal(manager.hasRoomCapacity('living', ids[8]), false);
    });

    it('réserve la capacité des deux partenaires avant de lancer un duo', () => {
        const { ids, manager } = fixture();
        for (let i = 0; i < 7; i++) assert(manager.claimSlot('living', `seat-${i}`, ids[i]));
        assert.equal(manager.hasRoomCapacity('living', ids[7], ids[8]), false);
        assert(manager.hasRoomCapacity('living', ids[0], ids[7]), 'An existing occupant only needs one additional place for their partner');
        assert(manager.hasRoomCapacity('living', 'player', ids[7]));
    });

    it('inclut la cuisine et exclut le couloir, les voisins, le jardin et les chutes en hauteur', () => {
        const { isInRoom } = fixture();
        assert(isInRoom('living', { x: 100, z: 100 }));
        assert(isInRoom('living', { x: 100, z: 430 }));
        for (const point of [{ x: 250, z: 430 }, { x: -100, z: 200 }, { x: 100, z: -100 }, { x: 100, z: 550 }, { x: 100, y: 2500, z: 100 }]) assert.equal(isInRoom('living', point), false);
    });

    it('conserve la limite existante de trois personnages dans la salle de bains', () => {
        const { ids, manager, ROOM_CAPACITIES } = fixture();
        assert.equal(ROOM_CAPACITIES.bathroom, 3);
        for (const [i, objectId] of ['toilet', 'vasque-sdb', 'sdb-closet'].entries()) assert(manager.claimSlot(objectId, 'use', ids[i]));
        assert.equal(manager.claimSlot('shower', 'use', ids[3]), false);
        manager.releaseAllForCharacter(ids[0]);
        assert(manager.claimSlot('shower', 'use', ids[3]));
    });

    it('compte les passages, le joueur et Ybot dans la salle de bains, même sans activité', () => {
        const { ids, camera, manager } = fixture();
        for (const id of ['player', 'ybot', ids[0]]) camera.positions[id] = { x: 100, y: 0, z: 550 };
        camera.positions.robin = { x: 100, y: 0, z: 550 };
        assert.equal(manager.getRoomOccupants('bathroom').size, 3);
        assert.equal(manager.hasRoomCapacity('bathroom', ids[1]), false);
        assert.equal(manager.getAvailableSlot('storage-box', ids[1]), null);
        assert.equal(manager.isObjectFullyOccupied('storage-box', ids[1]), true);
        assert.equal(manager.claimSlot('shower', 'use', ids[1]), false);
        assert(manager.claimSlot('storage-box', 'use', 'ybot'), 'An existing occupant may change activity');
        manager.releaseAllForCharacter('ybot');
        assert.equal(manager.hasRoomCapacity('bathroom', ids[1]), false, 'Presence still consumes the place after releasing the activity');
        camera.positions.ybot.x = 250;
        assert(manager.claimSlot('storage-box', 'use', ids[1]), 'The place becomes available after departure');
        assert.equal(manager.getRoomOccupants('bathroom').size, 3, 'Incoming storage activity counts even with its approach in the corridor');
    });

    it('réserve les deux places du duo en salle de bains et exclut le couloir et le jardin', () => {
        const { ids, camera, manager, isInRoom } = fixture();
        for (const id of ids.slice(0, 2)) camera.positions[id] = { x: 100, y: 0, z: 550 };
        assert.equal(manager.hasRoomCapacity('bathroom', ids[2], 'ybot'), false);
        assert(manager.hasRoomCapacity('bathroom', ids[0], 'ybot'));
        assert(isInRoom('bathroom', { x: 100, z: 550 }));
        for (const point of [{ x: 250, z: 550 }, { x: 100, z: 430 }, { x: -100, z: 550 }, { x: 100, z: 690 }, { x: 100, y: 2500, z: 550 }]) assert.equal(isInRoom('bathroom', point), false);
    });
});
