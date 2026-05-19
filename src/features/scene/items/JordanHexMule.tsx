/**
 * JordanHexMule.tsx — Jordan Hex Mule SP (University Red, FJ0603-600), paire complète.
 *
 * Toute l'enveloppe extérieure de la chaussure suit l'empreinte hexagonale
 * ("coffin shape", 6 faces : 2 longs flancs + 2 épaulements ≈60° + bout (Wt) +
 * talon (W)).  Les 6 arrêtes verticales du prisme hex correspondent aux 6
 * coins du polygone, dont 2 sur le côté extérieur de chaque chaussure.
 *
 * Construction (BufferGeometry unique + flatShading) :
 *   - Face inférieure (semelle, y=0) : hexagone plat
 *   - Murs latéraux : prismes verticaux avec bord supérieur variable h_top(z)
 *                     ⇒ silhouette pointue à l'avant qui descend vers le talon
 *   - Surface supérieure : hexagone avec trou ovale (foot well), triangulée
 *                          via THREE.ShapeUtils, vertices "soulevés" à h_top(z)
 *   - Parois ovale du foot well : verticales du rim à la footbed (y=SH)
 *   - Sol du foot well : disque/hexa à y=SH (où repose le pied)
 *
 * Coordonnées locales : centré XZ, Y=0 = sol.  Bout en −Z.  Paire = miroir X.
 */
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { SceneItemProps } from '@shared/types'

// Materials — flatShading sur l'enveloppe pour révéler les 6 facettes hex
const matEnv  = new THREE.MeshStandardMaterial({
  color: 0xb31c1c, roughness: 0.78, flatShading: true, side: THREE.DoubleSide,
})
const matBed  = new THREE.MeshStandardMaterial({ color: 0xc44444, roughness: 0.55 })
const matDark = new THREE.MeshStandardMaterial({ color: 0x7d1212, roughness: 0.88 })

// ── Dimensions (1 unit = 1 cm) ────────────────────────────────────────────────
const L      = 285                                   // longueur totale (Z)
const W      = 98                                    // largeur max au talon (X)
const Wt     = 42                                    // largeur du bout
const SH     = 13                                    // hauteur du footbed (= top de la semelle)
const D      = Math.round((W - Wt) / 2 / Math.tan((60 * Math.PI) / 180))  // ≈16
const GAP    = 8                                     // écartement de la paire

// Profil de hauteur de l'enveloppe au point (x, z) — on utilise une fonction
// uniquement de z (top "plat" à chaque tranche transverse, varie longitudinalement)
const H_PEAK = 48                                    // hauteur totale au pic (sol → top)
const H_BACK = 15                                    // hauteur au talon arrière

function h_top(z: number): number {
  const t = (z + L / 2) / L                          // 0 = bout, 1 = talon
  if (t < 0.05) return SH + 25 + (H_PEAK - SH - 25) * (t / 0.05)
  if (t < 0.28) return H_PEAK                         // plateau du pic
  if (t < 0.92) {
    const u = (t - 0.28) / (0.92 - 0.28)
    return H_PEAK * (1 - Math.pow(u, 1.1)) + H_BACK * u
  }
  const u = (t - 0.92) / 0.08
  return H_BACK - (H_BACK - SH) * u                   // jusqu'au footbed au talon
}

// ── Empreinte hexagonale (shape XY ; X=largeur, Y=longueur dans le shape) ─────
const hexCorners: [number, number][] = [
  [-Wt / 2, -L / 2],                                 // p0 : bout gauche (toe-left)
  [+Wt / 2, -L / 2],                                 // p1 : bout droit
  [+W  / 2, -L / 2 + D],                             // p2 : épaulement droit
  [+W  / 2, +L / 2],                                 // p3 : talon droit
  [-W  / 2, +L / 2],                                 // p4 : talon gauche
  [-W  / 2, -L / 2 + D],                             // p5 : épaulement gauche
]

// Échantillonnage du périmètre avec subdivisions pour un bord supérieur lissé
const PER_EDGE_SUBDIV = [4, 4, 24, 4, 24, 4]         // [bout, ep.R, flanc.R, talon, flanc.L, ep.L]

const perimSamples: [number, number][] = (() => {
  const out: [number, number][] = []
  for (let e = 0; e < 6; e++) {
    const p = hexCorners[e]
    const q = hexCorners[(e + 1) % 6]
    const N = PER_EDGE_SUBDIV[e]
    for (let s = 0; s < N; s++) {
      const t = s / N
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }
  return out
})()

// Foot well outline (ovale)
const WELL_CENTER_Z = -L / 2 + L * 0.60              // centre 60% depuis le bout
const WELL_RX       = W * 0.28
const WELL_RZ       = L * 0.26
const N_WELL        = 36

const wellSamples: [number, number][] = (() => {
  const out: [number, number][] = []
  for (let i = 0; i < N_WELL; i++) {
    const a = (i / N_WELL) * Math.PI * 2
    out.push([WELL_RX * Math.cos(a), WELL_CENTER_Z + WELL_RZ * Math.sin(a)])
  }
  // hexCorners + perimSamples sont CCW dans shape XY ; pour un trou, ordre inverse
  return out.reverse()
})()

// ── Construction de l'enveloppe (BufferGeometry unique) ───────────────────────
const shoeGeo = (() => {
  const verts: number[] = []
  const idx:   number[] = []

  const N_PERIM = perimSamples.length

  // (A) Face inférieure (hexagone à y=0, normale -Y) — fan depuis p0
  const botStart = verts.length / 3
  for (const [x, z] of hexCorners) verts.push(x, 0, z)
  for (let k = 1; k < 5; k++) idx.push(botStart, botStart + k + 1, botStart + k)

  // (B) Murs latéraux : bas (y=0) + haut (y=h_top(z))
  const latBotStart = verts.length / 3
  for (const [x, z] of perimSamples) verts.push(x, 0, z)
  const latTopStart = verts.length / 3
  for (const [x, z] of perimSamples) verts.push(x, h_top(z), z)
  for (let i = 0; i < N_PERIM; i++) {
    const next = (i + 1) % N_PERIM
    const bL = latBotStart + i,   bR = latBotStart + next
    const tL = latTopStart + i,   tR = latTopStart + next
    idx.push(bL, tL, tR)
    idx.push(bL, tR, bR)
  }

  // (C) Surface supérieure : hex avec trou ovale, triangulée par ShapeUtils
  // Contour + hole en Vector2 (shape XY = scene X et Z)
  const contourV2 = perimSamples.map(([x, z]) => new THREE.Vector2(x, z))
  const holeV2    = wellSamples.map(([x, z])  => new THREE.Vector2(x, z))
  const tris      = THREE.ShapeUtils.triangulateShape(contourV2, [holeV2])

  // Ajout des vertices "soulevés" : périmètre puis rim du foot well
  const topPerimStart = verts.length / 3
  for (const [x, z] of perimSamples) verts.push(x, h_top(z), z)
  const wellRimStart = verts.length / 3
  for (const [x, z] of wellSamples) verts.push(x, h_top(z), z)

  // Mapping des indices 2D → indices 3D
  const map = (j: number) => j < N_PERIM
    ? topPerimStart + j
    : wellRimStart + (j - N_PERIM)

  for (const t of tris) idx.push(map(t[0]), map(t[1]), map(t[2]))

  // (D) Parois verticales du foot well : rim (y=h_top(z)) → footbed (y=SH)
  const wellFloorStart = verts.length / 3
  for (const [x, z] of wellSamples) verts.push(x, SH, z)
  for (let i = 0; i < N_WELL; i++) {
    const next = (i + 1) % N_WELL
    const tL = wellRimStart   + i, tR = wellRimStart   + next
    const bL = wellFloorStart + i, bR = wellFloorStart + next
    idx.push(tL, bL, bR)
    idx.push(tL, bR, tR)
  }

  // (E) Sol du foot well : fan depuis le centre (y=SH, normale +Y)
  const wellCenterIdx = verts.length / 3
  verts.push(0, SH, WELL_CENTER_Z)
  for (let i = 0; i < N_WELL; i++) {
    const next = (i + 1) % N_WELL
    idx.push(wellCenterIdx, wellFloorStart + next, wellFloorStart + i)
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
})()

// ── Une mule ──────────────────────────────────────────────────────────────────
// mirror : true = chaussure droite (scale.x = -1 = détails latéraux inversés)
function ShoeMule({ xOff, mirror }: { xOff: number; mirror: boolean }) {
  const toeZ = -L / 2

  return (
    <group position={[xOff, 0, 0]} scale={[mirror ? -1 : 1, 1, 1]}>

      {/* ── Enveloppe de la chaussure (semelle + upper hex + foot well) ── */}
      <mesh geometry={shoeGeo} material={matEnv} castShadow receiveShadow />

      {/* ── Footbed coloré sur le sol du foot well (cosmétique) ── */}
      <mesh
        position={[0, SH + 0.15, WELL_CENTER_Z]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={matBed}
        receiveShadow
      >
        <ringGeometry args={[0, WELL_RX - 1, 32, 1, 0, Math.PI * 2]} />
      </mesh>

      {/* ── Sipes transverses sous la semelle (traction) ── */}
      {Array.from({ length: 9 }, (_, i) => {
        const z = toeZ + 20 + (i / 8) * (L - 42)
        return (
          <mesh key={`sipe${i}`} position={[0, 0.6, z]} material={matDark} receiveShadow>
            <boxGeometry args={[W - 16, 1.5, 2.6]} />
          </mesh>
        )
      })}

      {/* ── 2 fentes d'aération sur le flanc medial (zone arche) ── */}
      <mesh position={[W / 2 - 1, SH + 18, -L / 2 + L * 0.45]} material={matDark}>
        <boxGeometry args={[3, 8, 22]} />
      </mesh>
      <mesh position={[W / 2 - 1, SH + 18, -L / 2 + L * 0.55]} material={matDark}>
        <boxGeometry args={[3, 8, 22]} />
      </mesh>

      {/* ── Logo Jumpman embossé sur le footbed (à l'arrière du foot well) ── */}
      <mesh
        position={[0, SH + 0.4, WELL_CENTER_Z + WELL_RZ * 0.55]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={matDark}
      >
        <circleGeometry args={[7, 24]} />
      </mesh>
    </group>
  )
}

// ── Export : paire de mules ───────────────────────────────────────────────────
export function JordanHexMule({ onSize }: SceneItemProps) {
  const groupRef = useRef<THREE.Group>(null!)

  useLayoutEffect(() => {
    groupRef.current.updateMatrixWorld(true)
    onSize(new THREE.Box3().setFromObject(groupRef.current).getSize(new THREE.Vector3()))
  }, [])

  const xOff = W / 2 + GAP / 2

  return (
    <group ref={groupRef}>
      <ShoeMule xOff={-xOff} mirror={false} />
      <ShoeMule xOff={+xOff} mirror={true} />
    </group>
  )
}
