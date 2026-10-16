export interface BnfMarkerCoords {
  azimuth: number;
  elevation: number;
  radius: number;
}

export const DEFAULT_BNF_COORDS: Readonly<BnfMarkerCoords> = {
  azimuth: 154.3,
  elevation: -1.5,
  radius: 30,
};
