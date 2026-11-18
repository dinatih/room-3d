import './devLog';
import './dracoSetup';
import { createRoot } from 'react-dom/client';
import '../scss/app.scss';
import { LaraOutfitComparison } from './features/lara-outfit-comparison/LaraOutfitComparison';
createRoot(document.getElementById('root')!).render(<LaraOutfitComparison />);
