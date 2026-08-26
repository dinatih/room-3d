/**
 * idleState.ts — Gestion globale de l'inactivité utilisateur.
 */
import { useState, useEffect } from 'react';

/** Délai avant la mise en veille du moteur 3D, en secondes. */
export const APP_IDLE_TIMEOUT_SECONDS = 120;

let globalLastActivityTime = typeof performance !== 'undefined' ? performance.now() : 0;
const idleListeners = new Set<(idle: boolean) => void>();
let currentIdleState = false;

export function resetAppIdle(): void {
  globalLastActivityTime = typeof performance !== 'undefined' ? performance.now() : 0;
  if (currentIdleState) {
    currentIdleState = false;
    idleListeners.forEach(cb => cb(false));
  }
}

if (typeof window !== 'undefined') {
  const onUserActivity = (e: Event) => {
    // Ne pas réinitialiser sur les événements programmatiques internes d'IA
    if (e.type === 'furniture-toggle' && !(e as any).isTrusted && !(e as any).detail?.userInitiated) {
      return;
    }
    resetAppIdle();
  };

  // Événements d'entrée utilisateur en phase capture
  window.addEventListener('mousemove', onUserActivity, { capture: true, passive: true });
  window.addEventListener('keydown', onUserActivity, { capture: true, passive: true });
  window.addEventListener('keyup', onUserActivity, { capture: true, passive: true });
  window.addEventListener('touchstart', onUserActivity, { capture: true, passive: true });
  window.addEventListener('touchmove', onUserActivity, { capture: true, passive: true });
  window.addEventListener('wheel', onUserActivity, { capture: true, passive: true });
  window.addEventListener('pointerdown', onUserActivity, { capture: true, passive: true });
  window.addEventListener('pointermove', onUserActivity, { capture: true, passive: true });
  window.addEventListener('click', onUserActivity, { capture: true, passive: true });
  window.addEventListener('input', onUserActivity, { capture: true, passive: true });

  // Vérification périodique du seuil d'inactivité (toutes les 500ms)
  setInterval(() => {
    const idle = isAppIdle();
    if (idle !== currentIdleState) {
      currentIdleState = idle;
      idleListeners.forEach(cb => cb(idle));
    }
  }, 500);
}

export function isAppIdle(): boolean {
  return (performance.now() - globalLastActivityTime) > APP_IDLE_TIMEOUT_SECONDS * 1000;
}

export function useAppIdle(): boolean {
  const [idle, setIdle] = useState(isAppIdle());

  useEffect(() => {
    const cb = (newIdle: boolean) => setIdle(newIdle);
    idleListeners.add(cb);
    return () => {
      idleListeners.delete(cb);
    };
  }, []);

  return idle;
}
