import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

/** Transient angular target from a click; no open/closed state is stored. */
export function useDoorImpulse(key: string, maxAngle: number) {
  const angle = useRef(0);
  const { invalidate } = useThree();

  useEffect(() => {
    const onPush = (event: Event) => {
      if ((event as CustomEvent<{ key: string }>).detail.key !== key) return;
      angle.current = maxAngle;
      invalidate();
    };
    document.addEventListener('door-push', onPush);
    return () => document.removeEventListener('door-push', onPush);
  }, [key, maxAngle, invalidate]);

  return (delta: number) => {
    const target = angle.current;
    angle.current = Math.max(0, target - maxAngle * delta);
    return target;
  };
}
