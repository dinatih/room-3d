/**
 * idleState.ts — Gestion globale de l'inactivité utilisateur (protection anti-CPU 42s).
 */

let globalLastActivityTime = typeof performance !== 'undefined' ? performance.now() : 0;

export function resetAppIdle(): void {
  globalLastActivityTime = typeof performance !== 'undefined' ? performance.now() : 0;
}

if (typeof window !== 'undefined') {
  const onUserActivity = () => {
    globalLastActivityTime = performance.now();
  };
  // Use capture phase so stopPropagation() from UI controls cannot prevent idle timer resets
  window.addEventListener('mousemove', onUserActivity, { capture: true, passive: true });
  window.addEventListener('keydown', onUserActivity, { capture: true, passive: true });
  window.addEventListener('keyup', onUserActivity, { capture: true, passive: true });
  window.addEventListener('touchstart', onUserActivity, { capture: true, passive: true });
  window.addEventListener('wheel', onUserActivity, { capture: true, passive: true });
  window.addEventListener('pointerdown', onUserActivity, { capture: true, passive: true });
  window.addEventListener('click', onUserActivity, { capture: true, passive: true });
  window.addEventListener('input', onUserActivity, { capture: true, passive: true });
  document.addEventListener('furniture-toggle', onUserActivity, { capture: true, passive: true });
}

export function isAppIdle(): boolean {
  return (performance.now() - globalLastActivityTime) > 42000;
}
