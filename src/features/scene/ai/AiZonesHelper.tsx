import * as THREE from 'three';
import { useMemo, useState, useEffect } from 'react';
import { useSceneStore } from '../store/useSceneStore';
import { WAYPOINTS } from './ZoneNodes';
import { SMART_OBJECTS, getSmartObject } from './smartObjectRegistry';

const CATEGORY_COLORS: Record<string, string> = {
  bed: '#ff4081',
  seating: '#00e5ff',
  hygiene: '#00e676',
  surface: '#ffab00',
  storage: '#ffd600',
  appliance: '#e040fb',
  outdoor: '#76ff03',
  decor: '#b388ff',
  door: '#ff5252',
  dance: '#ff007f'
};

/**
 * Crée un Sprite Three.js net et contrasté avec fond semi-transparent,
 * 100% visible à travers les murs grâce à depthTest: false et renderOrder élevé.
 */
function makeLabelSprite(
  title: string,
  lines: string[],
  titleColor: string,
  fontSizeWorld: number
): THREE.Sprite {
  const PX = 48;
  const paddingX = 24;
  const paddingY = 16;
  const lineHeight = PX * 1.25;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  ctx.font = `bold ${PX}px sans-serif`;
  let maxW = ctx.measureText(title).width;
  ctx.font = `normal ${Math.round(PX * 0.85)}px sans-serif`;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxW) maxW = w;
  }

  const canvasW = Math.ceil(maxW + paddingX * 2);
  const totalLines = 1 + lines.length;
  const canvasH = Math.ceil(totalLines * lineHeight + paddingY * 2);

  canvas.width = canvasW;
  canvas.height = canvasH;

  // Fond semi-opaque arrondi pour un contraste parfait
  ctx.fillStyle = 'rgba(10, 15, 20, 0.78)';
  const r = 12;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvasW - r, 0);
  ctx.quadraticCurveTo(canvasW, 0, canvasW, r);
  ctx.lineTo(canvasW, canvasH - r);
  ctx.quadraticCurveTo(canvasW, canvasH, canvasW - r, canvasH);
  ctx.lineTo(r, canvasH);
  ctx.quadraticCurveTo(0, canvasH, 0, canvasH - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Bordure
  ctx.strokeStyle = titleColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Titre
  ctx.font = `bold ${PX}px sans-serif`;
  ctx.fillStyle = titleColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, canvasW / 2, paddingY);

  // Lignes secondaires
  ctx.font = `500 ${Math.round(PX * 0.82)}px sans-serif`;
  ctx.fillStyle = '#ffffff';
  let curY = paddingY + lineHeight;
  for (const line of lines) {
    ctx.fillText(line, canvasW / 2, curY);
    curY += lineHeight;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(mat);
  const worldH = fontSizeWorld * totalLines * 1.5;
  const worldW = worldH * (canvasW / canvasH);
  sprite.scale.set(worldW, worldH, 1);
  sprite.renderOrder = 99999;
  return sprite;
}

export function AiZonesHelper() {
  const visible = useSceneStore(s => s.layers.aiZones);
  const cameraMode = useSceneStore(s => s.cameraMode);
  const [toggleVersion, setToggleVersion] = useState(0);
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setToggleVersion(v => v + 1);
    document.addEventListener('furniture-toggle', handler);
    return () => document.removeEventListener('furniture-toggle', handler);
  }, []);

  // Liste résolue des SmartObjects (monde / dynamique)
  const resolvedSmartObjects = useMemo(() => {
    return Object.keys(SMART_OBJECTS).map(id => getSmartObject(id) || SMART_OBJECTS[id]);
  }, [toggleVersion]);

  // Génération mémoïsée des sprites de labels
  const waypointSprites = useMemo(() => {
    const map: Record<string, THREE.Sprite> = {};
    Object.values(WAYPOINTS).forEach(wp => {
      map[wp.id] = makeLabelSprite(`📍 ${wp.name || wp.id}`, [], '#ffffff', 4.5);
    });
    return map;
  }, []);


  const smartObjectSprites = useMemo(() => {
    const map: Record<string, THREE.Sprite> = {};
    Object.values(SMART_OBJECTS).forEach(obj => {
      const color = CATEGORY_COLORS[obj.category] || '#00ff88';
      const lines = obj.slots.map(s => `• ${s.name}`);
      map[obj.id] = makeLabelSprite(`✨ ${obj.name}`, lines, color, 5.0);
    });
    return map;
  }, []);

  // Géométrie mémoïsée du triangle d'orientation 2D (arêtes droites nettes, base plate)
  const arrowGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Triangle isocèle 2D : pointe en bas (Y = -5.5) pour pointer vers Z+ dans le repère 3D lors du rotX = -PI/2
    // Quand rotY = 0, le personnage regarde vers Z+ (Sud).
    // Quand rotY = Math.PI, le personnage regarde vers Z- (Nord).
    shape.moveTo(0, -5.5);
    shape.lineTo(3.2, 3.0);
    shape.lineTo(-3.2, 3.0);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  if (!visible) return null;

  const isTopView = cameraMode === 'top';
  const baseHeight = isTopView ? 280 : 1.2;
  const labelHeight = isTopView ? 290 : 26;

  return (
    <group renderOrder={99999}>
      {/* ── Points de passage / Waypoints (masqués lorsqu'un slot est survolé) ── */}
      {!hoveredSlotKey && Object.values(WAYPOINTS).map(wp => {
        const sprite = waypointSprites[wp.id];
        return (
          <group key={`wp-${wp.id}`} position={[wp.x, baseHeight, wp.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[6, 24]} />
              <meshBasicMaterial color="#ffffff" opacity={0.35} transparent depthTest={false} depthWrite={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[5, 6, 24]} />
              <meshBasicMaterial color="#aaaaaa" depthTest={false} depthWrite={false} />
            </mesh>
            {sprite && <primitive object={sprite} position={[0, isTopView ? 8 : 16, 0]} />}
          </group>
        );
      })}

      {/* ── Smart Objects et leurs Slots d'affordance ── */}
      {resolvedSmartObjects.map(obj => {
        const color = CATEGORY_COLORS[obj.category] || '#00ff88';
        const slotsCount = obj.slots.length;
        
        // Centre moyen pour le label unifié
        const avgX = obj.slots.reduce((sum, s) => sum + (s.offset ? s.offset[0] : obj.position[0]), 0) / (slotsCount || 1);
        const avgZ = obj.slots.reduce((sum, s) => sum + (s.offset ? s.offset[2] : obj.position[2]), 0) / (slotsCount || 1);
        const sprite = smartObjectSprites[obj.id];

        return (
          <group key={`smart-${obj.id}`}>
            {/* Label Sprite Billboardé : masqué si un slot quelconque est survolé */}
            {!hoveredSlotKey && sprite && (
              <primitive object={sprite} position={[avgX, labelHeight, avgZ]} />
            )}

            {/* Cibles au sol + flèches d'orientation pour chaque slot */}
            {obj.slots.map(slot => {
              const slotKey = `${obj.id}:::${slot.slotId}`;
              const isHovered = hoveredSlotKey === slotKey;

              // Si un slot est survolé et que ce n'est pas celui-ci, le cacher
              if (hoveredSlotKey && !isHovered) {
                return null;
              }

              const pos = slot.offset ?? obj.position;

              // Construction du sprite de détails complets pour le slot survolé
              let detailSprite: THREE.Sprite | null = null;
              if (isHovered) {
                const lines: string[] = [
                  `Objet : ${obj.name} [${obj.id}]`,
                  `Slot ID : ${slot.slotId}`,
                  `Position : [${pos.map(n => Math.round(n * 10) / 10).join(', ')}]`,
                ];

                if (slot.relative !== undefined) {
                  lines.push(`Relative : ${slot.relative ? 'true' : 'false'}`);
                }
                if (slot.approachOffset) {
                  lines.push(`Approach : [${slot.approachOffset.map(n => Math.round(n * 10) / 10).join(', ')}]`);
                }

                const degRot = Math.round((((slot.rotY ?? obj.rotationY ?? 0) * 180) / Math.PI) % 360);
                lines.push(`RotY : ${(slot.rotY ?? obj.rotationY ?? 0).toFixed(2)} rad (${degRot}°)`);

                if (slot.animation) lines.push(`Animation : ${slot.animation}`);
                if (slot.animations_random) {
                  const anims = Array.isArray(slot.animations_random)
                    ? slot.animations_random.join(', ')
                    : slot.animations_random;
                  lines.push(`Pack/Anims : ${anims}`);
                }
                if (slot.availableAnims?.length) {
                  lines.push(`Variantes : ${slot.availableAnims.join(', ')}`);
                }
                if (slot.duration !== undefined) {
                  lines.push(`Durée : ${slot.duration}s`);
                }
                if (slot.repeatCount !== undefined) {
                  lines.push(`Répétitions : ${slot.repeatCount}${slot.repeatVariation ? ' (variation)' : ''}`);
                }
                if (slot.triggerEventKey) {
                  lines.push(`Trigger : ${slot.triggerEventKey}${slot.triggerTargetState !== undefined ? ` = ${slot.triggerTargetState}` : ''}`);
                }

                detailSprite = makeLabelSprite(
                  `🎯 ${slot.name}`,
                  lines,
                  '#00ffcc',
                  isTopView ? 5.5 : 4.5
                );
              }

              return (
                <group
                  key={`slot-${obj.id}-${slot.slotId}`}
                  position={[pos[0], baseHeight, pos[2]]}
                  userData={{
                    hoverAction: {
                      label: `${obj.name} (${slot.name})`,
                      actions: [`smart-object:::${obj.id}:::${slot.slotId}`],
                    },
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoveredSlotKey(slotKey);
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    setHoveredSlotKey(current => (current === slotKey ? null : current));
                  }}
                >
                  {/* Cible au sol (légèrement agrandie et mise en valeur si survolée) */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[isHovered ? 13 : 10, 32]} />
                    <meshBasicMaterial
                      color={isHovered ? '#ffffff' : color}
                      opacity={isHovered ? 0.85 : 0.4}
                      transparent
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[isHovered ? 11 : 8, isHovered ? 13 : 10, 32]} />
                    <meshBasicMaterial
                      color={isHovered ? '#00ffcc' : color}
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>
                  {/* Flèche d'orientation triangulaire 2D plate — base plate et pointe nette */}
                  <mesh
                    geometry={arrowGeo}
                    rotation={[-Math.PI / 2, 0, slot.rotY ?? obj.rotationY ?? 0]}
                    position={[0, 0.2, 0]}
                    scale={isHovered ? [1.3, 1.3, 1.3] : [1, 1, 1]}
                  >
                    <meshBasicMaterial
                      color={isHovered ? '#00ffcc' : '#ffffff'}
                      depthTest={false}
                      depthWrite={false}
                      side={THREE.DoubleSide}
                    />
                  </mesh>

                  {/* Sprite de détails affiché au-dessus du slot survolé */}
                  {detailSprite && (
                    <primitive
                      object={detailSprite}
                      position={[0, isTopView ? 20 : 35, 0]}
                    />
                  )}
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}





