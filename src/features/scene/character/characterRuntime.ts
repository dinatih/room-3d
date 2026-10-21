export interface RuntimeParticipant<Frame> {
  simulate: (frame: Frame, delta: number) => void;
  animate: (frame: Frame, delta: number) => void;
}

export const characterRuntimeStats = {
  frames: 0, characters: 0,
  simulation: { totalMs: 0, maxMs: 0, lastMs: 0 },
  animation: { totalMs: 0, maxMs: 0, lastMs: 0 },
  mixer: { totalMs: 0, maxMs: 0, calls: 0 },
  preparation: { totalMs: 0, maxMs: 0, calls: 0 },
};
function recordPhase(metric: { lastMs: number; totalMs: number; maxMs: number }, duration: number) {
  metric.lastMs = duration; metric.totalMs += duration; metric.maxMs = Math.max(metric.maxMs, duration);
}

/** All actors advance before any pose is evaluated; registration owns no React state. */
export class CharacterRuntime<Frame> {
  private participants = new Map<string, RuntimeParticipant<Frame>>();
  constructor(private stats = characterRuntimeStats) {}

  register(id: string, participant: RuntimeParticipant<Frame>): () => void {
    if (this.participants.has(id)) throw new Error(`Duplicate character runtime instance: ${id}`);
    this.participants.set(id, participant);
    return () => { this.participants.delete(id); };
  }

  tick(frame: Frame, delta: number): void {
    const start = performance.now();
    for (const participant of this.participants.values()) participant.simulate(frame, delta);
    const animatedAt = performance.now();
    for (const participant of this.participants.values()) participant.animate(frame, delta);
    const end = performance.now();
    this.stats.frames++;
    this.stats.characters = this.participants.size;
    recordPhase(this.stats.simulation, animatedAt - start);
    recordPhase(this.stats.animation, end - animatedAt);
  }
}
