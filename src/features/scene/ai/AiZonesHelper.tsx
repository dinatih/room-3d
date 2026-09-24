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

import { useThree } from '@react-three/fiber';
import { OccupancyManager } from './occupancyManager';
import { useZoneAiDebugStore } from './zoneAiDebugStore';
import { resolveSlotAnimationInfo } from '../animations/animationResolver';

export function AiZonesHelper() {
  const visible = useSceneStore(s => s.layers.aiZones);
  const cameraMode = useSceneStore(s => s.cameraMode);
  const { raycaster } = useThree();
  const [toggleVersion, setToggleVersion] = useState(0);

  useEffect(() => {
    raycaster.layers.enableAll();
  }, [raycaster]);
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null);
  const selectedSlot = useZoneAiDebugStore(s => s.selectedSlot);
  const setSelectedSlot = useZoneAiDebugStore(s => s.setSelectedSlot);

  useEffect(() => {
    const handler = () => setToggleVersion(v => v + 1);
    document.addEventListener('furniture-toggle', handler);
    document.addEventListener('agent-force-smartobject', handler);
    document.addEventListener('npc-invite-duo', handler);
    const interval = setInterval(handler, 1200);
    return () => {
      document.removeEventListener('furniture-toggle', handler);
      document.removeEventListener('agent-force-smartobject', handler);
      document.removeEventListener('npc-invite-duo', handler);
      clearInterval(interval);
    };
  }, []);

  // Liste résolue des SmartObjects (monde / dynamique)
  const resolvedSmartObjects = useMemo(() => {
    return Object.keys(SMART_OBJECTS)
      .map(id => getSmartObject(id))
      .filter((obj): obj is NonNullable<typeof obj> => Boolean(obj && obj.position));
  }, [toggleVersion]);

  // Génération mémoïsée des sprites de labels
  const waypointSprites = useMemo(() => {
    const map: Record<string, THREE.Sprite> = {};
    Object.values(WAYPOINTS).forEach(wp => {
      map[wp.id] = makeLabelSprite(`📍 ${wp.name || wp.id}`, [], '#ffffff', 4.5);
    });
    return map;
  }, []);

  // Géométrie mémoïsée du triangle d'orientation 2D (arêtes droites nettes, base plate)
  const arrowGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Triangle isocèle 2D : pointe en bas (Y = -5.5) pour pointer vers Z+ dans le repère 3D lors du rotX = -PI/2
    shape.moveTo(0, -5.5);
    shape.lineTo(3.2, 3.0);
    shape.lineTo(-3.2, 3.0);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);

  if (!visible) return null;

  const isTopView = cameraMode === 'top';
  const baseHeight = isTopView ? 280 : 1.2;

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

      {/* ── Smart Objects et leurs Slots d'affordance (cercles 10cm au sol, détails au survol) ── */}
      {resolvedSmartObjects.map(obj => {
        return (
          <group key={`smart-${obj.id}`}>

            {/* Cibles au sol + flèches d'orientation pour chaque slot */}
            {obj.slots.map((slot, sIdx) => {
              const slotKey = `${obj.id}:::${slot.slotId}`;
              const isHovered = hoveredSlotKey === slotKey;
              const isSelected = selectedSlot?.objectId === obj.id && selectedSlot?.slotId === slot.slotId;
              const isOccupied = OccupancyManager.isSlotOccupied(obj.id, slot.slotId);
              const occupant = OccupancyManager.getOccupant(obj.id, slot.slotId);

              // Si un slot est survolé et que ce n'est pas celui-ci, le cacher
              if (hoveredSlotKey && !isHovered) {
                return null;
              }

              const pos = slot.offset ?? [0, 0, 0];
              const slotColor = isOccupied ? '#ef4444' : isSelected ? '#38bdf8' : '#00e5ff';

              // Construction du sprite de détails complets pour le slot survolé
              let detailSprite: THREE.Sprite | null = null;
              if (isHovered) {
                const animMeta = resolveSlotAnimationInfo(slot);
                const lines: string[] = [
                  `✨ Meuble : ${obj.name} [${obj.id}]`,
                  `🎯 Slot : ${slot.name} [${slot.slotId}]`,
                  `Statut : ${isOccupied ? `Occupé (${occupant ?? 'PNJ'})` : 'Disponible'}`,
                  `ID Canonique : ${animMeta.canonicalId}`,
                ];

                if (animMeta.aliasUsed) {
                  lines.push(`Alias : ${animMeta.aliasUsed}`);
                }
                if (animMeta.pack) {
                  lines.push(`Pack : [${animMeta.pack}]`);
                }
                if (animMeta.tags.length > 0) {
                  lines.push(`Tags : ${animMeta.tags.slice(0, 4).join(', ')}`);
                }
                lines.push(`Clip GLB : ${animMeta.clipName}`);

                if (slot.relative !== undefined) {
                  lines.push(`Relative : ${slot.relative ? 'true' : 'false'}`);
                }
                if (slot.approachOffset) {
                  lines.push(`Approach : [${slot.approachOffset.map(n => Math.round(n * 10) / 10).join(', ')}]`);
                }

                const degRot = Math.round((((slot.rotY ?? obj.rotationY ?? 0) * 180) / Math.PI) % 360);
                lines.push(`RotY : ${(slot.rotY ?? obj.rotationY ?? 0).toFixed(2)} rad (${degRot}°)`);

                if (animMeta.variants && animMeta.variants.length > 0) {
                  const varStr = animMeta.variants
                    .slice(0, 3)
                    .map(v => v.aliasUsed ? `${v.canonicalId} (${v.aliasUsed})` : v.canonicalId)
                    .join(', ');
                  lines.push(`Variantes : ${varStr}`);
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

                if (obj.slots.length > 1) {
                  const otherSlots = obj.slots
                    .filter(s => s.slotId !== slot.slotId)
                    .map(s => {
                      const occ = OccupancyManager.isSlotOccupied(obj.id, s.slotId);
                      return `${s.name} [${occ ? 'Occupé' : 'Libre'}]`;
                    });
                  lines.push(`Autres slots : ${otherSlots.join(' | ')}`);
                }

                lines.push('👉 Cliquer pour ordonner à un PNJ');

                detailSprite = makeLabelSprite(
                  `✨ ${obj.name} — ${slot.name} (${isOccupied ? '❌ Occupé' : '✅ Dispo'})`,
                  lines,
                  CATEGORY_COLORS[obj.category] || (isOccupied ? '#f87171' : '#00ffcc'),
                  isTopView ? 5.5 : 4.5
                );
              }

              return (
                <group
                  key={`slot-${obj.id}-${slot.slotId}-${sIdx}`}
                  position={[pos[0], baseHeight, pos[2]]}
                  userData={{
                    hoverAction: {
                      label: `${obj.name} (${slot.name})`,
                      actions: [`smart-object:::${obj.id}:::${slot.slotId}`],
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSlot({ objectId: obj.id, slotId: slot.slotId });
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoveredSlotKey(slotKey);
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    setHoveredSlotKey(current => (current === slotKey ? null : current));
                    document.body.style.cursor = '';
                  }}
                >
                  {/* Volume de collision 3D invisible (facilite grandement le clic en perspective) */}
                  <mesh position={[0, 15, 0]}>
                    <cylinderGeometry args={[18, 18, 30, 16]} />
                    <meshBasicMaterial
                      transparent
                      opacity={0.0001}
                      depthWrite={false}
                      depthTest={false}
                    />
                  </mesh>

                  {/* Marqueur 3D au sol : 10cm comme avant (13cm si survolé ou sélectionné) */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[isHovered || isSelected ? 13 : 10, 32]} />
                    <meshBasicMaterial
                      color={isHovered ? '#ffffff' : slotColor}
                      opacity={isHovered || isSelected ? 0.85 : 0.4}
                      transparent
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>

                  {/* Anneau extérieur */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[isHovered || isSelected ? 11 : 8, isHovered || isSelected ? 13 : 10, 32]} />
                    <meshBasicMaterial
                      color={isHovered ? '#00ffcc' : isSelected ? '#ffffff' : slotColor}
                      depthTest={false}
                      depthWrite={false}
                    />
                  </mesh>

                  {/* Flèche d'orientation triangulaire 2D plate */}
                  <mesh
                    geometry={arrowGeo}
                    rotation={[-Math.PI / 2, 0, slot.rotY ?? obj.rotationY ?? 0]}
                    position={[0, 0.2, 0]}
                    scale={isHovered || isSelected ? [1.3, 1.3, 1.3] : [1, 1, 1]}
                  >
                    <meshBasicMaterial
                      color={isHovered ? '#00ffcc' : isSelected ? '#38bdf8' : '#ffffff'}
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





