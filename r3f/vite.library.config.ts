/**
 * Vite config pour le build en mode librairie.
 * Produit js/lib/inventoryPreview.js — importé par js/ui/inventory.js.
 *
 * `three` est externalisé pour partager la même instance que lego-room.html
 * (chargé via importmap CDN).
 *
 * Usage : npm run build:lib
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@data':   path.resolve(__dirname, '../js/ui'),
      '@config': path.resolve(__dirname, '../js/config.js'),
    },
  },
  // Remplace process.env.NODE_ENV dans le bundle — non défini dans un navigateur
  // sans bundler (lego-room.html utilise un serveur HTTP simple, pas npm run dev)
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry:    path.resolve(__dirname, 'src/InventoryPreview.tsx'),
      name:     'InventoryPreview',
      fileName: 'inventoryPreview',
      formats:  ['es'],
    },
    rollupOptions: {
      // Ne pas bundler three — résolu via importmap dans lego-room.html
      external: ['three'],
    },
    outDir:      path.resolve(__dirname, '../js/lib'),
    emptyOutDir: false,
  },
});
