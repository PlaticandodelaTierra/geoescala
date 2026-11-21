# Cambios en los datos — carta ICS v2026/06

Este archivo registra en qué se aparta `data/ics-2026-06.json` de su base de partida (la API de
Macrostrat) y por qué. Cada cambio se tomó de la carta ICS v2026/06; nada se estimó ni se redondeó.

## Fuentes

- **Carta:** ICS International Chronostratigraphic Chart v2026/06. Cohen, K.M., Harper, D.A.T.,
  Gibbard, P.L. & Car, N. (2025). The ICS international chronostratigraphic chart this decade.
  *Episodes* 48(1): 105–115. https://doi.org/10.18814/epiiugs/2025/025001 (CC BY 4.0).
  Se usaron dos PDF, guardados en `referencias/` (no se versionan):
  - `ICS_Chart_2026-06_en.pdf`: carta oficial en inglés.
  - `ChronostratChart2026-06SpanishAmer.pdf`: versión en español de América (J. Gómez Tapias y
    J.C. Gutiérrez-Marco, Servicio Geológico Colombiano).
- **Base de partida:** API de Macrostrat v2, `defs/intervals` con las escalas `international eons`,
  `eras`, `periods`, `epochs` y `ages` (CC-BY 4.0). Descargada el 2026-11-16.
- **Transcripción de la carta:** `scripts/carta-ics-2026-06.js`. Es el registro versionado de lo que
  dice la carta; `scripts/build-data.js` la combina con Macrostrat y escribe el JSON.

## Cómo se verificó

1. De ambos PDF se extrajeron el texto, su posición y el color de relleno de cada celda. Cada edad
   numérica se asignó a la línea de límite donde está impresa.
2. Las dos versiones de la carta se compararon celda por celda (182 celdas, todos los límites). Los
   valores numéricos coinciden en todos los límites; solo hay 4 límites en que difieren el `~` o
   el `±` (ver [Límites en que las dos cartas no coinciden](#límites-en-que-las-dos-cartas-no-coinciden)).
   Esos 4 se revisaron también a ojo en recortes ampliados.
3. `node scripts/build-data.js` comparó cada unidad de la carta con Macrostrat y generó las tablas
   de abajo.

## Criterios

- **Edades, `±` y `~`:** de la carta. Si las dos versiones no coinciden, la unidad se marca con
  `"revisar": true` hasta que se decide qué versión usar; la decisión se registra aquí.
- **`incertidumbre_ma` y `aproximada`** se refieren a `base_ma`. El techo de una unidad es la base
  de la unidad más joven, con su propia incertidumbre.
- **`base_texto` e `incertidumbre_texto`** (agregados el 2026-11-18, Fase 4): la edad de la base y
  su `±` tal como los imprime la carta, con sus ceros finales (`"66.00"`, `"3.600"`, `"247.0"`,
  `± "1.0"`). Son los mismos números que `base_ma` e `incertidumbre_ma`; sirven para escribir las
  edades de los límites con la notación de la carta. Sin ellos se perderían los ceros finales de 20
  bases y de 4 incertidumbres (`± 1.0`). Al regenerar el JSON con estos campos, el resto quedó
  idéntico y las diferencias con Macrostrat no cambiaron.
- **Colores:** relleno de las celdas de la carta en inglés. Los de la versión en español son
  conversiones para impresión (p. ej., Cenozoico `#F8ED30` en vez de `#F2F91D`) y no se usaron.
- **Nombres en inglés:** los de la carta, con terminología cronoestratigráfica (Upper/Lower).
- **Nombres en español:** los de la versión en español de América.
- **Abreviaturas:** las de Macrostrat cuando existen (eones, eras, periodos y 6 épocas). Ninguna
  edad tiene abreviatura (`null`). La carta no publica abreviaturas; se decidirán en la Fase 4.
- **Rangos:** eón, era, periodo, época y edad. No se incluyen las subseries (I/M/S), los
  subsistemas (Misisipiano, Pensilvaniano) ni el supereón Precámbrico.
- **Unidades informales** (`informal: true`): las que la versión en español escribe en cursivas:
  Serie 2, Pisos 2, 3, 4 y 10, y el piso superior del Pleistoceno.
- **ids:** prefijo del rango (`eon-`, `era-`, `periodo-`, `epoca-`, `piso-`) más el nombre en
  español sin acentos. Si el nombre ya empieza con el prefijo no se repite (`piso-10`).

## Cambios de edades respecto a Macrostrat

Son los tres pisos que cambiaron en la v2026/06 (dos del Triásico y uno del Pérmico). Los demás
límites de Macrostrat coinciden con la carta.

| Límite | Macrostrat | Carta 2026/06 | Unidades afectadas |
| --- | --- | --- | --- |
| Base del Anisiano (= base del Triásico Medio) | 246.7 | 247.0 | `piso-anisiano` y `epoca-triasico-medio` (base); `piso-olenekiano` y `epoca-triasico-inferior` (techo) |
| Base del Olenekiano | 249.9 | 250.8 | `piso-olenekiano` (base); `piso-induano` (techo) |
| Base del Wuchiapingiano (= base del Lopingiano) | 259.51 | 259.857 ± 0.084 | `piso-wuchiapingiano` y `epoca-lopingiano` (base); `piso-capitaniano` y `epoca-guadalupiano` (techo) |

## Unidades agregadas

| id | Motivo |
| --- | --- |
| `eon-hadeano` | Macrostrat no lo incluye. Carta: 4567 a 4031 ± 3 Ma. |
| `epoca-pensilvaniano-superior`, `epoca-pensilvaniano-medio`, `epoca-pensilvaniano-inferior`, `epoca-misisipiano-superior`, `epoca-misisipiano-medio`, `epoca-misisipiano-inferior` | En la carta, las series del Carbonífero son Inferior, Medio y Superior de cada subsistema. |

## Unidades de Macrostrat que no se usan

| Rango en Macrostrat | Nombre | Motivo |
| --- | --- | --- |
| época | Pennsylvanian (323.4–298.9) | En la carta es un subsistema; sus series se agregaron como épocas. |
| época | Mississippian (358.86–323.4) | Ídem. |
| edad | Pridoli (422.7–419.62) | Duplicado de la serie Pridoliano, que no tiene pisos. En la carta, su celda ocupa las columnas de serie y de piso. |

## Nombres

- **Inglés:** Macrostrat usa terminología geocronológica (Late/Early); se cambió a la de la carta
  (Upper/Lower) en `epoca-cretacico-superior`, `epoca-cretacico-inferior`,
  `epoca-jurasico-superior`, `epoca-jurasico-inferior`, `epoca-triasico-superior`,
  `epoca-triasico-inferior`, `epoca-devonico-superior`, `epoca-devonico-inferior`,
  `epoca-ordovicico-superior`, `epoca-ordovicico-inferior` y `piso-pleistoceno-superior`
  (Late Pleistocene → Upper Pleistocene).
- **Español:** todos los nombres vienen de la versión en español de la carta. En particular:
  - Las edades del Holoceno son **Megalayiano, Norgripiano y Groenlandiano**.
  - La versión en español nombra las series solo como "Inferior", "Medio" o "Superior"; aquí se
    completan con el sistema que las contiene ("Cretácico Superior", "Devónico Medio") y, en el
    Carbonífero, con el subsistema ("Pensilvaniano Superior", "Misisipiano Inferior").
  - El piso superior del Pleistoceno no tiene nombre formal: en inglés es "Upper Pleistocene" y
    en español "Superior", en cursivas. Aquí se llama "Pleistoceno Superior" y es informal.
  - "Piso2" de la versión en español se escribe "Piso 2".
  - Los nombres de las eras partidos con guion en la carta ("Neo- proterozoico") se escriben
    juntos ("Neoproterozoico").

## Incertidumbres y aproximaciones

Macrostrat no las incluye. Todas vienen de la carta: 102 unidades tienen `incertidumbre_ma` y 18
tienen `aproximada: true`.

## Colores distintos a Macrostrat

| id | Macrostrat | Carta |
| --- | --- | --- |
| `eon-proterozoico` | #FF70B8 | #F73563 |
| `eon-arqueano` | #FF3399 | #F0047F |
| `era-neoproterozoico` | #FF9BCD | #FEB342 |
| `era-mesoproterozoico` | #FF7EBF | #FDB462 |
| `era-paleoproterozoico` | #E665A6 | #F74370 |
| `era-neoarqueano` | #FF5CAD | #F99BC1 |
| `era-mesoarqueano` | #E62E8A | #F768A9 |
| `era-paleoarqueano` | #CC297A | #F4449F |
| `era-eoarqueano` | #B2246B | #DA037F |
| `periodo-ediacariano` | #FFC3E1 | #FED96A |
| `periodo-criogeniano` | #FFAFD7 | #FECC5C |
| `periodo-toniano` | #FFA5D2 | #FEBF4E |
| `periodo-steniano` | #FFA5D2 | #FED99A |
| `periodo-ectasiano` | #FF98CC | #FDCC8A |
| `periodo-calymmiano` | #FF8BC5 | #FDC07A |
| `periodo-statheriano` | #EE93C1 | #F875A7 |
| `periodo-orosiriano` | #E874AF | #F76898 |
| `periodo-rhyaciano` | #EB84B8 | #F75B89 |
| `periodo-sideriano` | #E874AF | #F74F7C |
| `epoca-holoceno` | #FEF2E0 | #FEEBD2 |
| `epoca-pleistoceno` | #FFF2AE | #FFEFAF |
| `epoca-oligoceno` | #FDC07A | #FEC07A |
| `piso-megalayiano` | #FEF2E0 | #FDEDEC |
| `piso-norgripiano` | #FEF2E0 | #FDECE4 |
| `piso-groenlandiano` | #FEF2E0 | #FEECDB |
| `piso-pleistoceno-superior` | #FFF2C7 | #FFF2D3 |
| `piso-calabriano` | #FFF2C7 | #FFF2BA |
| `piso-lutetiano` | #FCB482 | #FDB482 |
| `piso-moscoviano` | #C7CBB9 | #B3CBB9 |
| `piso-famenniano` | #F2EDC5 | #F2EDB3 |

## Límites en que las dos cartas no coinciden

En estos 4 límites la edad numérica es la misma en las dos versiones de la carta, pero el `~` o
el `±` no coinciden. **Decisión (2026-11-16): se usa la versión en español en los 4.** Por eso
estos límites no se marcan como aproximados y la base del Silúrico lleva ± 0.9. Ninguna unidad
queda con `"revisar": true`.

| Límite | Carta en inglés | Versión en español (usada) | Unidades con esa base |
| --- | --- | --- | --- |
| Base del Jurásico | ~201.4 ± 0.2 | 201.4 ± 0.2 | `periodo-jurasico`, `epoca-jurasico-inferior`, `piso-hettangiano` |
| Base del Silúrico | 443.1 ± 1.0 | 443.1 ± 0.9 | `periodo-silurico`, `epoca-llandoveriano`, `piso-rhuddaniano` |
| Base del Ordovícico | ~486.85 ± 1.5 | 486.85 ± 1.5 | `periodo-ordovicico`, `epoca-ordovicico-inferior`, `piso-tremadociano` |
| Base del Cámbrico (= base del Fanerozoico y del Paleozoico) | ~538.8 ± 0.6 | 538.8 ± 0.6 | `eon-fanerozoico`, `era-paleozoico`, `periodo-cambrico`, `epoca-terreneuviano`, `piso-fortuniano` |

## Pendientes para otras fases

- **Abreviaturas (Fase 4):** faltan las de todas las edades y de 32 épocas. Steniano y
  Statheriano comparten "St" en Macrostrat.
