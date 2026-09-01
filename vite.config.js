import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Pas de proxy dev ici : les appels /api sont servis par les fonctions serverless
// du dossier api/. En local, lancer `npx vercel dev` (et non `npm run dev`) pour
// avoir le front ET les fonctions sur le même port.
export default defineConfig({
  plugins: [vue()],
})
