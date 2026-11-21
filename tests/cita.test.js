// Pruebas del texto para citar (src/cita.js).
import { describe, expect, it } from 'vitest';
import { citaDeLaCarta, DOI_CARTA, fechaDeConsulta, textoDeCita } from '../src/cita.js';

describe('cita de la carta ICS', () => {
  // Textos de "Citar como" / "Cite" en el pie de los PDF de la v2026/06 (referencias/)
  it('en español, como la pide la versión en español', () => {
    expect(citaDeLaCarta('2026/06', 'es')).toBe(
      'Cohen, K., Harper, D., Gibbard, P. & Car, N. 2025 (actualizada a junio de 2026). The ICS ' +
        'international chronostratigraphic chart this decade. Episodes, 48(1): 105-115. ' +
        'https://doi.org/10.18814/epiiugs/2025/025001',
    );
  });

  it('en inglés, como la pide la carta en inglés', () => {
    expect(citaDeLaCarta('2026/06', 'en')).toBe(
      'Cohen K, Harper D, Gibbard P, Car N. The ICS international chronostratigraphic chart this ' +
        'decade. Episodes 2025;48:105-115. https://doi.org/10.18814/epiiugs/2025/025001',
    );
  });
});

describe('cita completa', () => {
  const fecha = new Date(2026, 10, 18);
  const url = 'https://ejemplo.github.io/geoescala/';

  it('fecha de consulta en cada idioma', () => {
    expect(fechaDeConsulta(fecha, 'es')).toBe('18 de noviembre de 2026');
    expect(fechaDeConsulta(fecha, 'en')).toBe('18 November 2026');
  });

  it.each(['es', 'en'])('en %s incluye la versión, el DOI, la dirección y la fecha', (idioma) => {
    const texto = textoDeCita({ version: '2026/06', idioma, url, fecha });
    expect(texto).toContain('v2026/06');
    expect(texto).toContain(DOI_CARTA);
    expect(texto).toContain(url);
    expect(texto).toContain(fechaDeConsulta(fecha, idioma));
    expect(texto).toContain('GeoEscala');
    expect(texto).not.toMatch(/\.\./);
  });

  it('nombra la carta como cada versión', () => {
    expect(textoDeCita({ version: '2026/06', idioma: 'es', url, fecha })).toMatch(
      /^Edades y colores: Tabla Cronoestratigráfica Internacional de la ICS v2026\/06 \(Cohen, K\./,
    );
    expect(textoDeCita({ version: '2026/06', idioma: 'en', url, fecha })).toMatch(
      /^Ages and colors: ICS International Chronostratigraphic Chart v2026\/06 \(Cohen K,/,
    );
  });
});
