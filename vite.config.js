import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the same build works on GitHub Pages under
// any repo name (yourname.github.io/<repo>/) or a custom domain.
export default defineConfig({
  base: './',
  plugins: [react()],
})
