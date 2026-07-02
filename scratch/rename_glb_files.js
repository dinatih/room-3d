import fs from 'fs';
import path from 'path';

const allLaraDir = 'public/media/all_lara';

const renames = [
  { old: 'lara_croft_zip.glb', new: '01_bikini.glb' },
  { old: 'lara_croft_red_dress.glb', new: '02_double_slit_dress.glb' },
  { old: 'lara_croft_dress_345.glb', new: '03_dress.glb' },
  { old: 'lara_croft_swim_gear_1.glb', new: '04_baywatch.glb' },
  { old: 'lara_croft_4259.glb', new: '05_crop_top_shorts.glb' },
  { old: 'lara_croft_43254_rigged.glb', new: '06_cap_sleeve_crop_top_shorts.glb' },
  { old: 'lara_original_88_bones.glb', new: '07_scoop_bodysuit_shorts.glb' },
  { old: 'lara_croft_3254_rigged.glb', new: '08_crew_neck_bodysuit_shorts.glb' },
  { old: 'lara_croft_543i.glb', new: '09_cap_sleeve_biketard.glb' },
  { old: 'lara_croft_swim_gear.glb', new: '10_long_sleeve_surfsuit.glb' },
  { old: 'lara_croft_black_tank_top.glb', new: '11.glb' },
  { old: 'lara_croft_4543.glb', new: '12_bodysuit_jeans.glb' },
  { old: 'lara_croft_spy_gear.glb', new: '13_3_4_sleeve_catsuit.glb' },
  { old: 'lara_croft_suit.glb', new: '14_business_suit.glb' },
  { old: 'lara_croft_motorcycle_gear.glb', new: '15_motorcycle.glb' },
  { old: 'lara_croft_brown_jacket.glb', new: '16_jacket_pants.glb' },
  { old: 'lara_croft_gold_shades.glb', new: '17_catsuit.glb' },
  { old: 'lara_croft_324_rigged.glb', new: '17_catsuit_mp5.glb' },
  { old: 'lara_croft_swim_gear_243.glb', new: '18_wetsuit.glb' }
];

console.log('=== Renaming GLB files ===');
renames.forEach(r => {
  const oldPath = path.join(allLaraDir, r.old);
  const newPath = path.join(allLaraDir, r.new);
  
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${r.old} -> ${r.new}`);
  } else if (fs.existsSync(newPath)) {
    console.log(`Already renamed: ${r.new}`);
  } else {
    console.error(`ERROR: GLB not found: ${oldPath}`);
  }
});
console.log('=== Done renaming GLB files ===');
