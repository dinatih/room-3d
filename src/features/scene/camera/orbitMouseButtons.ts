import { MOUSE } from 'three';

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

export function getOrbitMouseButtons(mode: 'rotate' | 'pan') {
  return mode === 'pan' ? PAN_MOUSE_BUTTONS : ROTATE_MOUSE_BUTTONS;
}
