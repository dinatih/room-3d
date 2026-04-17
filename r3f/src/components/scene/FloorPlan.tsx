/**
 * FloorPlan.tsx — plan 2D, port direct de js/ui/floorplan.js.
 * Appelé via primitive object — buildFloorPlan() est synchrone (canvas text).
 */
import { useMemo } from 'react';

import { buildFloorPlan } from '@data/floorplan';

export function FloorPlan() {
  const group = useMemo(() => buildFloorPlan(), []);
  return <primitive object={group} />;
}
