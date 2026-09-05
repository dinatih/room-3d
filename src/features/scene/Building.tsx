/**
 * Building.tsx — Coque architecturale fixe : murs, sol/plafond, miroirs.
 *
 * Façade de réexportation des modules découplés de src/features/scene/building/ :
 * - Walls (murs, piliers, linteaux, découpes diagonales)
 * - Floor (parquet, carrelage, plinthes, dalle béton, plafonds)
 * - Mirrors (miroirs Nissedal, réflecteurs Three.js)
 * - DoorsPlaced (portes en coordonnées monde)
 * - MergedStaticGroup (optimisation géométrique des draw calls)
 */
export * from './building';
