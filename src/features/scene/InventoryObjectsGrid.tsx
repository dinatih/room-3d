/**
 * InventoryObjectsGrid.tsx — Objets d'inventaire 3D en vitrines verticales par zone.
 *
 * Agencement 2D des vitrines (évite l'étalement excessif en largeur) :
 *   - Colonne Gauche  : Couloir (en haut) au-dessus de Salle de bain & WC (en bas)
 *   - Colonne Milieu  : Salon & Séjour (grande vitrine centrale avec le lit Utaker double, etc.)
 *   - Colonne Droite  : Jardin & Balcon (en haut, avec canapés + coffre) au-dessus de Cuisine (en bas)
 *
 * Hauteur : Y = 300 cm (flotte au-dessus du plafond à 250 cm).
 * Intègre les objets procéduraux demandés :
 *   - Canapé jardin accoudoirs (ArmrestSofa)
 *   - Canapé jardin sans accoudoirs (ArmlessSofa)
 *   - Banc coffre jardin (ChestBench)
 *   - Lit double Utaker (UtakerStack)
 *
 * Corrections de placement demandées :
 *   - Enceinte JBL / Sony -> Salon
 *   - Poubelle Fniss -> Salle de bain
 *   - Chaussures / mules / baskets -> Salon
 *   - Mackapär -> Salon
 *   - Klyket (crochets) -> Salon
 *   - Tåsjön mules -> Salon
 */

import React, { Component, Suspense, useMemo, useLayoutEffect, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

import { INVENTORY, type InventoryItem } from '@features/inventory/inventoryData';
import { useGLTFClone } from './useGLTFClone';
import { removeGlbLines, glbLocalBBox } from './glbUtils';
import { NOOP_STATE, NOOP_SIZE } from '@features/scene/sceneItem';
import { useSceneStore } from './store/useSceneStore';
import { cameraState } from './cameraState';

// Composants procéduraux
import { ArmrestSofa } from './items/ArmrestSofa';
import { ArmlessSofa } from './items/ArmlessSofa';
import { ChestBench } from './items/ChestBench';
import { UtakerStack } from './items/UtakerStack';
import { Laptop } from './items/Laptop';
import { Phone } from './items/Phone';
import { ShoeHatRack } from './items/ShoeHatRack';
import { MeubleT } from './items/MeubleT';
import { TV } from './items/TV';
import { MllseG2Pro } from './items/MllseG2Pro';
import { AirPerformer } from './items/AirPerformer';
import { MatterHub } from './items/MatterHub';
import { LaserDistanceMaster } from './items/LaserDistanceMaster';
import { DoubleVenusPendant } from './items/DoubleVenusPendant';
import { Counter } from './items/Counter';
import { NinjaSP101 } from './items/NinjaSP101';
import { TrashBin } from './items/TrashBin';
import { WaterHeater } from './items/WaterHeater';
import { Bathtub } from './items/Bathtub';
import { Backpack } from './items/Backpack';
import { JordanHexMule } from './items/JordanHexMule';
import { SummerOutdoorBoot } from './items/SummerOutdoorBoot';
import { WinterOutdoorBoot } from './items/WinterOutdoorBoot';
import { TShirt } from './items/TShirt';
import { MaillotInyeong } from './items/MaillotInyeong';
import { MannequinHead } from './items/MannequinHead';
import { DoorEntry } from './items/DoorEntry';
import { DoorLiving, DoorBath } from './items/DoorWhite';
import { GlassDoor } from './items/GlassDoor';
import { DoorFrame } from './items/DoorFrame';

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
    console.warn('[InventoryObjectsGrid] Error loading item GLB:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

// ── Configuration des dimensions de cellules ──────────────────────────────────

const CELL_W = 85;
const CELL_H = 104;
const TARGET_DISPLAY_SIZE = 50;

const ShoeHatRackGrid: React.ComponentType<any> = props => <ShoeHatRack {...props} noCaps />;

const PROCEDURAL_GRID_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'shoe-hat-rack': ShoeHatRackGrid,
  'meuble-t': MeubleT,
  tv: TV,
  'mini-pc': MllseG2Pro,
  laptop: Laptop,
  phone: Phone,
  'air-performer': AirPerformer,
  'matter-hub': MatterHub,
  'laser-distancemaster': LaserDistanceMaster,
  'double-venus-pendant': DoubleVenusPendant,
  counter: Counter,
  'ninja-sp101': NinjaSP101,
  'trash-bin': TrashBin,
  'water-heater': WaterHeater,
  bathtub: Bathtub,
  backpack: Backpack,
  'jordan-hex-mule': JordanHexMule,
  'summer-outdoor-boot': SummerOutdoorBoot,
  'winter-outdoor-boot': WinterOutdoorBoot,
  'tshirt-noir-L': TShirt,
  'tshirt-noir-XL': TShirt,
  'maillot-coreen-inyeong': MaillotInyeong,
  'mannequin-head': MannequinHead,
  'door-entry': DoorEntry,
  'door-living': DoorLiving,
  'door-sdb': DoorBath,
  'door-glass': GlassDoor,
  'door-frame': DoorFrame,
  'armrest-sofa': ArmrestSofa,
  'armless-sofa': ArmlessSofa,
  'chest-bench': ChestBench,
};

export interface UnifiedGridItem {
  id: string;
  name: string;
  category?: string;
  notes?: string;
  glbPath?: string;
  proceduralComponent?: React.ComponentType<any>;
}

// ── Définition des Zones ──────────────────────────────────────────────────────

interface ZoneDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
  cols: number;
}

const ZONES: ZoneDef[] = [
  { id: 'couloir', label: 'Couloir & Entrée', emoji: '🚪', color: '#b99b73', cols: 3 },
  { id: 'sdb', label: 'Salle de bain & WC', emoji: '🚿', color: '#7ea69a', cols: 3 },
  { id: 'salon', label: 'Salon & Séjour', emoji: '🛋️', color: '#7d9eac', cols: 4 },
  { id: 'jardin', label: 'Jardin & Balcon', emoji: '🌿', color: '#89a47d', cols: 3 },
  { id: 'cuisine', label: 'Cuisine', emoji: '🍳', color: '#bd8e70', cols: 3 },
];

/**
 * Filtre les objets autorisés (non perso, non perruque, non animal)
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

  // Exclure personnages
  if (
    cat === 'characters' ||
    path.includes('characters/') ||
    id.includes('lara') ||
    id.includes('xbot') ||
    name.includes('lara') ||
    id.includes('mannequin')
  ) {
    return false;
  }

  // Exclure animaux
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
 * Classification avec respect strict des consignes utilisateur :
 * - L'enceinte (JBL, Sony, SRS, etc.) -> Salon
 * - Poubelle Fniss -> SDB
 * - Chaussures, mules, baskets, Jordan, boots -> Salon
 * - Mackapär -> Salon
 * - Klyket (crochets) -> Salon
 * - Tåsjön mules -> Salon
 */
function classifyItem(item: UnifiedGridItem): string {
  const id = item.id.toLowerCase();
  const text = `${item.id} ${item.name} ${item.notes ?? ''} ${item.category ?? ''}`.toLowerCase();

  // 1. RÈGLES EXPLICITES UTILISATEUR POUR LE SALON
  if (
    id.includes('sony') ||
    id.includes('srs') ||
    id.includes('jbl') ||
    id.includes('enceinte') ||
    id.includes('speaker') ||
    id.includes('mackapar') ||
    id.includes('klyket') ||
    id.includes('tasjon') ||
    id.includes('mule') ||
    id.includes('chaussure') ||
    id.includes('grejig') ||
    id.includes('sneaker') ||
    id.includes('boot') ||
    id.includes('jordan') ||
    id.includes('utaker')
  ) {
    return 'salon';
  }

  // 2. RÈGLE EXPLICITE POUR LA SDB
  if (id.includes('fniss') || text.includes('fniss')) {
    return 'sdb';
  }

  // 3. JARDIN & BALCON
  if (
    text.includes('jardin') ||
    text.includes('extérieur') ||
    text.includes('exterieur') ||
    text.includes('terrasse') ||
    text.includes('balcon') ||
    text.includes('altappen') ||
    text.includes('vatterso') ||
    text.includes('mangeoire') ||
    id.includes('armless-sofa') ||
    id.includes('armrest-sofa') ||
    id.includes('chest-bench')
  ) {
    return 'jardin';
  }

  // 4. COULOIR / ENTRÉE
  if (
    text.includes('couloir') ||
    text.includes('entrée') ||
    text.includes('entree') ||
    text.includes('linky') ||
    text.includes('trottinette') ||
    text.includes('patère') ||
    text.includes('patere') ||
    text.includes('sekiner') ||
    text.includes('enudden')
  ) {
    return 'couloir';
  }

  // 5. SALLE DE BAIN & WC
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

  // 6. CUISINE
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

  // 7. Salon par défaut (literie, tech, bureau, étagères Kallax, etc.)
  return 'salon';
}

// ── Composant d'affichage d'un modèle 3D ou procédural ────────────────────────

function ProceduralItemInner({ item }: { item: UnifiedGridItem }) {
  const Comp = item.proceduralComponent!;
  const groupRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.scale.set(1, 1, 1);
    const box = glbLocalBBox(groupRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? TARGET_DISPLAY_SIZE / maxDim : 1;
    groupRef.current.scale.setScalar(s);

    const center = box.getCenter(new THREE.Vector3());
    groupRef.current.position.set(-center.x * s, -center.y * s, -center.z * s);
  }, []);

  return (
    <group ref={groupRef}>
      <Comp
        item={{ id: item.id } as any}
        actionState={{ ...NOOP_STATE, 'bed-double': true }}
        onSize={NOOP_SIZE}
      />
    </group>
  );
}

function GlbItemInner({ item }: { item: UnifiedGridItem }) {
  const cleanPath = item.glbPath!.startsWith('/') ? item.glbPath!.slice(1) : item.glbPath!;
  const { scene } = useGLTFClone(cleanPath);
  const rootRef = useRef<THREE.Group>(null!);

  useLayoutEffect(() => {
    if (!scene) return;

    removeGlbLines(scene);
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);

    const box = glbLocalBBox(scene);
    const size = box.getSize(new THREE.Vector3());
    const rawMax = Math.max(size.x, size.y, size.z);

    if (rawMax > 0 && rawMax < 5) {
      scene.scale.setScalar(100);
      const scaledBox = glbLocalBBox(scene);
      scaledBox.getSize(size);
    }

    const curBox = glbLocalBBox(scene);
    const curSize = curBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(curSize.x, curSize.y, curSize.z);
    const finalFactor = maxDim > 0 ? TARGET_DISPLAY_SIZE / maxDim : 1;
    scene.scale.multiplyScalar(finalFactor);

    const finalBox = glbLocalBBox(scene);
    const center = finalBox.getCenter(new THREE.Vector3());
    scene.position.set(-center.x, -center.y, -center.z);

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
    <group ref={rootRef}>
      <primitive object={scene} />
    </group>
  );
}

function GridItem({ item, position }: { item: UnifiedGridItem; position: [number, number, number] }) {
  return (
    <group position={position}>
      <GridItemErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          {item.proceduralComponent ? (
            <ProceduralItemInner item={item} />
          ) : (
            <GlbItemInner item={item} />
          )}
        </Suspense>
      </GridItemErrorBoundary>
    </group>
  );
}

// ── Composant Principal : InventoryObjectsGrid ─────────────────────────────────

export function InventoryObjectsGrid() {
  const { size } = useThree();
  // Liste complète : objets GLB filtrés + objets procéduraux demandés
  const allItems = useMemo<UnifiedGridItem[]>(() => {
    const glbItems: UnifiedGridItem[] = INVENTORY.filter(isAllowedInventoryItem).map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      notes: i.notes,
      glbPath: i.glbPath,
    }));

    // Les objets sans GLB réutilisent leur composant de scène dédié.
    const procedurals: UnifiedGridItem[] = INVENTORY
      .filter((item) => item.id !== 'utaker-stack' && PROCEDURAL_GRID_COMPONENTS[item.id])
      .map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        notes: item.notes,
        proceduralComponent: PROCEDURAL_GRID_COMPONENTS[item.id],
      }));

    // Présentation assemblée déjà utilisée pour les lits Utåker dans la grille.
    procedurals.push({
      id: 'utaker-double-bed',
      name: 'Lit Double Utåker (empilable réuni)',
      category: 'furniture',
      notes: 'Séjour',
      proceduralComponent: UtakerStack,
    });

    return [...glbItems, ...procedurals];
  }, []);

  // Regroupement par zone
  const grouped = useMemo(() => {
    const map = new Map<string, UnifiedGridItem[]>();
    for (const z of ZONES) map.set(z.id, []);

    for (const item of allItems) {
      const zoneId = classifyItem(item);
      if (map.has(zoneId)) {
        map.get(zoneId)!.push(item);
      } else {
        map.get('salon')!.push(item);
      }
    }

    return map;
  }, [allItems]);

  // Organisation en 3 colonnes horizontales :
  // Col 0 (Gauche)  : Couloir (en haut) / SDB (en bas)
  // Col 1 (Centre)  : Salon & Séjour
  // Col 2 (Droite)  : Jardin (en haut) / Cuisine (en bas)
  const sections = useMemo(() => {
    const couloirItems = grouped.get('couloir') ?? [];
    const sdbItems = grouped.get('sdb') ?? [];
    const salonItems = grouped.get('salon') ?? [];
    const jardinItems = grouped.get('jardin') ?? [];
    const cuisineItems = grouped.get('cuisine') ?? [];

    const col0Width = 3 * CELL_W;
    const col1Width = 4 * CELL_W;
    const colGap = 70;

    // Positions X des 3 colonnes
    const x0 = 0;
    const x1 = col0Width + colGap;
    const x2 = x1 + col1Width + colGap;

    // Calcul hauteurs SDB et Cuisine
    const sdbRows = Math.ceil(sdbItems.length / 3);
    const sdbHeight = sdbRows * CELL_H;

    const cuisineRows = Math.ceil(cuisineItems.length / 3);
    const cuisineHeight = cuisineRows * CELL_H;

    const verticalGap = 130;

    return [
      // Colonne Gauche : SDB en bas (Y=0), Couloir au-dessus
      {
        zone: ZONES.find((z) => z.id === 'sdb')!,
        items: sdbItems,
        baseX: x0,
        baseY: 0,
        cols: 3,
      },
      {
        zone: ZONES.find((z) => z.id === 'couloir')!,
        items: couloirItems,
        baseX: x0,
        baseY: sdbHeight + verticalGap,
        cols: 3,
      },

      // Colonne Centre : Salon & Séjour (sur 4 colonnes, Y=0)
      {
        zone: ZONES.find((z) => z.id === 'salon')!,
        items: salonItems,
        baseX: x1,
        baseY: 0,
        cols: 4,
      },

      // Colonne Droite : Cuisine en bas (Y=0), Jardin au-dessus
      {
        zone: ZONES.find((z) => z.id === 'cuisine')!,
        items: cuisineItems,
        baseX: x2,
        baseY: 0,
        cols: 3,
      },
      {
        zone: ZONES.find((z) => z.id === 'jardin')!,
        items: jardinItems,
        baseX: x2,
        baseY: cuisineHeight + verticalGap,
        cols: 3,
      },
    ];
  }, [grouped]);

  // Largeur totale de la disposition 3 colonnes
  const totalWidth = 3 * CELL_W + 70 + 4 * CELL_W + 70 + 3 * CELL_W;
  const offsetX = -totalWidth / 2 + 158; // centré par rapport à ROOM_W (316 cm)

  // Élévation à 3 mètres (Y = 300 cm, au-dessus du plafond à 250 cm)
  const rootY = 300;
  const rootZ = 180;

  useEffect(() => {
    const frameCamera = () => {
      if (!cameraState.isSceneLaunched || cameraState.isIntroRunning) return;
      // Inclure les panneaux, les titres et les noms dans le cadrage.
      const minX = Math.min(...sections.map(section => section.baseX - CELL_W / 2 - 8));
      const maxX = Math.max(...sections.map(section => section.baseX + (section.cols - 0.5) * CELL_W + 8));
      const minY = -CELL_H / 2 - 8;
      const maxY = Math.max(...sections.map(section =>
        section.baseY + Math.max(1, Math.ceil(section.items.length / section.cols)) * CELL_H + 14 + 18,
      ));
      const viewHeight = Math.max(maxY - minY, (maxX - minX) / (size.width / size.height));
      const target: [number, number, number] = [
        offsetX + (minX + maxX) / 2,
        rootY + (minY + maxY) / 2,
        rootZ,
      ];
      useSceneStore.getState().setActiveCameraView('front');
      document.dispatchEvent(new CustomEvent('camera-view', {
        detail: {
          key: 'front',
          projection: 'ortho',
          pos: [target[0], target[1], rootZ + viewHeight],
          target,
          zoom: 800 / viewHeight,
        },
      }));
    };
    // Attendre l'installation des écouteurs du contrôleur de caméra.
    let frame = requestAnimationFrame(frameCamera);
    const afterIntro = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(frameCamera);
    };
    window.addEventListener('camera-intro-finished', afterIntro);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('camera-intro-finished', afterIntro);
    };
  }, [sections, size.width, size.height, offsetX, rootY, rootZ]);

  return (
    <group name="inventory-objects-grid" position={[offsetX, rootY, rootZ]}>
      {sections.map(({ zone, items, baseX, baseY, cols }) => {
        const rows = Math.max(1, Math.ceil(items.length / cols));
        const width = cols * CELL_W;
        const totalHeight = rows * CELL_H;
        const centerX = baseX + width / 2 - CELL_W / 2;

        return (
          <group key={zone.id} position={[0, baseY, 0]}>
            {/* En-tête discret de la zone */}
            <Text
              position={[centerX, totalHeight + 18, 2]}
              fontSize={13}
              color={zone.color}
              anchorX="center"
              anchorY="bottom"
            >
              {`${zone.emoji} ${zone.label} (${items.length})`}
            </Text>

            {/* Cartes */}
            {items.map((item, idx) => {
              const col = idx % cols;
              const row = Math.floor(idx / cols);

              const cellX = baseX + col * CELL_W;
              const cellY = (rows - 1 - row) * CELL_H;

              return (
                <group key={item.id} position={[cellX, cellY, 0]}>
                  {/* Fond de carte */}
                  <mesh position={[0, 0, -25]}>
                    <planeGeometry args={[CELL_W - 6, CELL_H - 6]} />
                    <meshBasicMaterial color="#263438" />
                  </mesh>

                  {/* Repère de couleur sobre */}
                  <mesh position={[0, CELL_H / 2 - 5, 0]}>
                    <planeGeometry args={[CELL_W - 18, 1.5]} />
                    <meshBasicMaterial color={zone.color} />
                  </mesh>

                  {/* Modèle, avec une zone réservée au nom sous la carte */}
                  <GridItem item={item} position={[0, 8, 15]} />

                  <Text
                    position={[0, -CELL_H / 2 + 9, 30]}
                    fontSize={4.5}
                    color="#e2e8e7"
                    anchorX="center"
                    anchorY="top"
                    maxWidth={CELL_W - 14}
                    textAlign="center"
                    lineHeight={1.05}
                    whiteSpace="normal"
                    overflowWrap="break-word"
                  >
                    {item.name}
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
