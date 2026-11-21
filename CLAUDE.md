# GeoEscala — Escala de tiempo geológico para figuras

> Repositorio: https://github.com/PlaticandodelaTierra/geoescala · App: https://platicandodelatierra.github.io/geoescala/
> Si el nombre cambia, actualizar aquí, en `package.json`, `CITATION.cff`, `src/acerca.js` y los README.

## Qué es

Aplicación web **sin instalación** (sitio estático en GitHub Pages) que genera barras de la escala de tiempo
geológico con los **colores y edades oficiales de la ICS**, listas para insertar en figuras de tesis y artículos.
El usuario elige un intervalo (p. ej. Mioceno–Reciente), los rangos a mostrar (eón, era, periodo, época, edad),
la orientación y el tamaño físico en mm, y descarga SVG, PNG o PDF.

## Público y principios

- Estudiantes de licenciatura y posgrado en ciencias de la Tierra, sin conocimientos de programación.
- **Español primero**, inglés como segunda lengua (interfaz y nombres de unidades).
- **Cero instalación, cero servidor**: todo corre en el navegador.
- **Calidad de publicación**: tamaños en mm según columnas de revista, texto editable en SVG, 300/600 dpi en PNG.
- **Datos trazables**: cada figura indica la versión de la carta usada. Nunca inventar ni redondear edades.
- Interfaz simple: una columna de controles a la izquierda y la vista previa en vivo a la derecha.

## Precedente y diferenciación

El paquete de R `deeptime` (Gearty) ya añade escalas de tiempo a gráficas de ggplot2, pero requiere programar
y usa la carta v2024/12. GeoEscala se diferencia por ser sin código, en español, con la carta vigente y con
exportación directa de una barra independiente. Citar `deeptime` en el README como trabajo relacionado.

## Stack

- Vite + JavaScript (ES modules), sin framework. HTML/CSS simples.
- Renderizado en **SVG** generado a mano (sin D3, salvo que se justifique).
- Exportación: SVG nativo; PNG vía canvas; PDF con `jspdf` + `svg2pdf.js`.
- Pruebas: Vitest.
- Despliegue: GitHub Actions → GitHub Pages.
- Mantener las dependencias al mínimo. Preguntar antes de añadir una nueva.

## Estructura de carpetas

```
/
├── CLAUDE.md
├── README.md / README.es.md
├── CITATION.cff
├── LICENSE                    # MIT para el código
├── index.html
├── vite.config.js
├── referencias/               # PDFs de la carta ICS (NO se publican; están en .gitignore)
├── scripts/
│   ├── build-data.js          # descarga y arma data/ics.json (se corre a mano, no en el navegador)
│   └── carta-ics-2026-06.js   # transcripción de la carta ICS (edades, ±, ~, colores, nombres ES)
├── data/
│   ├── ics-2026-06.json       # datos finales verificados (sí se versionan)
│   └── CHANGELOG-datos.md     # qué se cambió respecto a la fuente y por qué
├── src/
│   ├── main.js                # arranque y estado de la app
│   ├── state.js               # estado único + suscripción a cambios
│   ├── data.js                # carga y consultas (por rango, por nombre, hijos de una unidad)
│   ├── layout.js              # cálculo de geometría (puro, sin DOM) → fácil de probar
│   ├── render-svg.js          # geometría → SVG string
│   ├── labels.js              # ajuste de etiquetas: completo → abreviado → oculto; contraste
│   ├── export.js              # SVG / PNG / PDF
│   ├── i18n.js                # textos de interfaz ES/EN
│   └── ui/                    # controles del panel
└── tests/
    ├── data.test.js
    ├── layout.test.js
    └── labels.test.js
```

## Datos

### Fuente y versión

- Versión objetivo: **ICS International Chronostratigraphic Chart v2026/06**
  (https://stratigraphy.org/chart). Cita: Cohen, K.M., Harper, D.A.T., Gibbard, P.L. & Car, N. (2025).
  The ICS international chronostratigraphic chart this decade. *Episodes* 48(1): 105–115.
  https://doi.org/10.18814/epiiugs/2025/025001
- Base de partida: API de Macrostrat (`https://macrostrat.org/api/v2/defs/intervals?timescale=international%20ages`,
  y equivalentes para `epochs`, `periods`, `eras`, `eons`), que da nombre, edades, abreviatura y color hex.
- **Macrostrat puede no estar actualizado a v2026/06.** Después de descargar, comparar cada límite contra el PDF
  de `referencias/` y corregir. La versión 2026/06 modificó edades de tres pisos (dos del Triásico y uno del Pérmico).
  Registrar cada corrección en `data/CHANGELOG-datos.md`.
- Nombres en español: tomarlos de la versión en español (americano) de la carta ICS en `referencias/`.
- **Si hay duda sobre una edad o un nombre, NO adivinar: marcarlo con `"revisar": true` y avisarme.**

### Esquema de `data/ics-2026-06.json`

```json
{
  "version": "2026/06",
  "fuente": "ICS International Chronostratigraphic Chart",
  "cita": "Cohen et al. (2025) Episodes 48(1):105-115",
  "unidades": [
    {
      "id": "piso-aquitaniano",
      "rango": "edad",                 // eon | era | periodo | epoca | edad
      "nombre_en": "Aquitanian",
      "nombre_es": "Aquitaniano",
      "abrev": "Aq",
      "base_ma": 23.04,                // edad de la base (más antigua)
      "base_texto": "23.04",           // la misma edad tal como la imprime la carta (con ceros finales: "66.00")
      "techo_ma": 20.45,               // edad del techo (más joven)
      "incertidumbre_ma": null,        // ± de la base, si la carta la da
      "incertidumbre_texto": null,     // el mismo ± tal como lo imprime la carta ("1.0")
      "aproximada": false,             // true si la carta usa "~" en la base
      "informal": false,               // true para unidades sin nombre (p. ej. "Stage 2" del Cámbrico) → cursivas
      "color": "#FFFF00",
      "padre": "epoca-mioceno"
    }
  ]
}
```

### Particularidades geológicas que el código debe manejar

- El Precámbrico no tiene épocas ni edades formales; el Arqueano tiene eras pero no periodos. Cuando falta un rango,
  la celda del rango superior **se extiende** para cubrir el hueco (como en la carta oficial), en lugar de dejarlo vacío.
- Unidades informales del Cámbrico (Serie 2, Pisos 2, 3, 4 y 10): mostrar en cursivas.
- Edades aproximadas (`~`) y con incertidumbre (`±`): opción para mostrarlas en las etiquetas de límites.
- Terminología: opción **cronoestratigráfica** (Inferior/Medio/Superior, Serie/Piso) vs **geocronológica**
  (Temprano/Medio/Tardío, Época/Edad). Por defecto, cronoestratigráfica, como la carta ICS.
- El Holoceno tiene tres edades (Groenlandiano, Norgripiano, Megalayiano), todas muy cortas: probar que su escala uniforme se vea bien.

## Funciones de la versión 1.0

- [x] Elegir el intervalo **por edad** (de X a Y Ma) o **por nombre** (de la unidad A a la B, con buscador).
- [x] Activar o desactivar rangos: eón, era, periodo, época, edad.
- [x] Orientación horizontal o vertical. En vertical, lo más antiguo abajo (opción de invertir).
- [x] Escala **proporcional** (lineal en Ma) o **uniforme** (cada unidad del rango más fino con el mismo tamaño).
- [x] Tamaño físico en mm con atajos: 1 columna (~85 mm), 1.5 columnas (~120 mm), 2 columnas (~175 mm), personalizado.
- [x] Eje de edades (Ma) con marcas automáticas o a intervalos definidos; mostrar u ocultar edades de los límites.
- [x] Etiquetas: idioma ES/EN; nombre completo → abreviatura → oculto, según el espacio disponible; rotación en celdas angostas;
      color del texto (blanco o negro) automático según el contraste con el fondo.
- [x] Tipografía: Arial/Helvetica (o la sans-serif del sistema); tamaño de fuente configurable en pt.
- [x] Opción de escala de grises (para revistas en blanco y negro).
- [x] Pie de figura con la versión de la carta: "Edades y colores: ICS v2026/06".
- [x] Exportar SVG (texto editable), PNG (300/600 dpi, fondo transparente opcional) y PDF vectorial.
- [x] Botón "Copiar cita" (carta ICS + GeoEscala).
- [x] Interfaz bilingüe ES/EN; el idioma se recuerda en `localStorage` (envuelto en try/catch).
- [x] La configuración se guarda en la URL (parámetros), para compartir una escala exacta con un enlace.

## Fuera del alcance de v1.0 (ideas para v1.1+)

- Graficar datos del usuario sobre la escala (edades de muestras con barras de error desde CSV).
- Marcar eventos (extinciones, etc.) o resaltar intervalos.
- Escalas regionales o de polaridad magnética.
- Mostrar el estatus de GSSP.

## Reglas de código

- Funciones pequeñas y puras en `layout.js` y `labels.js`: reciben datos y opciones y regresan geometría. Sin DOM.
- Comentarios en español. Nombres de variables en inglés o español, pero consistentes dentro de cada archivo.
- Nada de llamadas a internet desde la app publicada: los datos van empaquetados en el JSON.
- Accesibilidad: controles con `<label>`, navegables con teclado, contraste AA en la interfaz.
- Antes de cada fase, mostrarme el plan y esperar mi aprobación. Al terminar una fase, correr las pruebas y resumir qué cambió.

## Pruebas mínimas (Vitest)

- **Datos**: no hay huecos ni traslapes entre unidades del mismo rango; cada hijo cae dentro de su padre;
  `base_ma > techo_ma`; todos los colores son hex válidos; cada unidad tiene nombre en ES y EN.
- **Datos (valores de control)**: verificar contra la carta un conjunto fijo de límites
  (p. ej. base del Cenozoico 66.0 Ma, base del Cuaternario 2.58 Ma, base del Cámbrico 538.8 Ma, base del Holoceno 0.0117 Ma).
  Confirmar estos valores contra el PDF de v2026/06 antes de fijarlos en la prueba.
- **Layout**: un intervalo recortado produce celdas que llenan exactamente el ancho o alto solicitado;
  la conversión mm → px → dpi es correcta.
- **Etiquetas**: elige abreviatura u oculta la etiqueta cuando no cabe; el contraste elige blanco o negro correctamente.

## Despliegue

- `vite.config.js` con `base: '/geoescala/'` para el servidor local; en Pages, el workflow compila con `--base /<nombre-del-repo>/`, así que un cambio de nombre del repositorio no requiere tocarlo.
- Workflow `.github/workflows/deploy.yml`: build y publicación en GitHub Pages en cada push a `main`.

## README (cuando la app funcione)

- GIF corto de uso, botón "Abrir la app", capturas de 2–3 figuras de ejemplo.
- Sección "Cómo citar" (CITATION.cff + DOI de Zenodo cuando exista) y la cita de la carta ICS.
- Sección "Trabajo relacionado" (`deeptime`).
- Sección "Otras herramientas del autor" (dejar un espacio para BIRDS).
- Topics del repo: `geology`, `earth-science`, `geologic-time-scale`, `stratigraphy`, `education`, `spanish`, `scientific-figures`.

## Fases

1. **Datos**: `scripts/build-data.js`, JSON verificado, `CHANGELOG-datos.md`, pruebas de datos.
2. **Render básico**: layout + SVG horizontal y vertical con valores fijos; vista previa en `index.html`.
3. **Controles**: panel de opciones, estado, parámetros en la URL.
4. **Etiquetas y eje**: ajuste de etiquetas, contraste, eje de edades, cursivas, terminología.
5. **Exportación**: SVG, PNG y PDF con tamaños físicos correctos.
6. **Bilingüe y pulido**: i18n, accesibilidad, diseño.
7. **Publicación**: workflow de Pages, README, CITATION.cff, licencia.

## Comandos

- `npm install`: instalar dependencias
- `npm run dev`: servidor local
- `npm test`: pruebas
- `npm run build`: compilar a `dist/`
- `node scripts/build-data.js`: regenerar los datos (requiere internet)
