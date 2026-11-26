export const COOKING_DURATION = 15;
export const COOKING_RECIPES = ['rice', 'macaroni', 'semolina'] as const;
export type CookingRecipe = typeof COOKING_RECIPES[number];
export interface CookingSession { owner: string; recipe: CookingRecipe; elapsed: number }
export const kitchenCooking: { session: CookingSession | null } = { session: null };
export function startCooking(owner: string): CookingSession {
  if (kitchenCooking.session) {
    if (kitchenCooking.session.owner !== owner) throw new Error('La cuisine est déjà réservée');
    return kitchenCooking.session;
  }
  return kitchenCooking.session = { owner, recipe: COOKING_RECIPES[Math.floor(Math.random() * COOKING_RECIPES.length)], elapsed: 0 };
}
export function cancelCooking(owner: string) {
  if (kitchenCooking.session?.owner === owner) kitchenCooking.session = null;
}
export function advanceCooking(owner: string, seconds: number) {
  const session = kitchenCooking.session;
  if (!session || session.owner !== owner) throw new Error('Session de cuisine absente');
  session.elapsed = Math.min(COOKING_DURATION, session.elapsed + seconds);
  return session.elapsed === COOKING_DURATION;
}
