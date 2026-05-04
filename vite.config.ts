import { defineConfig } from 'vite'

export default defineConfig({
  // Custom domain: moonsys.fun
  base: '/',
  build: {
    // Keep production artifacts in docs/ so Pages can deploy from main/docs.
    outDir: 'docs',
    emptyOutDir: true,
  },
})
