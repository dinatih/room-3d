/**
 * idleState.ts — Gestion globale de l'inactivité utilisateur (protection anti-CPU 42s).
 */

let globalLastActivityTime = typeof performance !== 'undefined' ? performance.now() : 0;

if (typeof window !== 'undefined') {
  const onUserActivity = () => {
    globalLastActivityTime = performance.now();
  };
  window.addEventListener('mousemove', onUserActivity, { passive: true });
  window.addEventListener('keydown', onUserActivity, { passive: true });
  window.addEventListener('touchstart', onUserActivity, { passive: true });
  window.addEventListener('wheel', onUserActivity, { passive: true });
  window.addEventListener('pointerdown', onUserActivity, { passive: true });
}

export function isAppIdle(): boolean {
  return (performance.now() - globalLastActivityTime) > 42000;
}

export function resetAppIdle(): void {
  globalLastActivityTime = performance.now();
}
