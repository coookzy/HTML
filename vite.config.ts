import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages project site path: https://coookzy.github.io/HTML/
  base: '/HTML/',
  build: {
    // Keep production artifacts in docs/ so Pages can deploy from main/docs.
    outDir: 'docs',
    emptyOutDir: true,
  },
})
