const OBJECT_ACTIONS: Record<string, readonly string[]> = {
  'utdrag10389142': ['utdrag'],
  'bollsidan30574370': ['desk-toggle'],
  'utaker-stack': ['bed-double', 'bed-position'],
  'armrest-sofa': ['sofa-arm-left', 'sofa-arm-right'],
  'vihals-chair': ['vihals-toggle'],
  'tv': ['tv-toggle', 'desk2-screen-toggle'],
  'scooter': ['scooter-steering-toggle'],
  'google-nest-mini': ['nestMini'],
  'cabinet-wood': ['cabinet'],
  'fridge': ['fridge', 'fridge-crisper-toggle'],
  'ninja-sp101': ['ninja'],
  'freezer': ['freezer'],
  'trash-bin': ['bin-toggle'],
  'bathroom-cabinet-west': ['cbnWest'],
  'bathroom-cabinet-east': ['cbnEast'],
  'shower': ['showerDoor'],
  'toilet': ['wc-lid-toggle', 'wc-seat-toggle', 'wc-flush'],
  'door-entry': ['entryDoor'],
  'door-living': ['livingDoor'],
  'door-sdb': ['bathroomDoor'],
  'door-glass': ['eastGlassDoor', 'glassDoorV2LeftOpen', 'glassDoorV2ShutterPos'],
  'corridor-closet': ['corrDoors'],
  'sdb-closet': ['sdbClosetL', 'sdbClosetR'],
  'laptop': ['desk2-screen-toggle'],
  'desk-bollsidan-1': ['desk1-toggle', 'desk1-position'],
  'desk-bollsidan-2': ['desk2-toggle', 'desk2-position', 'desk2-screen-toggle'],
  'air-performer': ['airPerformerPower', 'airPerformerMode', 'airPerformerSpeed', 'airperformer-position'],
};

/** Shared by scene hover menus, inventory filters and 3D previews. */
export function getObjectActionIds(objectId: string): readonly string[] {
  return OBJECT_ACTIONS[objectId] ?? [];
}
