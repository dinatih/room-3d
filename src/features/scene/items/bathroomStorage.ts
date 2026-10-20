import { BATH_WEST_WALL, BATH_EAST_WALL, BATH_NORTH_WALL } from '../wallData';

export const BATHROOM_BOX_APPROACH = 75;
const CABINET_HEIGHT = 60;
const DRONA_HEIGHT = 33;
export const BATHROOM_STORAGE_ITEMS = {
  'bathroom-cabinet-west': {
    label: 'Armoire SDB Ouest', action: 'cbnWest', animationPrefix: 'drona-bath-cabinet-west',
    position: [BATH_WEST_WALL + 20, 0, BATH_NORTH_WALL + 19.5] as [number, number, number],
    rotationY: 0, cabinetId: 'bathroom-cabinet-west', kind: 'cabinet',
  },
  'bathroom-cabinet-east': {
    label: 'Armoire SDB Est', action: 'cbnEast', animationPrefix: 'drona-bath-cabinet-east',
    position: [BATH_EAST_WALL - 23, 0, BATH_NORTH_WALL + 19.5] as [number, number, number],
    rotationY: 0, cabinetId: 'bathroom-cabinet-east', kind: 'cabinet',
  },
  'drona-bathroom-west': {
    label: 'Dröna SDB Ouest', action: 'drona-bathroom-west-slide', animationPrefix: 'drona-bath-box',
    position: [BATH_WEST_WALL + 20, CABINET_HEIGHT + DRONA_HEIGHT / 2 + 0.2, BATH_NORTH_WALL + 19.5] as [number, number, number],
    rotationY: Math.PI, cabinetId: 'bathroom-cabinet-west', kind: 'box',
  },
  'drona-bathroom-east': {
    label: 'Dröna SDB Est', action: 'drona-bathroom-east-slide', animationPrefix: 'drona-bath-box',
    position: [BATH_EAST_WALL - 23, CABINET_HEIGHT + DRONA_HEIGHT / 2 + 0.2, BATH_NORTH_WALL + 19.5] as [number, number, number],
    rotationY: Math.PI, cabinetId: 'bathroom-cabinet-east', kind: 'box',
  },
};
