import { MOUSE, TOUCH } from 'three';
import type { OrbitMouseMode } from './types';

const ROTATE_MOUSE_BUTTONS = {
  LEFT: MOUSE.ROTATE,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.PAN,
};

const TRANSLATE_MOUSE_BUTTONS = {
  LEFT: MOUSE.PAN,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.ROTATE,
};

const ROTATE_TOUCHES = {
  ONE: TOUCH.ROTATE,
  TWO: TOUCH.DOLLY_PAN,
};

const TRANSLATE_TOUCHES = {
  ONE: TOUCH.PAN,
  TWO: TOUCH.DOLLY_ROTATE,
};

export function getOrbitMouseButtons(mode: OrbitMouseMode) {
  return mode === 'translate' ? TRANSLATE_MOUSE_BUTTONS : ROTATE_MOUSE_BUTTONS;
}

export function getOrbitTouches(mode: OrbitMouseMode) {
  return mode === 'translate' ? TRANSLATE_TOUCHES : ROTATE_TOUCHES;
}


