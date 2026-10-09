import { MOUSE, TOUCH } from 'three';

const ROTATE_MOUSE_BUTTONS = {
  LEFT: MOUSE.ROTATE,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.PAN,
};

const PAN_MOUSE_BUTTONS = {
  LEFT: MOUSE.PAN,
  MIDDLE: MOUSE.DOLLY,
  RIGHT: MOUSE.ROTATE,
};

const ROTATE_TOUCHES = {
  ONE: TOUCH.ROTATE,
  TWO: TOUCH.DOLLY_PAN,
};

const PAN_TOUCHES = {
  ONE: TOUCH.PAN,
  TWO: TOUCH.DOLLY_ROTATE,
};

export function getOrbitMouseButtons(mode: 'rotate' | 'pan') {
  return mode === 'pan' ? PAN_MOUSE_BUTTONS : ROTATE_MOUSE_BUTTONS;
}

export function getOrbitTouches(mode: 'rotate' | 'pan') {
  return mode === 'pan' ? PAN_TOUCHES : ROTATE_TOUCHES;
}

