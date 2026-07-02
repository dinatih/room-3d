import fs from 'fs';

function getBonesFromGLB(filePath) {
  const glb = fs.readFileSync(filePath);
  const jsonLength = glb.readUInt32LE(12);
  const jsonBuffer = glb.subarray(20, 20 + jsonLength);
  const json = JSON.parse(jsonBuffer.toString('utf8'));

  let jointNodes = new Set();
  if (json.skins) {
    json.skins.forEach(skin => {
      skin.joints.forEach(j => jointNodes.add(j));
    });
  }

  const bones = [];
  jointNodes.forEach(jIdx => {
    const node = json.nodes[jIdx];
    if (node) {
      bones.push(node.name || `Node_${jIdx}`);
    }
  });
  return bones;
}

const nativeBones = getBonesFromGLB('/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb');

// Strip prefixes
let cleanBones = nativeBones.map(b => b.replace(/^mixamorig_/, ''));

// Apply Spine renames
// 1. Remove spine_lower and spine_upper
cleanBones = cleanBones.filter(b => b !== 'spine_lower' && b !== 'spine_upper');

// 2. Add spine_1, spine_2, spine_3
cleanBones.push('spine_1');
cleanBones.push('spine_2');
cleanBones.push('spine_3');

// Add left and right clavicles (arm_left_shoulder_1 and arm_right_shoulder_1)
cleanBones.push('arm_left_shoulder_1');
cleanBones.push('arm_right_shoulder_1');

cleanBones.sort();

console.log(`Total Master Rig bones: ${cleanBones.length}`);

// Generate markdown table: 3 columns (Index, Bone Name, Description/Group)
let md = `#### Liste Complète des 91 Os du Master Rig (Standardisé)\n\n`;
md += `| N° | Nom de l'Os | Description / Localisation |\n`;
md += `| :--- | :--- | :--- |\n`;

cleanBones.forEach((bone, index) => {
  let desc = "Articulation corporelle standard";
  if (bone.includes('finger')) {
    const hand = bone.includes('left') ? 'gauche' : 'droite';
    const match = bone.match(/finger_(\d)(a|b|c)/);
    const fingerName = match ? (match[1] === '1' ? 'pouce' : match[1] === '2' ? 'index' : match[1] === '3' ? 'majeur' : match[1] === '4' ? 'annulaire' : 'auriculaire') : 'doigt';
    const segment = match ? (match[2] === 'a' ? 'phalange proximale' : match[2] === 'b' ? 'phalange moyenne' : 'phalange distale') : '';
    desc = `Main ${hand} : ${fingerName} (${segment})`;
  } else if (bone.includes('lip')) {
    desc = `Visage : Lèvre (${bone.includes('upper') ? 'supérieure' : 'inférieure'})`;
  } else if (bone.includes('eyebrow')) {
    desc = `Visage : Sourcil (${bone.includes('left') ? 'gauche' : 'droit'})`;
  } else if (bone.includes('eyelid')) {
    desc = `Visage : Paupière (${bone.includes('left') ? 'gauche' : 'droit'})`;
  } else if (bone.includes('eyeball')) {
    desc = `Visage : Globe oculaire (${bone.includes('left') ? 'gauche' : 'droit'})`;
  } else if (bone.includes('hair_ponytail')) {
    desc = `Cheveux : Queue de cheval (segment animable)`;
  } else if (bone.includes('spine')) {
    desc = `Colonne vertébrale (segment ${bone.split('_')[1]})`;
  } else if (bone.includes('shoulder_1')) {
    desc = `Épaule : Clavicule (${bone.includes('left') ? 'gauche' : 'droite'}) [Ajouté]`;
  } else if (bone.includes('shoulder_2')) {
    desc = `Épaule : Bras / Humérus (${bone.includes('left') ? 'gauche' : 'droite'})`;
  } else if (bone.includes('elbow')) {
    desc = `Coude / Avant-bras (${bone.includes('left') ? 'gauche' : 'droite'})`;
  } else if (bone.includes('wrist')) {
    desc = `Poignet / Main (${bone.includes('left') ? 'gauche' : 'droite'})`;
  } else if (bone.includes('thigh')) {
    desc = `Hanche / Cuisse (${bone.includes('left') ? 'gauche' : 'droite'})`;
  } else if (bone.includes('knee')) {
    desc = `Genou / Mollet (${bone.includes('left') ? 'gauche' : 'droite'})`;
  } else if (bone.includes('ankle')) {
    desc = `Cheville / Pied (${bone.includes('left') ? 'gauche' : 'droite'})`;
  } else if (bone.includes('toes')) {
    desc = `Orteils (${bone.includes('left') ? 'gauche' : 'droite'})`;
  } else if (bone.includes('weapon')) {
    desc = `Point d'attache d'arme (${bone.includes('left') ? 'gauche' : 'droite'})`;
  } else if (bone === 'pelvis') {
    desc = "Bassin (centre de gravité)";
  } else if (bone === 'root_hips') {
    desc = "Hanche racine";
  } else if (bone === 'root_ground') {
    desc = "Racine au sol";
  } else if (bone.includes('neck')) {
    desc = `Cou (${bone.includes('lower') ? 'bas' : 'haut'})`;
  } else if (bone === 'glasses') {
    desc = "Accessoire : Lunettes";
  }

  md += `| ${index + 1} | \`${bone}\` | ${desc} |\n`;
});

fs.writeFileSync('/home/dinatih/Projects/room-3d/scratch/bones_91_table.md', md);
console.log("Markdown table successfully written to scratch/bones_91_table.md");
