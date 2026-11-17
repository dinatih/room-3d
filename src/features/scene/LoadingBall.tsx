import { useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CanvasTexture, Mesh, OrthographicCamera, SRGBColorSpace, Vector3 } from 'three';

const BALL_RADIUS = 3.35; // Balle de tennis de 6,7 cm.
const TEXT_HEIGHT = 24;
const STAGE_HEIGHT = TEXT_HEIGHT * 4;
const FLOOR = -STAGE_HEIGHT / 2 + TEXT_HEIGHT;

function BouncingBall() {
  const ball = useRef<Mesh>(null);
  const titleMesh = useRef<Mesh>(null);
  const velocity = useRef(new Vector3(60, 100, 30));
  const horizontalLimit = useRef(0);
  const { camera, size } = useThree();
  const title = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1536; canvas.height = 96;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D indisponible pour le titre du chargement.');
    context.font = '900 60px system-ui, -apple-system, sans-serif';
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillStyle = '#991b1b';
    const textureScale = 60 / 13;
    context.shadowColor = 'rgba(255, 255, 255, 0.9)';
    context.shadowOffsetY = textureScale;
    context.shadowBlur = textureScale / 2;
    context.fillText('CHARGEMENT DE LA SCÈNE 3D…', 768, 48);
    context.shadowColor = 'transparent';
    context.fillText('CHARGEMENT DE LA SCÈNE 3D…', 768, 48);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
  useLayoutEffect(() => () => title.dispose(), [title]);
  useLayoutEffect(() => {
    if (size.width <= 0 || size.height <= 0) return;
    const ortho = camera as OrthographicCamera;
    ortho.zoom = size.height / STAGE_HEIGHT;
    ortho.updateProjectionMatrix();
    horizontalLimit.current = Math.max(0, size.width / ortho.zoom / 2 - BALL_RADIUS);
    titleMesh.current!.scale.x = Math.min(TEXT_HEIGHT * 16, size.width / ortho.zoom * 0.85);
  }, [camera, size.width, size.height]);
  useFrame((_, delta) => {
    if (!ball.current) return;
    const position = ball.current.position;
    velocity.current.y -= 350 * delta;
    position.addScaledVector(velocity.current, delta);
    if (position.y < FLOOR + BALL_RADIUS) {
      position.y = FLOOR + BALL_RADIUS;
      velocity.current.set((Math.random() * 2 - 1) * 120, 80 + Math.random() * 100, (Math.random() * 2 - 1) * 50);
    }
    if (Math.abs(position.x) > horizontalLimit.current) {
      position.x = Math.sign(position.x) * horizontalLimit.current;
      velocity.current.x *= -1;
    }
    if (Math.abs(position.z) > STAGE_HEIGHT / 2) {
      position.z = Math.sign(position.z) * STAGE_HEIGHT / 2;
      velocity.current.z *= -1;
    }
  });
  return <>
    <mesh ref={titleMesh} position={[0, FLOOR - TEXT_HEIGHT / 2, 0]}>
      <planeGeometry args={[1, TEXT_HEIGHT]} />
      <meshBasicMaterial map={title} transparent alphaTest={0.1} toneMapped={false} />
    </mesh>
    <mesh ref={ball} position={[0, FLOOR + BALL_RADIUS, 0]}>
      <sphereGeometry args={[BALL_RADIUS, 20, 12]} />
      <meshLambertMaterial color="#ef2222" />
    </mesh>
  </>;
}

export function LoadingBall() {
  const container = document.getElementById('loading-ball');
  if (!container) return null;
  return createPortal(
    <Canvas orthographic camera={{ position: [0, 0, 300], near: 0.1, far: 1000 }}
      dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <hemisphereLight args={['#ffffff', '#d8d5cf', 2]} />
      <directionalLight position={[100, 150, 200]} intensity={1} />
      <BouncingBall />
    </Canvas>,
    container,
  );
}
