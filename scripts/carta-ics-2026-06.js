// Transcripción de la ICS International Chronostratigraphic Chart v2026/06.
//
// Es la fuente de verdad para edades, incertidumbres, aproximaciones, colores y nombres en
// español. scripts/build-data.js la combina con Macrostrat y escribe data/ics-2026-06.json.
//
// Fuentes (en referencias/, que no se versiona):
//   - ICS_Chart_2026-06_en.pdf: carta oficial en inglés (https://stratigraphy.org/chart).
//   - ChronostratChart2026-06SpanishAmer.pdf: versión en español de América
//     (J. Gómez Tapias y J.C. Gutiérrez-Marco; Servicio Geológico Colombiano).
//
// Cómo se transcribió: de los dos PDF se extrajeron el texto, su posición y el color de
// relleno de cada celda; cada edad numérica se asignó a la línea de límite donde está impresa
// y las dos versiones se compararon límite por límite. Los límites en que no coinciden se
// revisaron también a ojo, en recortes ampliados de ambas cartas.
//
// Campos:
//   rango      eon | era | periodo | epoca | edad
//   en, es     nombre en la carta en inglés y en la versión en español
//   techo      etiqueta del límite superior (más joven), tal como la imprimen las dos cartas
//   base       etiqueta del límite inferior (más antiguo), ídem
//              '~' = edad aproximada; '± x' = incertidumbre en Ma; '0' = actualidad
//   color      relleno de la celda en la carta en inglés
//   informal   true si la versión en español muestra la unidad en cursivas
//   revisar    (opcional) motivo de duda, si las dos cartas no coinciden y falta decidir
//
// Límites en que las dos cartas no coinciden (decidido el 2026-11-16: se usa la versión en
// español; ver data/CHANGELOG-datos.md):
//   - Base del Jurásico     inglés ~201.4 ± 0.2    español 201.4 ± 0.2    → 201.4 ± 0.2
//   - Base del Silúrico     inglés 443.1 ± 1.0     español 443.1 ± 0.9    → 443.1 ± 0.9
//   - Base del Ordovícico   inglés ~486.85 ± 1.5   español 486.85 ± 1.5   → 486.85 ± 1.5
//   - Base del Cámbrico     inglés ~538.8 ± 0.6    español 538.8 ± 0.6    → 538.8 ± 0.6
//
// Notas:
//   - En español, la carta nombra las series solo como "Inferior", "Medio" o "Superior";
//     aquí se completan con el sistema que las contiene (en el Carbonífero, con el
//     subsistema): "Cretácico Superior", "Pensilvaniano Medio".
//   - El piso superior del Pleistoceno no tiene nombre formal: la carta en inglés dice
//     "Upper Pleistocene" y la versión en español "Superior" (en cursivas).
//   - "Piso2" de la versión en español se escribe "Piso 2".
//   - No se incluyen subseries (I/M/S), subsistemas (Misisipiano, Pensilvaniano) ni el
//     supereón Precámbrico: no forman parte de los cinco rangos de la v1.0.

export const CARTA = {
  version: '2026/06',
  fuente: 'ICS International Chronostratigraphic Chart',
  cita: 'Cohen et al. (2025) Episodes 48(1):105-115',
  unidades: [
    // Eones
    { rango: 'eon', en: 'Phanerozoic', es: 'Fanerozoico', techo: '0', base: '538.8 ± 0.6', color: '#9AD9DD' },
    { rango: 'eon', en: 'Proterozoic', es: 'Proterozoico', techo: '538.8 ± 0.6', base: '2500', color: '#F73563' },
    { rango: 'eon', en: 'Archean', es: 'Arqueano', techo: '2500', base: '4031 ± 3', color: '#F0047F' },
    { rango: 'eon', en: 'Hadean', es: 'Hadeano', techo: '4031 ± 3', base: '4567', color: '#AE027E' },

    // Eras
    { rango: 'era', en: 'Cenozoic', es: 'Cenozoico', techo: '0', base: '66.00', color: '#F2F91D' },
    { rango: 'era', en: 'Mesozoic', es: 'Mesozoico', techo: '66.00', base: '251.902 ± 0.024', color: '#67C5CA' },
    { rango: 'era', en: 'Paleozoic', es: 'Paleozoico', techo: '251.902 ± 0.024', base: '538.8 ± 0.6', color: '#99C08D' },
    { rango: 'era', en: 'Neoproterozoic', es: 'Neoproterozoico', techo: '538.8 ± 0.6', base: '1000', color: '#FEB342' },
    { rango: 'era', en: 'Mesoproterozoic', es: 'Mesoproterozoico', techo: '1000', base: '1600', color: '#FDB462' },
    { rango: 'era', en: 'Paleoproterozoic', es: 'Paleoproterozoico', techo: '1600', base: '2500', color: '#F74370' },
    { rango: 'era', en: 'Neoarchean', es: 'Neoarqueano', techo: '2500', base: '2800', color: '#F99BC1' },
    { rango: 'era', en: 'Mesoarchean', es: 'Mesoarqueano', techo: '2800', base: '3200', color: '#F768A9' },
    { rango: 'era', en: 'Paleoarchean', es: 'Paleoarqueano', techo: '3200', base: '3600', color: '#F4449F' },
    { rango: 'era', en: 'Eoarchean', es: 'Eoarqueano', techo: '3600', base: '4031 ± 3', color: '#DA037F' },

    // Periodos
    { rango: 'periodo', en: 'Quaternary', es: 'Cuaternario', techo: '0', base: '2.58', color: '#F9F97F' },
    { rango: 'periodo', en: 'Neogene', es: 'Neógeno', techo: '2.58', base: '23.04', color: '#FFE619' },
    { rango: 'periodo', en: 'Paleogene', es: 'Paleógeno', techo: '23.04', base: '66.00', color: '#FD9A52' },
    { rango: 'periodo', en: 'Cretaceous', es: 'Cretácico', techo: '66.00', base: '143.1 ± 0.6', color: '#7FC64E' },
    { rango: 'periodo', en: 'Jurassic', es: 'Jurásico', techo: '143.1 ± 0.6', base: '201.4 ± 0.2', color: '#34B2C9' },
    { rango: 'periodo', en: 'Triassic', es: 'Triásico', techo: '201.4 ± 0.2', base: '251.902 ± 0.024', color: '#812B92' },
    { rango: 'periodo', en: 'Permian', es: 'Pérmico', techo: '251.902 ± 0.024', base: '298.9 ± 0.15', color: '#F04028' },
    { rango: 'periodo', en: 'Carboniferous', es: 'Carbonífero', techo: '298.9 ± 0.15', base: '358.86 ± 0.19', color: '#67A599' },
    { rango: 'periodo', en: 'Devonian', es: 'Devónico', techo: '358.86 ± 0.19', base: '419.62 ± 1.36', color: '#CB8C37' },
    { rango: 'periodo', en: 'Silurian', es: 'Silúrico', techo: '419.62 ± 1.36', base: '443.1 ± 0.9', color: '#B3E1B6' },
    { rango: 'periodo', en: 'Ordovician', es: 'Ordovícico', techo: '443.1 ± 0.9', base: '486.85 ± 1.5', color: '#009270' },
    { rango: 'periodo', en: 'Cambrian', es: 'Cámbrico', techo: '486.85 ± 1.5', base: '538.8 ± 0.6', color: '#7FA056' },
    { rango: 'periodo', en: 'Ediacaran', es: 'Ediacariano', techo: '538.8 ± 0.6', base: '~635', color: '#FED96A' },
    { rango: 'periodo', en: 'Cryogenian', es: 'Criogeniano', techo: '~635', base: '~720', color: '#FECC5C' },
    { rango: 'periodo', en: 'Tonian', es: 'Toniano', techo: '~720', base: '1000', color: '#FEBF4E' },
    { rango: 'periodo', en: 'Stenian', es: 'Steniano', techo: '1000', base: '1200', color: '#FED99A' },
    { rango: 'periodo', en: 'Ectasian', es: 'Ectasiano', techo: '1200', base: '1400', color: '#FDCC8A' },
    { rango: 'periodo', en: 'Calymmian', es: 'Calymmiano', techo: '1400', base: '1600', color: '#FDC07A' },
    { rango: 'periodo', en: 'Statherian', es: 'Statheriano', techo: '1600', base: '1800', color: '#F875A7' },
    { rango: 'periodo', en: 'Orosirian', es: 'Orosiriano', techo: '1800', base: '2050', color: '#F76898' },
    { rango: 'periodo', en: 'Rhyacian', es: 'Rhyaciano', techo: '2050', base: '2300', color: '#F75B89' },
    { rango: 'periodo', en: 'Siderian', es: 'Sideriano', techo: '2300', base: '2500', color: '#F74F7C' },

    // Épocas (series)
    { rango: 'epoca', en: 'Holocene', es: 'Holoceno', techo: '0', base: '0.0117', color: '#FEEBD2' },
    { rango: 'epoca', en: 'Pleistocene', es: 'Pleistoceno', techo: '0.0117', base: '2.58', color: '#FFEFAF' },
    { rango: 'epoca', en: 'Pliocene', es: 'Plioceno', techo: '2.58', base: '5.333', color: '#FFFF99' },
    { rango: 'epoca', en: 'Miocene', es: 'Mioceno', techo: '5.333', base: '23.04', color: '#FFFF00' },
    { rango: 'epoca', en: 'Oligocene', es: 'Oligoceno', techo: '23.04', base: '33.9', color: '#FEC07A' },
    { rango: 'epoca', en: 'Eocene', es: 'Eoceno', techo: '33.9', base: '56.00', color: '#FDB46C' },
    { rango: 'epoca', en: 'Paleocene', es: 'Paleoceno', techo: '56.00', base: '66.00', color: '#FDA75F' },
    { rango: 'epoca', en: 'Upper Cretaceous', es: 'Cretácico Superior', techo: '66.00', base: '100.5 ± 0.1', color: '#A6D84A' },
    { rango: 'epoca', en: 'Lower Cretaceous', es: 'Cretácico Inferior', techo: '100.5 ± 0.1', base: '143.1 ± 0.6', color: '#8CCD57' },
    { rango: 'epoca', en: 'Upper Jurassic', es: 'Jurásico Superior', techo: '143.1 ± 0.6', base: '161.5 ± 1.0', color: '#B3E3EE' },
    { rango: 'epoca', en: 'Middle Jurassic', es: 'Jurásico Medio', techo: '161.5 ± 1.0', base: '174.7 ± 0.8', color: '#80CFD8' },
    { rango: 'epoca', en: 'Lower Jurassic', es: 'Jurásico Inferior', techo: '174.7 ± 0.8', base: '201.4 ± 0.2', color: '#42AED0' },
    { rango: 'epoca', en: 'Upper Triassic', es: 'Triásico Superior', techo: '201.4 ± 0.2', base: '~237', color: '#BD8CC3' },
    { rango: 'epoca', en: 'Middle Triassic', es: 'Triásico Medio', techo: '~237', base: '247.0', color: '#B168B1' },
    { rango: 'epoca', en: 'Lower Triassic', es: 'Triásico Inferior', techo: '247.0', base: '251.902 ± 0.024', color: '#983999' },
    { rango: 'epoca', en: 'Lopingian', es: 'Lopingiano', techo: '251.902 ± 0.024', base: '259.857 ± 0.084', color: '#FBA794' },
    { rango: 'epoca', en: 'Guadalupian', es: 'Guadalupiano', techo: '259.857 ± 0.084', base: '274.4 ± 0.4', color: '#FB745C' },
    { rango: 'epoca', en: 'Cisuralian', es: 'Cisuraliano', techo: '274.4 ± 0.4', base: '298.9 ± 0.15', color: '#EF5845' },
    { rango: 'epoca', en: 'Upper Pennsylvanian', es: 'Pensilvaniano Superior', techo: '298.9 ± 0.15', base: '307.0 ± 0.1', color: '#BFD0BA' },
    { rango: 'epoca', en: 'Middle Pennsylvanian', es: 'Pensilvaniano Medio', techo: '307.0 ± 0.1', base: '315.2 ± 0.2', color: '#A6C7B7' },
    { rango: 'epoca', en: 'Lower Pennsylvanian', es: 'Pensilvaniano Inferior', techo: '315.2 ± 0.2', base: '323.4 ± 0.4', color: '#8CBEB4' },
    { rango: 'epoca', en: 'Upper Mississippian', es: 'Misisipiano Superior', techo: '323.4 ± 0.4', base: '330.3 ± 0.4', color: '#B3BE6C' },
    { rango: 'epoca', en: 'Middle Mississippian', es: 'Misisipiano Medio', techo: '330.3 ± 0.4', base: '346.7 ± 0.4', color: '#99B46C' },
    { rango: 'epoca', en: 'Lower Mississippian', es: 'Misisipiano Inferior', techo: '346.7 ± 0.4', base: '358.86 ± 0.19', color: '#80AB6C' },
    { rango: 'epoca', en: 'Upper Devonian', es: 'Devónico Superior', techo: '358.86 ± 0.19', base: '382.31 ± 1.36', color: '#F1E19D' },
    { rango: 'epoca', en: 'Middle Devonian', es: 'Devónico Medio', techo: '382.31 ± 1.36', base: '393.47 ± 0.99', color: '#F1C868' },
    { rango: 'epoca', en: 'Lower Devonian', es: 'Devónico Inferior', techo: '393.47 ± 0.99', base: '419.62 ± 1.36', color: '#E5AC4D' },
    { rango: 'epoca', en: 'Pridoli', es: 'Pridoliano', techo: '419.62 ± 1.36', base: '422.7 ± 1.6', color: '#E6F5E1' },
    { rango: 'epoca', en: 'Ludlow', es: 'Ludloviano', techo: '422.7 ± 1.6', base: '426.7 ± 1.5', color: '#BFE6CF' },
    { rango: 'epoca', en: 'Wenlock', es: 'Wenlockiano', techo: '426.7 ± 1.5', base: '432.9 ± 1.2', color: '#B3E1C2' },
    { rango: 'epoca', en: 'Llandovery', es: 'Llandoveriano', techo: '432.9 ± 1.2', base: '443.1 ± 0.9', color: '#99D7B3' },
    { rango: 'epoca', en: 'Upper Ordovician', es: 'Ordovícico Superior', techo: '443.1 ± 0.9', base: '458.2 ± 0.7', color: '#7FCA93' },
    { rango: 'epoca', en: 'Middle Ordovician', es: 'Ordovícico Medio', techo: '458.2 ± 0.7', base: '471.3 ± 1.4', color: '#4DB47E' },
    { rango: 'epoca', en: 'Lower Ordovician', es: 'Ordovícico Inferior', techo: '471.3 ± 1.4', base: '486.85 ± 1.5', color: '#1A9D6F' },
    { rango: 'epoca', en: 'Furongian', es: 'Furongiano', techo: '486.85 ± 1.5', base: '~497.0', color: '#B3E095' },
    { rango: 'epoca', en: 'Miaolingian', es: 'Miaolingiano', techo: '~497.0', base: '~506.5', color: '#A6CF86' },
    { rango: 'epoca', en: 'Series 2', es: 'Serie 2', techo: '~506.5', base: '~521.0', color: '#99C078', informal: true },
    { rango: 'epoca', en: 'Terreneuvian', es: 'Terreneuviano', techo: '~521.0', base: '538.8 ± 0.6', color: '#8CB06C' },

    // Edades (pisos)
    { rango: 'edad', en: 'Meghalayan', es: 'Megalayiano', techo: '0', base: '0.0042', color: '#FDEDEC' },
    { rango: 'edad', en: 'Northgrippian', es: 'Norgripiano', techo: '0.0042', base: '0.0082', color: '#FDECE4' },
    { rango: 'edad', en: 'Greenlandian', es: 'Groenlandiano', techo: '0.0082', base: '0.0117', color: '#FEECDB' },
    { rango: 'edad', en: 'Upper Pleistocene', es: 'Pleistoceno Superior', techo: '0.0117', base: '0.129', color: '#FFF2D3', informal: true },
    { rango: 'edad', en: 'Chibanian', es: 'Chibaniano', techo: '0.129', base: '0.774', color: '#FFF2C7' },
    { rango: 'edad', en: 'Calabrian', es: 'Calabriano', techo: '0.774', base: '1.80', color: '#FFF2BA' },
    { rango: 'edad', en: 'Gelasian', es: 'Gelasiano', techo: '1.80', base: '2.58', color: '#FFEDB3' },
    { rango: 'edad', en: 'Piacenzian', es: 'Piacenziano', techo: '2.58', base: '3.600', color: '#FFFFBF' },
    { rango: 'edad', en: 'Zanclean', es: 'Zancliano', techo: '3.600', base: '5.333', color: '#FFFFB3' },
    { rango: 'edad', en: 'Messinian', es: 'Mesiniano', techo: '5.333', base: '7.246', color: '#FFFF73' },
    { rango: 'edad', en: 'Tortonian', es: 'Tortoniano', techo: '7.246', base: '11.63', color: '#FFFF66' },
    { rango: 'edad', en: 'Serravallian', es: 'Serravaliano', techo: '11.63', base: '13.82', color: '#FFFF59' },
    { rango: 'edad', en: 'Langhian', es: 'Langhiano', techo: '13.82', base: '15.98', color: '#FFFF4D' },
    { rango: 'edad', en: 'Burdigalian', es: 'Burdigaliano', techo: '15.98', base: '20.45', color: '#FFFF41' },
    { rango: 'edad', en: 'Aquitanian', es: 'Aquitaniano', techo: '20.45', base: '23.04', color: '#FFFF33' },
    { rango: 'edad', en: 'Chattian', es: 'Chattiano', techo: '23.04', base: '27.30', color: '#FEE6AA' },
    { rango: 'edad', en: 'Rupelian', es: 'Rupeliano', techo: '27.30', base: '33.9', color: '#FED99A' },
    { rango: 'edad', en: 'Priabonian', es: 'Priaboniano', techo: '33.9', base: '37.71', color: '#FDCDA1' },
    { rango: 'edad', en: 'Bartonian', es: 'Bartoniano', techo: '37.71', base: '41.03', color: '#FDC091' },
    { rango: 'edad', en: 'Lutetian', es: 'Lutetiano', techo: '41.03', base: '48.07', color: '#FDB482' },
    { rango: 'edad', en: 'Ypresian', es: 'Ypresiano', techo: '48.07', base: '56.00', color: '#FCA773' },
    { rango: 'edad', en: 'Thanetian', es: 'Thanetiano', techo: '56.00', base: '59.24', color: '#FDBF6F' },
    { rango: 'edad', en: 'Selandian', es: 'Selandiano', techo: '59.24', base: '61.66', color: '#FEBF65' },
    { rango: 'edad', en: 'Danian', es: 'Daniano', techo: '61.66', base: '66.00', color: '#FDB462' },
    { rango: 'edad', en: 'Maastrichtian', es: 'Maastrichtiano', techo: '66.00', base: '72.2 ± 0.2', color: '#F2FA8C' },
    { rango: 'edad', en: 'Campanian', es: 'Campaniano', techo: '72.2 ± 0.2', base: '83.6 ± 0.2', color: '#E6F47F' },
    { rango: 'edad', en: 'Santonian', es: 'Santoniano', techo: '83.6 ± 0.2', base: '85.7 ± 0.2', color: '#D9EF74' },
    { rango: 'edad', en: 'Coniacian', es: 'Coniaciano', techo: '85.7 ± 0.2', base: '89.8 ± 0.3', color: '#CCE968' },
    { rango: 'edad', en: 'Turonian', es: 'Turoniano', techo: '89.8 ± 0.3', base: '93.9 ± 0.2', color: '#BFE35D' },
    { rango: 'edad', en: 'Cenomanian', es: 'Cenomaniano', techo: '93.9 ± 0.2', base: '100.5 ± 0.1', color: '#B3DE53' },
    { rango: 'edad', en: 'Albian', es: 'Albiano', techo: '100.5 ± 0.1', base: '113.2 ± 0.3', color: '#CCEA97' },
    { rango: 'edad', en: 'Aptian', es: 'Aptiano', techo: '113.2 ± 0.3', base: '121.4 ± 0.6', color: '#BFE48A' },
    { rango: 'edad', en: 'Barremian', es: 'Barremiano', techo: '121.4 ± 0.6', base: '125.77', color: '#B3DF7F' },
    { rango: 'edad', en: 'Hauterivian', es: 'Hauteriviano', techo: '125.77', base: '132.6 ± 0.6', color: '#A6D975' },
    { rango: 'edad', en: 'Valanginian', es: 'Valanginiano', techo: '132.6 ± 0.6', base: '137.05 ± 0.2', color: '#99D36A' },
    { rango: 'edad', en: 'Berriasian', es: 'Berriasiano', techo: '137.05 ± 0.2', base: '143.1 ± 0.6', color: '#8CCD60' },
    { rango: 'edad', en: 'Tithonian', es: 'Titoniano', techo: '143.1 ± 0.6', base: '149.2 ± 0.7', color: '#D9F1F7' },
    { rango: 'edad', en: 'Kimmeridgian', es: 'Kimmeridgiano', techo: '149.2 ± 0.7', base: '154.8 ± 0.8', color: '#CCECF4' },
    { rango: 'edad', en: 'Oxfordian', es: 'Oxfordiano', techo: '154.8 ± 0.8', base: '161.5 ± 1.0', color: '#BFE7F1' },
    { rango: 'edad', en: 'Callovian', es: 'Calloviano', techo: '161.5 ± 1.0', base: '165.3 ± 1.1', color: '#BFE7E5' },
    { rango: 'edad', en: 'Bathonian', es: 'Bathoniano', techo: '165.3 ± 1.1', base: '168.2 ± 1.2', color: '#B3E2E3' },
    { rango: 'edad', en: 'Bajocian', es: 'Bajociano', techo: '168.2 ± 1.2', base: '170.9 ± 0.8', color: '#A6DDE0' },
    { rango: 'edad', en: 'Aalenian', es: 'Aaleniano', techo: '170.9 ± 0.8', base: '174.7 ± 0.8', color: '#9AD9DD' },
    { rango: 'edad', en: 'Toarcian', es: 'Toarciano', techo: '174.7 ± 0.8', base: '184.2 ± 0.3', color: '#99CEE3' },
    { rango: 'edad', en: 'Pliensbachian', es: 'Pliensbachiano', techo: '184.2 ± 0.3', base: '192.9 ± 0.3', color: '#80C5DD' },
    { rango: 'edad', en: 'Sinemurian', es: 'Sinemuriano', techo: '192.9 ± 0.3', base: '199.5 ± 0.3', color: '#67BCD8' },
    { rango: 'edad', en: 'Hettangian', es: 'Hettangiano', techo: '199.5 ± 0.3', base: '201.4 ± 0.2', color: '#4EB3D3' },
    { rango: 'edad', en: 'Rhaetian', es: 'Rhaetiano', techo: '201.4 ± 0.2', base: '~205.7', color: '#E3B9DB' },
    { rango: 'edad', en: 'Norian', es: 'Noriano', techo: '~205.7', base: '~227.3', color: '#D6AAD3' },
    { rango: 'edad', en: 'Carnian', es: 'Carniano', techo: '~227.3', base: '~237', color: '#C99BCB' },
    { rango: 'edad', en: 'Ladinian', es: 'Ladiniano', techo: '~237', base: '241.464 ± 0.28', color: '#C983BF' },
    { rango: 'edad', en: 'Anisian', es: 'Anisiano', techo: '241.464 ± 0.28', base: '247.0', color: '#BC75B7' },
    { rango: 'edad', en: 'Olenekian', es: 'Olenekiano', techo: '247.0', base: '250.8', color: '#B051A5' },
    { rango: 'edad', en: 'Induan', es: 'Induano', techo: '250.8', base: '251.902 ± 0.024', color: '#A4469F' },
    { rango: 'edad', en: 'Changhsingian', es: 'Changhsingiano', techo: '251.902 ± 0.024', base: '254.14 ± 0.07', color: '#FCC0B2' },
    { rango: 'edad', en: 'Wuchiapingian', es: 'Wuchiapingiano', techo: '254.14 ± 0.07', base: '259.857 ± 0.084', color: '#FCB4A2' },
    { rango: 'edad', en: 'Capitanian', es: 'Capitaniano', techo: '259.857 ± 0.084', base: '264.28 ± 0.16', color: '#FB9A85' },
    { rango: 'edad', en: 'Wordian', es: 'Wordiano', techo: '264.28 ± 0.16', base: '266.9 ± 0.4', color: '#FB8D76' },
    { rango: 'edad', en: 'Roadian', es: 'Roadiano', techo: '266.9 ± 0.4', base: '274.4 ± 0.4', color: '#FB8069' },
    { rango: 'edad', en: 'Kungurian', es: 'Kunguriano', techo: '274.4 ± 0.4', base: '283.3 ± 0.4', color: '#E38776' },
    { rango: 'edad', en: 'Artinskian', es: 'Artinskiano', techo: '283.3 ± 0.4', base: '290.1 ± 0.26', color: '#E37B68' },
    { rango: 'edad', en: 'Sakmarian', es: 'Sakmariano', techo: '290.1 ± 0.26', base: '293.52 ± 0.17', color: '#E36F5C' },
    { rango: 'edad', en: 'Asselian', es: 'Asseliano', techo: '293.52 ± 0.17', base: '298.9 ± 0.15', color: '#E36350' },
    { rango: 'edad', en: 'Gzhelian', es: 'Gzheliano', techo: '298.9 ± 0.15', base: '303.7 ± 0.1', color: '#CCD4C7' },
    { rango: 'edad', en: 'Kasimovian', es: 'Kasimoviano', techo: '303.7 ± 0.1', base: '307.0 ± 0.1', color: '#BFD0C5' },
    { rango: 'edad', en: 'Moscovian', es: 'Moscoviano', techo: '307.0 ± 0.1', base: '315.2 ± 0.2', color: '#B3CBB9' },
    { rango: 'edad', en: 'Bashkirian', es: 'Bashkiriano', techo: '315.2 ± 0.2', base: '323.4 ± 0.4', color: '#99C2B5' },
    { rango: 'edad', en: 'Serpukhovian', es: 'Serpukhoviano', techo: '323.4 ± 0.4', base: '330.3 ± 0.4', color: '#BFC26B' },
    { rango: 'edad', en: 'Visean', es: 'Viseano', techo: '330.3 ± 0.4', base: '346.7 ± 0.4', color: '#A6B96C' },
    { rango: 'edad', en: 'Tournaisian', es: 'Tournaisiano', techo: '346.7 ± 0.4', base: '358.86 ± 0.19', color: '#8CB06C' },
    { rango: 'edad', en: 'Famennian', es: 'Famenniano', techo: '358.86 ± 0.19', base: '372.15 ± 0.46', color: '#F2EDB3' },
    { rango: 'edad', en: 'Frasnian', es: 'Frasniano', techo: '372.15 ± 0.46', base: '382.31 ± 1.36', color: '#F2EDAD' },
    { rango: 'edad', en: 'Givetian', es: 'Givetiano', techo: '382.31 ± 1.36', base: '387.95 ± 1.04', color: '#F1E185' },
    { rango: 'edad', en: 'Eifelian', es: 'Eifeliano', techo: '387.95 ± 1.04', base: '393.47 ± 0.99', color: '#F1D576' },
    { rango: 'edad', en: 'Emsian', es: 'Emsiano', techo: '393.47 ± 0.99', base: '410.62 ± 1.95', color: '#E5D075' },
    { rango: 'edad', en: 'Pragian', es: 'Pragiano', techo: '410.62 ± 1.95', base: '413.02 ± 1.91', color: '#E5C468' },
    { rango: 'edad', en: 'Lochkovian', es: 'Lochkoviano', techo: '413.02 ± 1.91', base: '419.62 ± 1.36', color: '#E5B75A' },
    { rango: 'edad', en: 'Ludfordian', es: 'Ludfordiano', techo: '422.7 ± 1.6', base: '425.0 ± 1.5', color: '#D9F0DF' },
    { rango: 'edad', en: 'Gorstian', es: 'Gorstiano', techo: '425.0 ± 1.5', base: '426.7 ± 1.5', color: '#CCECDD' },
    { rango: 'edad', en: 'Homerian', es: 'Homeriano', techo: '426.7 ± 1.5', base: '430.6 ± 1.3', color: '#CCEBD1' },
    { rango: 'edad', en: 'Sheinwoodian', es: 'Sheinwoodiano', techo: '430.6 ± 1.3', base: '432.9 ± 1.2', color: '#BFE6C3' },
    { rango: 'edad', en: 'Telychian', es: 'Telychiano', techo: '432.9 ± 1.2', base: '438.6 ± 1.0', color: '#BFE6CF' },
    { rango: 'edad', en: 'Aeronian', es: 'Aeroniano', techo: '438.6 ± 1.0', base: '440.5 ± 1.0', color: '#B3E1C2' },
    { rango: 'edad', en: 'Rhuddanian', es: 'Rhuddaniano', techo: '440.5 ± 1.0', base: '443.1 ± 0.9', color: '#A6DCB5' },
    { rango: 'edad', en: 'Hirnantian', es: 'Hirnantiano', techo: '443.1 ± 0.9', base: '445.2 ± 0.9', color: '#A6DBAB' },
    { rango: 'edad', en: 'Katian', es: 'Katiano', techo: '445.2 ± 0.9', base: '452.8 ± 0.7', color: '#99D69F' },
    { rango: 'edad', en: 'Sandbian', es: 'Sandbiano', techo: '452.8 ± 0.7', base: '458.2 ± 0.7', color: '#8CD094' },
    { rango: 'edad', en: 'Darriwilian', es: 'Darriwiliano', techo: '458.2 ± 0.7', base: '469.4 ± 0.9', color: '#74C69C' },
    { rango: 'edad', en: 'Dapingian', es: 'Dapingiano', techo: '469.4 ± 0.9', base: '471.3 ± 1.4', color: '#66C092' },
    { rango: 'edad', en: 'Floian', es: 'Floiano', techo: '471.3 ± 1.4', base: '477.1 ± 1.2', color: '#41B087' },
    { rango: 'edad', en: 'Tremadocian', es: 'Tremadociano', techo: '477.1 ± 1.2', base: '486.85 ± 1.5', color: '#33A97E' },
    { rango: 'edad', en: 'Stage 10', es: 'Piso 10', techo: '486.85 ± 1.5', base: '~491.0', color: '#E6F5C9', informal: true },
    { rango: 'edad', en: 'Jiangshanian', es: 'Jiangshaniano', techo: '~491.0', base: '~494.2', color: '#D9F0BB' },
    { rango: 'edad', en: 'Paibian', es: 'Paibiano', techo: '~494.2', base: '~497.0', color: '#CCEBAE' },
    { rango: 'edad', en: 'Guzhangian', es: 'Guzhangiano', techo: '~497.0', base: '~500.5', color: '#CCDFAA' },
    { rango: 'edad', en: 'Drumian', es: 'Drumiano', techo: '~500.5', base: '~504.5', color: '#BFD99D' },
    { rango: 'edad', en: 'Wuliuan', es: 'Wuliuano', techo: '~504.5', base: '~506.5', color: '#B3D492' },
    { rango: 'edad', en: 'Stage 4', es: 'Piso 4', techo: '~506.5', base: '~514.5', color: '#B3CA8E', informal: true },
    { rango: 'edad', en: 'Stage 3', es: 'Piso 3', techo: '~514.5', base: '~521.0', color: '#A6C583', informal: true },
    { rango: 'edad', en: 'Stage 2', es: 'Piso 2', techo: '~521.0', base: '~529.0', color: '#A6BA80', informal: true },
    { rango: 'edad', en: 'Fortunian', es: 'Fortuniano', techo: '~529.0', base: '538.8 ± 0.6', color: '#99B575' },
  ],
};
