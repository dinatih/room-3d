import { useRef } from 'react';
import { useThree } from '@react-three/fiber';

const FREQUENCY = 12; // Pulsation du ressort (rad/s).
const DAMPING = 0.55; // Sous-amorti pour conserver un rebond visible.
const RESTITUTION = 0.3; // Énergie restituée par les butées.
const REST_TOLERANCE = 0.001; // Radians et radians/seconde.

/** Ressort analytique indépendant du framerate, avec rebond dans les limites physiques. */
export function useDoorSpring() {
  const velocity = useRef(0);
  const { invalidate } = useThree();
  return (current: number, target: number, delta: number, min: number, max: number) => {
    const decay = FREQUENCY * DAMPING;
    const frequency = FREQUENCY * Math.sqrt(1 - DAMPING * DAMPING);
    const offset = current - target;
    const sine = Math.sin(frequency * delta);
    const cosine = Math.cos(frequency * delta);
    const envelope = Math.exp(-decay * delta);
    const next = target + envelope * (offset * cosine + (velocity.current + decay * offset) / frequency * sine);
    velocity.current = envelope * (velocity.current * cosine - (decay * velocity.current + FREQUENCY ** 2 * offset) / frequency * sine);
    if (next < min || next > max) velocity.current *= -RESTITUTION;
    const angle = Math.max(min, Math.min(max, next));
    if (Math.abs(angle - target) < REST_TOLERANCE && Math.abs(velocity.current) < REST_TOLERANCE) {
      velocity.current = 0;
      return target;
    }
    if (velocity.current !== 0) invalidate();
    return angle;
  };
}
