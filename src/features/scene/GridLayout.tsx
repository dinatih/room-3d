/**
 * GridLayout.tsx — Vue inventaire 3D en vitrine / grille verticale.
 *
 * Placé à 3m de hauteur (Y = 300 cm, au-dessus du plafond de l'appartement qui est à 250 cm).
 *
 * Utilise la même logique que les items 3D de la scène pour garantir l'affichage :
 * - `useGLTFClone`
 * - `removeGlbLines`
 * - Normalisation d'échelle (si en mètres, passage en cm via scale.setScalar(100))
 * - Éclairage ambiant + directionnel direct sans ombres bloquantes
 * - Matériaux des étagères et arrières-plans opaques (évite tout bug de tri transparent avec le sol/jardin)
 */

import React, { Component, Suspense, useMemo, useLayoutEffect, useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

import { INVENTORY, type InventoryItem } from '@features/inventory/inventoryData';
import { useGLTFClone } from './useGLTFClone';
import { removeGlbLines, glbLocalBBox } from './glbUtils';

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class GridItemErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('[GridLayout] Error loading item GLB:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

// ── Configuration de la grille verticale ──────────────────────────────────────

const CELL_W = 90;
const CELL_H = 85;
const COLS_PER_ZONE = 4;
const ZONE_SPACING_X = 80;
const TARGET_DISPLAY_SIZE = 55;

// ── Définition des Zones ──────────────────────────────────────────────────────

interface ZoneDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const ZONES: ZoneDef[] = [
  {
    id: 'couloir',
    label: 'Couloir & Entrée',
    emoji: '🚪',
    color: '#e67e22',
  },
  {
    id: 'sdb',
    label: 'Salle de bain & WC',
    emoji: '🚿',
    color: '#16a085',
  },
  {
    id: 'salon',
    label: 'Salon & Séjour',
    emoji: '🛋️',
    color: '#2980b9',
  },
  {
    id: 'cuisine',
    label: 'Cuisine',
    emoji: '🍳',
    color: '#d35400',
  },
  {
    id: 'jardin',
    label: 'Jardin & Balcon',
    emoji: '🌿',
    color: '#27ae60',
  },
];

/**
 * Filtre strict : mobilier et objets uniquement (sans Lara, XBot, perruques, ni animaux)
 */
function isAllowedInventoryItem(item: InventoryItem): boolean {
  if (!item.glbPath) return false;
  const path = item.glbPath.toLowerCase();
  const id = item.id.toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  // Exclure perruques
  if (cat === 'wigs' || path.includes('wigs') || path.includes('hair') || id.startsWith('hair_')) {
    return false;
  }

  // Exclure personnages (Lara, XBot, mannequin, etc.)
  if (
    cat === 'walkers' ||
    path.includes('characters/') ||
    id.includes('lara') ||
    id.includes('xbot') ||
    id.includes('walker') ||
    name.includes('lara') ||
    id.includes('mannequin')
  ) {
    return false;
  }

  // Exclure animaux (Shiba Inu, Robin Bird, etc.)
  if (
    id.includes('shiba') ||
    id.includes('ushiro') ||
    id.includes('robin') ||
    name.includes('shiba') ||
    name.includes('robin')
  ) {
    return false;
  }

  return true;
}

/**
 * Classe un item d'inventaire dans l'une des 5 zones
 */
function classifyItem(item: InventoryItem): string {
  const text = `${item.id} ${item.name} ${item.notes ?? ''} ${item.category}`.toLowerCase();

  // 1. Jardin / Extérieur
  if (
    text.includes('jardin') ||
    text.includes('extérieur') ||
    text.includes('exterieur') ||
    text.includes('terrasse') ||
    text.includes('balcon') ||
    text.includes('altappen') ||
    text.includes('vatterso') ||
    text.includes('mangeoire') ||
    item.category === 'garden' ||
    item.category === 'outdoor'
  ) {
    return 'jardin';
  }

  // 2. Couloir / Entrée
  if (
    text.includes('couloir') ||
    text.includes('entrée') ||
    text.includes('entree') ||
    text.includes('linky') ||
    text.includes('trottinette') ||
    text.includes('chaussure') ||
    text.includes('grejig') ||
    text.includes('mackapar') ||
    text.includes('patère') ||
    text.includes('patere') ||
    text.includes('sekiner') ||
    text.includes('enudden') ||
    text.includes('klyket')
  ) {
    return 'couloir';
  }

  // 3. Salle de bain / WC
  if (
    item.category === 'bathroom' ||
    text.includes('sdb') ||
    text.includes('bain') ||
    text.includes('douche') ||
    text.includes('wc') ||
    text.includes('toilet') ||
    text.includes('lavabo') ||
    text.includes('vasque') ||
    text.includes('serviette') ||
    text.includes('miroir') ||
    text.includes('nissedal') ||
    text.includes('brogrund') ||
    text.includes('storavan') ||
    text.includes('vallamosse') ||
    text.includes('havback') ||
    text.includes('tisken')
  ) {
    return 'sdb';
  }

  // 4. Cuisine
  if (
    item.category === 'kitchen' ||
    text.includes('cuisine') ||
    text.includes('évier') ||
    text.includes('evier') ||
    text.includes('cuisson') ||
    text.includes('plaque') ||
    text.includes('hotte') ||
    text.includes('casserole') ||
    text.includes('faitout') ||
    text.includes('couvert') ||
    text.includes('cuillère') ||
    text.includes('fourchette') ||
    text.includes('couteau') ||
    text.includes('vaisselle') ||
    text.includes('frigo') ||
    text.includes('boholmen') ||
    text.includes('utdrag') ||
    text.includes('valbildad') ||
    text.includes('middagsmat') ||
    text.includes('annons') ||
    text.includes('fornuft') ||
    text.includes('lillviken') ||
    text.includes('rinnig')
  ) {
    return 'cuisine';
  }

  // 5. Salon / Séjour (par défaut)
  return 'salon';
}

// ── Composant d'affichage d'un modèle 3D ──────────────────────────────────────

interface GridItemProps {
  item: InventoryItem;
  position: [number, number, number];
}

function GridItemInner({ item, position }: GridItemProps) {
  const cleanPath = item.glbPath!.startsWith('/') ? item.glbPath!.slice(1) : item.glbPath!;
  const { scene } = useGLTFClone(cleanPath);
  const rootRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    if (!scene) return;

    // 1. Nettoyer les lignes parasites et réinitialiser les transformations
    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    // 2. Calculer la bounding box locale initiale
    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());
    const rawMax = Math.max(size.x, size.y, size.z);

    // 3. Normaliser si le fichier est en mètres (IKEA models < 5 unités de haut/large)
    if (rawMax > 0 && rawMax < 5) {
      scene.scale.setScalar(100);
      const scaledBox = glbLocalBBox(scene);
      scaledBox.getSize(size);
    }

    // 4. Mettre à l'échelle finale pour tenir dans la case de rangement
    const curBox = glbLocalBBox(scene);
    const curSize = curBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(curSize.x, curSize.y, curSize.z);
    const finalFactor = maxDim > 0 ? TARGET_DISPLAY_SIZE / maxDim : 1;
    scene.scale.multiplyScalar(finalFactor);

    // 5. Recalculer la boîte et centrer exactement l'objet en X, Y, Z
    const finalBox = glbLocalBBox(scene);
    const center = finalBox.getCenter(new THREE.Vector3());
    scene.position.set(-center.x, -center.y, -center.z);

    // 6. Activer le doubleSide ou forcer l'opacité sur tous les meshes
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m: any) => {
            m.side = THREE.DoubleSide;
            if (m.transparent && m.opacity < 0.2 && !m.map && !m.alphaMap) {
              m.transparent = false;
              m.opacity = 1.0;
            }
          });
        }
      }
    });
  }, [scene]);

  return (
    <group ref={rootRef} position={position}>
      <primitive object={scene} />
    </group>
  );
}

function GridItem({ item, position }: GridItemProps) {
  return (
    <GridItemErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <GridItemInner item={item} position={position} />
      </Suspense>
    </GridItemErrorBoundary>
  );
}

// ── Composant Principal : GridLayout ──────────────────────────────────────────

export function GridLayout() {
  // Liste filtrée sans perso, perruques, ni animaux
  const items = useMemo(() => {
    return INVENTORY.filter(isAllowedInventoryItem);
  }, []);

  // Regroupement par zone
  const groupedZones = useMemo(() => {
    const map = new Map<string, InventoryItem[]>();
    for (const z of ZONES) map.set(z.id, []);

    for (const item of items) {
      const zoneId = classifyItem(item);
      if (map.has(zoneId)) {
        map.get(zoneId)!.push(item);
      } else {
        map.get('salon')!.push(item);
      }
    }

    return ZONES.map((zone) => ({
      ...zone,
      items: map.get(zone.id) ?? [],
    })).filter((z) => z.items.length > 0);
  }, [items]);

  // Positionnement en X de chaque section de zone
  const zoneLayouts = useMemo(() => {
    let currentX = 0;
    return groupedZones.map((zone) => {
      const cols = Math.min(COLS_PER_ZONE, Math.max(1, zone.items.length));
      const width = cols * CELL_W;
      const x = currentX;
      currentX += width + ZONE_SPACING_X;
      return {
        ...zone,
        startX: x,
        cols,
        width,
      };
    });
  }, [groupedZones]);

  // Centrage de la vitrine
  const totalWidth = zoneLayouts.reduce((acc, z) => Math.max(acc, z.startX + z.width), 0);
  const offsetX = -totalWidth / 2 + 158; // centré par rapport à la pièce (ROOM_W = 316 cm)
  
  // Placement à 3m de hauteur (Y = 300 cm, au-dessus du plafond à 250 cm)
  const baseY = 300;
  const baseZ = 200; // Aligné au centre de profondeur de l'appartement

  return (
    <group position={[offsetX, baseY, baseZ]}>
      {/* Éclairage d'ambiance et projecteur dédié pour la vitrine en hauteur */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[totalWidth / 2, 500, 400]} intensity={2.5} />

      {zoneLayouts.map((zone) => {
        const rows = Math.ceil(zone.items.length / zone.cols);
        const totalHeight = rows * CELL_H;
        const centerX = zone.startX + zone.width / 2 - CELL_W / 2;

        return (
          <group key={zone.id}>
            {/* 🏷️ Titre de la zone */}
            <Text
              position={[centerX, totalHeight + 35, 0]}
              fontSize={24}
              color={zone.color}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={1.5}
              outlineColor="#111111"
            >
              {`${zone.emoji} ${zone.label} (${zone.items.length})`}
            </Text>

            {/* 📋 Panneau d'arrière-plan OPAQUE pour éviter tout bug de transparence avec le sol */}
            <mesh
              position={[centerX, totalHeight / 2 - CELL_H / 2, -15]}
            >
              <planeGeometry args={[zone.width + 16, totalHeight + 16]} />
              <meshBasicMaterial color="#1e272e" />
            </mesh>

            {/* Cadre délimitant */}
            <lineSegments position={[centerX, totalHeight / 2 - CELL_H / 2, -14]}>
              <edgesGeometry args={[new THREE.PlaneGeometry(zone.width + 16, totalHeight + 16)]} />
              <lineBasicMaterial color={zone.color} />
            </lineSegments>

            {/* 📦 Cellules et objets */}
            {zone.items.map((item, idx) => {
              const col = idx % zone.cols;
              const row = Math.floor(idx / zone.cols);

              const cellX = zone.startX + col * CELL_W;
              const cellY = (rows - 1 - row) * CELL_H;

              return (
                <group key={item.id} position={[cellX, cellY, 0]}>
                  {/* Fond de case sombre opaque */}
                  <mesh position={[0, 0, -10]}>
                    <planeGeometry args={[CELL_W - 8, CELL_H - 8]} />
                    <meshBasicMaterial color="#2d3436" />
                  </mesh>

                  {/* Tablette d'étagère sous l'objet (opaque) */}
                  <mesh position={[0, -CELL_H / 2 + 6, 0]}>
                    <boxGeometry args={[CELL_W - 8, 2, 30]} />
                    <meshBasicMaterial color={zone.color} />
                  </mesh>

                  {/* Modèle 3D centré */}
                  <GridItem item={item} position={[0, 0, 5]} />

                  {/* Nom de l'objet sous la case */}
                  <Text
                    position={[0, -CELL_H / 2 + 1, 16]}
                    fontSize={6.5}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="top"
                    maxWidth={CELL_W - 8}
                    textAlign="center"
                    outlineWidth={0.6}
                    outlineColor="#000000"
                  >
                    {item.name.length > 30 ? `${item.name.slice(0, 28)}…` : item.name}
                  </Text>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
