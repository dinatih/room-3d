const fs = require('fs');
let code = fs.readFileSync('src/features/scene/Placements.tsx', 'utf-8');

const ikeaItems = [
  'Kallax', 'CuisineGroup', 'CuisineDrona', 'CuisineLillhavet', 'BathroomCabinet',
  'Toilet', 'TradfriBulb', 'Shower', 'VasqueSdb', 'WaterHeater',
  'GrassRug', 'CorridorCloset', 'SdbCloset', 'Utaker', 'Bollsidan', 'Fniss',
  'LackShelf', 'LampOla', 'Mackapar', 'MuligRail', 'Smorkull', 'Grejig', 'Vihals'
];

// Instead of parsing, we can just replace `animUnit: true` with `animUnit: true, isIkea: true` 
// on the lines where these components are used... but wait, the group wraps the component!
// The component is on the next line or same line.
