const fs = require('fs');
let code = fs.readFileSync('src/features/scene/Walker.tsx', 'utf8');

code = code.replace(/customIdleAnimPath\s*\??\s*:\s*string\s*\|\s*string\[\];/g, 'customIdleAnimPath?: string;');

code = code.replace(/customIdleAnimPath:\s*\[([\s\S]*?)\]/g, (match, p1) => {
  const items = p1.split(',').map(s => s.trim()).filter(s => s.startsWith("'") || s.startsWith('"'));
  if (items.length > 0) {
    return `customIdleAnimPath: (() => { const anims = [${items.join(', ')}]; return anims[Math.floor(Math.random() * anims.length)]; })()`;
  }
  return match;
});

fs.writeFileSync('src/features/scene/Walker.tsx', code);
