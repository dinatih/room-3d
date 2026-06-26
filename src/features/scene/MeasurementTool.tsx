import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import { useSceneStore } from './store/useSceneStore';
import { PLAN_X_MIN, PLAN_X_MAX, PLAN_Z_MIN, PLAN_Z_MAX } from './floorDraw';

function constrainPoint(start: THREE.Vector3, current: THREE.Vector3): THREE.Vector3 {
  const constrained = current.clone();
  const dx = Math.abs(current.x - start.x);
  const dz = Math.abs(current.z - start.z);
  if (dx > dz) {
    constrained.z = start.z;
  } else {
    constrained.x = start.x;
  }
  return constrained;
}

export function MeasurementTool() {
  const [pointA, setPointA] = useState<THREE.Vector3 | null>(null);
  const [pointB, setPointB] = useState<THREE.Vector3 | null>(null);
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);

  const { invalidate } = useThree();
  const setMeasurementActive = useSceneStore(state => state.setMeasurementActive);

  // Constants for geometry sizing
  const W = PLAN_X_MAX - PLAN_X_MIN;
  const D = PLAN_Z_MAX - PLAN_Z_MIN;
  const cx = (PLAN_X_MIN + PLAN_X_MAX) / 2;
  const cz = (PLAN_Z_MIN + PLAN_Z_MAX) / 2;

  // Escape key handler to cancel/quit measurement mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pointA) {
          setPointA(null);
          setPointB(null);
          setHoverPoint(null);
          invalidate();
        } else {
          setMeasurementActive(false);
        }
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [pointA, invalidate, setMeasurementActive]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    const hitPoint = e.point.clone();
    hitPoint.y = 3.2; // Lock Y level just above floor plan

    if (!pointA) {
      setPointA(hitPoint);
      setHoverPoint(hitPoint);
      setPointB(null);
    } else if (!pointB) {
      const constrained = constrainPoint(pointA, hitPoint);
      setPointB(constrained);
      setHoverPoint(null);
    } else {
      // Third click restarts measurement
      setPointA(hitPoint);
      setHoverPoint(hitPoint);
      setPointB(null);
    }
    invalidate();
  };

  const handlePointerMove = (e: any) => {
    if (pointA && !pointB) {
      e.stopPropagation();
      const hitPoint = e.point.clone();
      hitPoint.y = 3.2;
      const constrained = constrainPoint(pointA, hitPoint);
      setHoverPoint(constrained);
      invalidate();
    }
  };

  // Compute Line points
  const linePoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    if (pointA) {
      pts.push([pointA.x, pointA.y, pointA.z]);
      const end = pointB || hoverPoint;
      if (end) {
        pts.push([end.x, end.y, end.z]);
      }
    }
    return pts;
  }, [pointA, pointB, hoverPoint]);

  const endPoint = pointB || hoverPoint;
  const midPoint = pointA && endPoint ? new THREE.Vector3().addVectors(pointA, endPoint).multiplyScalar(0.5) : null;
  const distance = pointA && endPoint ? Math.round(pointA.distanceTo(endPoint)) : 0;

  return (
    <>
      {/* Raycast Target plane (invisible but transparent so it intercepts pointer events) */}
      <mesh
        position={[cx, 3.1, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[W * 3, D * 3]} />
        <meshBasicMaterial transparent={true} opacity={0} depthWrite={false} />
      </mesh>

      {/* Render Point A */}
      {pointA && (
        <mesh position={[pointA.x, 3.25, pointA.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 4, 32]} />
          <meshBasicMaterial color="#00e5ff" depthTest={false} />
        </mesh>
      )}

      {/* Render Point B */}
      {pointB && (
        <mesh position={[pointB.x, 3.25, pointB.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 4, 32]} />
          <meshBasicMaterial color="#00e5ff" depthTest={false} />
        </mesh>
      )}

      {/* Render Measurement Line */}
      {linePoints.length >= 2 && (
        <Line
          points={linePoints}
          color="#00e5ff"
          lineWidth={2.5}
          depthTest={false}
        />
      )}

      {/* Render Distance Label */}
      {midPoint && (
        <Html position={[midPoint.x, 3.3, midPoint.z]} center>
          <div
            style={{
              background: 'rgba(10,10,20,0.92)',
              color: '#00e5ff',
              border: '1px solid rgba(0,229,255,0.5)',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 12,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(3px)',
              userSelect: 'none',
            }}
          >
            {distance} cm
          </div>
        </Html>
      )}
    </>
  );
}
