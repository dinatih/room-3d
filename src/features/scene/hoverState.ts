/**
 * hoverState.ts — état partagé entre HoverRaycaster (dans Canvas)
 * et HoverOverlay (hors Canvas).
 */
export const hoverState = {
  visible:   false,
  label:     '',
  actionIds: [] as string[],
  x:         0,
  y:         0,
  /** Vrai quand le menu a été ouvert par un tap (touch) — bloque l'auto-masquage souris. */
  touchActive: false,
  /** Appelé par HoverRaycaster quand l'état change ; HoverOverlay s'y abonne. */
  onUpdate:    null as (() => void) | null,
  /** Enregistré par HoverRaycaster ; appelé par HoverOverlay.onMouseEnter. */
  cancelHide:  null as (() => void) | null,
};
