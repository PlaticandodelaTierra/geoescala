import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Ruta del sitio para el servidor local (npm run dev / preview). En GitHub Pages, el workflow
  // (.github/workflows/deploy.yml) compila con --base /<nombre-del-repositorio>/.
  base: '/geoescala/',

  test: {
    include: ['tests/**/*.test.js'],
    // Mientras no existan pruebas, `npm test` no debe fallar.
    passWithNoTests: true,
  },
});
