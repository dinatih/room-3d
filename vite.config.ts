import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';


// Auto-copy generated images on Vite startup
try {
  const srcDir = '/home/dinatih/.gemini/antigravity-cli/brain/c876eb68-1065-4a92-b783-2759df178247';
  const destDir = path.resolve(__dirname, 'public/media/photos/temu');
  const files = [
    { src: 'summer_boot_side_1779935246897.png', dest: 'summer-boot-1.png' },
    { src: 'summer_boot_front_1779935262721.png', dest: 'summer-boot-2.png' },
    { src: 'summer_boot_threequarter_1779935279537.png', dest: 'summer-boot-3.png' },
    { src: 'winter_boot_side_1779935296690.png', dest: 'winter-boot-1.png' },
    { src: 'winter_boot_front_1779935313025.png', dest: 'winter-boot-2.png' },
    { src: 'winter_boot_threequarter_1779935329633.png', dest: 'winter-boot-3.png' }
  ];

  if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
  }

  files.forEach(f => {
    const srcPath = path.join(srcDir, f.src);
    const destPath = path.join(destDir, f.dest);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[AutoCopy] Copied ${f.src} to ${f.dest}`);
    }
  });
} catch (err) {
  console.error('[AutoCopy] Error copying images:', err);
}

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@':         path.resolve(__dirname, 'src'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared':   path.resolve(__dirname, 'src'),
      '@config':   path.resolve(__dirname, 'src/features/scene/config.ts'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        inventory: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
