/**
 * hoverState.ts — état partagé entre HoverRaycaster (dans Canvas)
 * et HoverOverlay (hors Canvas).
 */
export const hoverState = {
  // Hover dot — follows cursor when over actionable object
  visible:   false,
  label:     '',
  actionIds: [] as string[],
  x:         0,
  y:         0,
  // Locked modal — pinned until dismissed (click / Escape)
  locked:          false,
  lockedLabel:     '',
  lockedActionIds: [] as string[],
  lockedX:         0,
  lockedY:         0,
  /** True when modal was opened by touch tap. */
  touchActive: false,
  onUpdate:    null as (() => void) | null,
  cancelHide:  null as (() => void) | null,
};
