import { createContext, useContext } from 'react';
/** Zone previews render the same placements but must not write to the main navigation world. */
export const NavigationEnabledContext = createContext(true);
export const useNavigationEnabled = () => useContext(NavigationEnabledContext);
