const fs = require('fs');

const path = 'src/features/scene/Walker.tsx';
const lines = fs.readFileSync(path, 'utf-8').split('\n');

// We know the duplicate animGltfs starts at line 102 (1-indexed, so index 101)
// Let's find the start index
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const animGltfs: Record<string, any> = useMemo(() => ({')) {
    startIndex = i;
    break;
  }
}

if (startIndex !== -1) {
  // Find the end of this useMemo which ends with ']);' on a line
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].includes(']);')) {
      endIndex = i;
      break;
    }
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex + 1);
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Removed duplicate animGltfs');
} else {
  console.log('Could not find duplicate animGltfs');
}
