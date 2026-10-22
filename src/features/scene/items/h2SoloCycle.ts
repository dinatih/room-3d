export function createH2SoloCycle() {
  return { motion: 'idle', time: 0, wait: 10, repetitions: 0 };
}

/** Wait ten seconds between complete sets of three, including the full final repetition. */
export function advanceH2SoloCycle(cycle: ReturnType<typeof createH2SoloCycle>, delta: number, duration: number, ready: boolean, pick: () => string): boolean {
  if (ready && (!Number.isFinite(duration) || duration <= 0)) throw new Error('Invalid H2 solo clip duration');
  if (cycle.motion === 'idle') {
    if (ready) cycle.time = (cycle.time + delta) % duration;
    cycle.wait -= delta;
    if (cycle.wait > 0) return false;
    cycle.motion = pick(); cycle.time = 0; cycle.repetitions = 3;
    return true;
  }
  if (!ready) return false;
  cycle.time += delta;
  while (cycle.time >= duration) {
    cycle.time -= duration;
    if (--cycle.repetitions === 0) {
      cycle.motion = 'idle'; cycle.time = 0; cycle.wait = 10;
      return true;
    }
  }
  return false;
}
