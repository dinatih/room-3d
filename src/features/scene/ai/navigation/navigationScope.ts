export interface NavigationJob<T> {
  readonly description: string;
  status: 'pending' | 'ready' | 'error' | 'cancelled';
  result?: T; error?: Error; settled: Promise<void>; cancel(): void;
}
/** A pending computation is an explicit wait, never an inaccessible destination. */
export class NavigationPending {
  constructor(readonly job: NavigationJob<unknown>) {}
}
export function readNavigationJob<T>(job: NavigationJob<T>): T {
  if (job.status === 'pending') throw new NavigationPending(job);
  if (job.status === 'error') throw job.error;
  if (job.status === 'cancelled') throw new Error('Cancelled navigation computation still in use');
  return job.result!;
}
let activeScope: NavigationScope | undefined;
export class NavigationScope {
  private jobs = new Map<string, NavigationJob<unknown>>();
  private values = new Map<string, unknown>();
  private disposers = new Map<string, () => void>();
  value<T>(key: string, create: () => T, dispose?: (value: T) => void): T {
    if (!this.values.has(key)) {
      const value = create();
      this.values.set(key, value);
      if (dispose) this.disposers.set(key, () => dispose(value));
    }
    return this.values.get(key) as T;
  }
  read<T>(key: string, create: () => NavigationJob<T>): T {
    let job = this.jobs.get(key) as NavigationJob<T> | undefined;
    if (!job) { job = create(); this.jobs.set(key, job); }
    return readNavigationJob(job);
  }
  clear(): void {
    for (const job of this.jobs.values()) job.cancel();
    this.jobs.clear();
    for (const dispose of this.disposers.values()) dispose();
    this.disposers.clear();
    this.values.clear();
  }
  run<T>(operation: () => T): T {
    const previous = activeScope; activeScope = this;
    try { const result = operation(); this.clear(); return result; }
    catch (error) { if (!(error instanceof NavigationPending)) this.clear(); throw error; }
    finally { activeScope = previous; }
  }
  poll(operation: () => void): boolean {
    try { this.run(operation); return true; }
    catch (error) { if (!(error instanceof NavigationPending)) throw error; return false; }
  }
}
export const getNavigationScope = (): NavigationScope | undefined => activeScope;
export function navigationValue<T>(key: string, create: () => T): T {
  if (!activeScope) throw new Error('Navigation value requires a NavigationScope');
  return activeScope.value(key, create);
}
export function navigationQuery<T>(key: string, create: () => NavigationJob<T>): T {
  if (!activeScope) throw new Error('Navigation query requires a NavigationScope');
  return activeScope.read(key, create);
}

/** UI commands wait for geometry before committing reservations or dispatching events. */
export async function resolveNavigation<T>(operation: () => T): Promise<T> {
  const scope = new NavigationScope();
  try {
    for (;;) {
      try { return scope.run(operation); }
      catch (error) {
        if (!(error instanceof NavigationPending)) throw error;
        await error.job.settled;
      }
    }
  } finally { scope.clear(); }
}
