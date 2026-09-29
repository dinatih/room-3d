# Refactor HoverMenu.tsx — Duplicates & Dead Code

## File to modify
- `src/features/scene/HoverMenu.tsx`

## Related file (remove dead event handlers)
- `src/features/scene/character/SingleCharacter.tsx` (lines523-538)

---

##1. Remove dead code

### `lara-custom-*` (confirmed dead)
- **ACTIONS**: `lara-custom-holster` (L192), `lara-custom-pistols` (L193), `lara-custom-backpack` (L194) — no 3D object anywhere in the codebase (`.tsx`, `.gltf`, `.json`) sets `hoverAction` with these IDs. The buttons never appear.
- **SingleCharacter.tsx**: The3 `onToggle` handlers (L523-538) listen for these events but they're never dispatched. Remove them too.

### `select-walker` static entry (dead)
- ACTIONS `'select-walker'` (L185-188) is never used — scene objects use dynamic `select-walker-{id}` patterns which are handled by the `getActionDef` prefix logic (L215). The static entry is unreachable.

---

##2. Deduplicate mannequin ACTIONS

5 mannequin locations (`kallax-nw`, `kallax-ne`, `meubleT`, `lack`, `lamp`) each define the same4 actions:
- `random` — identical label
- `wig` — identical options (from `WIGS_ITEMS`)
- `color` — identical13-color array (minor order difference in `kallax-ne`)
- `wind` — identical label

**Extract a factory:**

```ts
const HAIR_COLORS = [
  { value: 'naturel', label: 'Naturel 🟫' },
  { value: 'noir', label: 'Noir ⚫' },
  // ... all13
];

function makeMannequinActions(loc: string): Record<string, ActionDef> {
  return {
    [`mannequin-${loc}-random`]: { btnLabel: '🎲 Aléatoire complet', toggleKey: `mannequin-${loc}-random` },
    [`mannequin-${loc}-wig`]:   { btnLabel: 'Perruque 💇', toggleKey: `mannequin-${loc}-wig`, type: 'select', options: mappedWigOptions },
    [`mannequin-${loc}-color`]: { btnLabel: 'Couleur cheveux 🎨', toggleKey: `mannequin-${loc}-color`, type: 'select', options: HAIR_COLORS },
    [`mannequin-${loc}-wind`]:  { btnLabel: 'Vent 💨', toggleKey: `mannequin-${loc}-wind` },
  };
}
```

Then:
```ts
const ACTIONS: Record<string, ActionDef> = {
  ...makeMannequinActions('kallax-nw'),
  ...makeMannequinActions('kallax-ne'),
  ...makeMannequinActions('meubleT'),
  ...makeMannequinActions('lack'),
  ...makeMannequinActions('lamp'),
  // ... remaining non-mannequin actions unchanged
};
```

This eliminates ~100 lines of near-identical config (5×20 lines →1 factory +5 one-liners).

---

##3. Deduplicate position-label helpers

3 action entries share identical position-label logic:

```ts
'desk1-position': { btnLabel: () => { const p = positionState['desk1-position']; return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'desk1-position' },
'desk2-position': { btnLabel: () => { const p = positionState['desk2-position']; return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position'; }, toggleKey: 'desk2-position' },
'smorkull-position': { ... },
'airperformer-position': { ... },
'raskog-large-position': { ... },
```

Extract:
```ts
function makePositionAction(key: string): ActionDef {
  return {
    btnLabel: () => {
      const p = positionState[key];
      return p ? `Position ${p.idx + 1}/${p.total}` : 'Changer position';
    },
    toggleKey: key,
  };
}
```

Usage: `...makePositionAction('desk1-position'),` etc.

---

##4. Remove dead `ground-type-cycle` hover action

`BermudaGround.tsx` sets `hoverAction: { actionId: 'ground-type-cycle' }` on ground meshes, but `ground-type-cycle` is NOT in the ACTIONS dict — so the hover button never appears. Since it was never accessible, remove the `hoverAction` from the ground meshes entirely.

**File:** `src/features/scene/building/BermudaGround.tsx` (lines85,154)
- Remove the `hoverAction` key from `userData` on both ground mesh groups.

Note: the `triggerAction('ground-type-cycle')` in useSceneStore.ts and the side-panel button (`InteractiveSection.tsx`) remain — those work independently of the hover system.

---

## Summary of changes

| What | Lines removed (approx) | Lines added (approx) |
|------|----------------------|---------------------|
| Remove `lara-custom-*` from ACTIONS |3 |0 |
| Remove `select-walker` static entry |4 |0 |
| Remove dead `onToggle` handlers in SingleCharacter |16 |0 |
| Extract `makeMannequinActions` factory + `HAIR_COLORS` |~100 |~20 |
| Extract `makePositionAction` helper |~10 |~7 |
| Remove dead `ground-type-cycle` hoverAction from BermudaGround |~2 |0 |
| **Net** | **~135** | **~27** |

## Verification
- Run `npm run dev` (or equivalent) and open the app
- Hover each mannequin head — confirm4 buttons still appear (random, wig, color, wind)
- Click the color select — confirm all13 options render
- Hover the ground — confirm no hover button appears (dead code removed)
- Confirm no `lara-custom-*` buttons appear anywhere
- Run `tsc --noEmit` to verify no type errors
