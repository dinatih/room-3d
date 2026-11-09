const { it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { Vector3, Quaternion } = require('three');
const { load } = require('../support/load-ts.cjs');
const geometry = require('../../src/features/scene/ai/navigation/geometry.ts');
const obstacles = require('../../src/features/scene/ai/navigation/obstacles.ts');
const requests = require('../../src/features/scene/ai/navigation/doorRequests.ts');
const walls = require('../../src/features/scene/wallData.ts');
const architecture = require('../../src/features/scene/ai/navigation/architecture.ts');
const cameraState = { positions: {} };
const doors = load('src/features/scene/doorObstacles.ts', {
  './cameraState': { cameraState }, './ai/navigation/obstacles': obstacles,
  './ai/navigation/geometry': geometry, './ai/navigation/doorRequests': requests, './wallData': walls,
});
const { HornetTour, HornetSpace, HORNET_BOB_CM } = load('src/features/scene/hornetTour.ts', {
  three: require('three'), './wallData': walls, './camera/cameraViews': require('../../src/features/scene/camera/cameraViews.ts'),
  './tvData': require('../../src/features/scene/tvData.ts'), './bathtubData': require('../../src/features/scene/bathtubData.ts'),
  './furniturePositions': require('../../src/features/scene/furniturePositions.ts'),
  './ai/navigation/architecture': architecture, './ai/navigation/obstacles': obstacles,
  './ai/navigation/geometry': geometry, './doorObstacles': doors, './ai/navigation/doorRequests': requests,
});
const radius = 10;
const messages = [];
const makeTour = () => new HornetTour(radius, message => messages.push(message), () => 0.37);
const start = tour => tour.observations.find(o => o.id === 'garden').position.clone();
const openRequested = () => {
  for (const key of Object.keys(doors.DOOR_CONFIGS)) doors.doorCollisionState[key].angle = requests.doorRequested(key) ? doors.DOOR_CONFIGS[key].maxAngle : 0;
};
it('conserve les demandes des autres drones lorsqu’une visite libère ses portes', () => {
  const neo = new HornetTour(radius, () => {}, Math.random, 'dji-neo');
  const avata = new HornetTour(radius, () => {}, Math.random, 'dji-avata-2');
  requests.requestDoor('living', 'dji-neo');
  requests.requestDoor('living', 'dji-avata-2');
  try {
    neo.release();
    assert(requests.doorRequested('living'));
    avata.release();
    assert(!requests.doorRequested('living'));
  } finally { neo.release(); avata.release(); }
});
afterEach(() => {
  requests.releaseAgentDoors('drone');
  for (const id of [...obstacles.furnitureObstacles.keys()]) if (id.startsWith('hornet-test-')) obstacles.unregisterObstacle(id);
  for (const key of Object.keys(doors.DOOR_CONFIGS)) doors.doorCollisionState[key].angle = 0;
  doors.glassShutterState.clearHeight = 210;
  messages.length = 0;
});

it('place chaque observation hors des murs, linteaux et débattements, oscillations comprises', () => {
  const tour = makeTour();
  for (const o of tour.observations) assert(tour.space.safeStop(o.position, Math.sqrt(3) * HORNET_BOB_CM), o.label);
  for (const id of ['garden', 'terrace', 'feeder']) assert(tour.observations.some(o => o.id === id));
  assert.throws(() => new HornetSpace(NaN), /gabarit/);
});

it('parcourt le jardin sans traverser de battant et libère les portes après passage', () => {
  const tour = makeTour(), position = start(tour), quaternion = new Quaternion(), visited = new Set();
  let transitions = 0, requestsSeen = new Set();
  for (let frame = 0; frame < 60 * 700 && visited.size < tour.observations.length; frame++) {
    openRequested();
    for (const key of Object.keys(doors.DOOR_CONFIGS)) if (requests.doorRequested(key)) requestsSeen.add(key);
    const before = position.clone(), previous = tour.state;
    tour.tick(position, quaternion, 1 / 60);
    if (tour.state === 'travelling' && tour.wait > 0) assert(tour.space.safeStop(position), 'Attente dans le débattement d’une porte');
    assert(!tour.space.blocker(before, position), `Obstacle traversé : ${messages.at(-1)}`);
    for (const key of Object.keys(doors.DOOR_CONFIGS)) assert(!tour.space.doorHits(key, before, position, doors.doorCollisionState[key].angle), `Battant traversé : ${key}`);
    if (tour.state === 'observing' && previous !== 'observing') {
      visited.add(tour.observation.id);
      transitions++;
      assert(tour.space.safeStop(position, Math.sqrt(3) * HORNET_BOB_CM));
      assert(Object.keys(doors.DOOR_CONFIGS).every(key => !requests.doorRequested(key)), 'Réservation conservée pendant une observation');
    }
  }
  assert.deepEqual([...visited].sort(), tour.observations.map(o => o.id).sort(), messages.join('\n'));
  assert(transitions >= visited.size);
  assert.equal(requestsSeen.size, 0);
});

it('visite tous les points du jardin avant de les répéter et ne répète pas immédiatement', () => {
  const tour = makeTour(), position = start(tour), quaternion = new Quaternion(), visits = [];
  tour.reset('garden');
  const count = tour.observations.filter(o => o.room === 'garden').length;
  for (let frame = 0; frame < 60 * 600 && visits.length < count * 2; frame++) {
    openRequested();
    const previous = tour.state;
    tour.tick(position, quaternion, 1 / 60);
    if (previous !== 'observing' && tour.state === 'observing') visits.push(tour.observation.id);
    if (tour.observation) assert.equal(tour.observation.room, 'garden');
  }
  assert.equal(visits.length, count * 2, messages.join('\n'));
  assert.equal(new Set(visits.slice(0, count)).size, count);
  assert.equal(new Set(visits.slice(count)).size, count);
  assert.notEqual(visits[count - 1], visits[count]);
});

it('reste dans le jardin même lorsque le volet du studio est fermé', () => {
  const tour = makeTour(), position = start(tour), quaternion = new Quaternion(), rooms = new Set();
  doors.glassShutterState.clearHeight = 20;
  for (let frame = 0; frame < 60 * 180; frame++) {
    openRequested();
    tour.tick(position, quaternion, 1 / 60);
    if (tour.state === 'observing') rooms.add(tour.observation.room);
    assert(position.z < 0, 'Volet fermé traversé');
  }
  assert.deepEqual([...rooms], ['garden']);
  assert(tour.observations.every(o => o.room === 'garden'));
});

it('maintient une assiette réaliste lors des observations sans plongée verticale ni singularité', () => {
  for (const id of ['garden', 'terrace', 'feeder']) {
    const tour = makeTour(), observation = tour.observations.find(o => o.id === id), position = observation.position.clone(), quaternion = new Quaternion();
    tour.observation = observation; tour.state = 'observing';
    for (let i = 0; i < 300; i++) tour.tick(position, quaternion, 1 / 60);
    const forward = new Vector3(0, 0, 1).applyQuaternion(quaternion);
    assert(Math.abs(forward.y) <= 0.12 + 1e-3, `${id}: forward.y=${forward.y}`);
    assert(quaternion.toArray().every(Number.isFinite));
  }
});

it('distingue les obstacles selon leur hauteur et bloque les segments ascendants', () => {
  const space = new HornetSpace(radius);
  const box = { id: 'hornet-test-box', polygon: geometry.rectangle(100, 100, 30, 30), yMin: 80, yMax: 120 };
  assert(space.hits(new Vector3(50, 100, 100), new Vector3(150, 100, 100), box));
  assert(!space.hits(new Vector3(50, 160, 100), new Vector3(150, 160, 100), box));
  assert(space.hits(new Vector3(50, 50, 100), new Vector3(150, 150, 100), box));
  assert.equal(space.blocker(new Vector3(215, 230, -100), new Vector3(215, 230, 100)), 'studio-interdit-robots');
});

it('recalcule le réseau après déplacement du mobilier et ne traverse jamais le nouvel obstacle', () => {
  const tour = makeTour(), position = start(tour), quaternion = new Quaternion();
  tour.reset('garden');
  tour.tick(position, quaternion, 1 / 60);
  const target = tour.observation;
  obstacles.registerObstacle({ id: 'hornet-test-moved', polygon: geometry.rectangle(target.position.x, target.position.z, 50, 50), yMin: 0, yMax: walls.WALL_H });
  assert.equal(tour.route(position, target.position), null);
  for (let i = 0; i < 60 * 12; i++) { openRequested(); const before = position.clone(); tour.tick(position, quaternion, 1 / 60); assert(!tour.space.blocker(before, position)); }
  assert(messages.some(m => m.includes('hornet-test-moved')));
});

it('interdit le studio aux drones même lorsque ses portes sont ouvertes', () => {
  const tour = makeTour();
  for (const key of Object.keys(doors.DOOR_CONFIGS)) doors.doorCollisionState[key].angle = doors.DOOR_CONFIGS[key].maxAngle;
  for (const goal of [new Vector3(150, 150, 150), new Vector3(100, 150, 500), new Vector3(250, 150, 500)]) {
    assert.equal(tour.route(start(tour), goal), null);
    assert.equal(tour.space.blocker(start(tour), goal), 'studio-interdit-robots');
  }
});
